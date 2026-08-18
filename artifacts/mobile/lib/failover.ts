/**
 * AI provider failover — parallel race with AbortController.
 *
 * All available providers fire simultaneously.
 * Whichever responds first wins; losers are aborted (actual network cancel).
 * Timeout: 15 seconds per round, then retries once before giving up.
 */

export interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
}

export interface GenerateResult {
  text: string;
  provider: string;
}

const GEMINI_MODEL    = 'gemini-1.5-flash';
const GROQ_MODEL      = 'llama-3.3-70b-versatile';
const MISTRAL_MODEL   = 'mistral-small-latest';
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';

/** Hard network-cancel after this many ms. */
const TIMEOUT_MS = 15_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function abortAfter(ms: number): { signal: AbortSignal; clear: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(timer) };
}

async function safeFetch(url: string, init: RequestInit & { signal?: AbortSignal }): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${body ? ': ' + body.slice(0, 120) : ''}`);
  }
  return res;
}

// ─── Provider calls ───────────────────────────────────────────────────────────

async function callGemini(
  opts: GenerateOptions,
  key: string,
  signal: AbortSignal
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const contents: { role: string; parts: { text: string }[] }[] = [];
  if (opts.systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: opts.systemPrompt }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
  }
  contents.push({ role: 'user', parts: [{ text: opts.prompt }] });

  const res = await safeFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
    signal,
  });
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini: empty response');
  return text;
}

async function callOpenAICompatible(
  url: string,
  model: string,
  opts: GenerateOptions,
  key: string,
  signal: AbortSignal,
  extraHeaders?: Record<string, string>
): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
  messages.push({ role: 'user', content: opts.prompt });

  const res = await safeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...extraHeaders,
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 }),
    signal,
  });
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response');
  return text;
}

// ─── Provider registry ────────────────────────────────────────────────────────

interface Provider {
  name: string;
  getKey: () => string;
  generate: (opts: GenerateOptions, key: string, signal: AbortSignal) => Promise<string>;
}

const CHAIN: Provider[] = [
  {
    name: 'Groq',
    getKey: () => process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '',
    generate: (opts, key, signal) =>
      callOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', GROQ_MODEL, opts, key, signal),
  },
  {
    name: 'Gemini',
    getKey: () => process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
    generate: (opts, key, signal) => callGemini(opts, key, signal),
  },
  {
    name: 'Mistral',
    getKey: () => process.env.EXPO_PUBLIC_MISTRAL_API_KEY ?? '',
    generate: (opts, key, signal) =>
      callOpenAICompatible('https://api.mistral.ai/v1/chat/completions', MISTRAL_MODEL, opts, key, signal),
  },
  {
    name: 'OpenRouter',
    getKey: () => process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '',
    generate: (opts, key, signal) =>
      callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        OPENROUTER_MODEL,
        opts,
        key,
        signal,
        { 'HTTP-Referer': 'https://vertex-ai-chat.app', 'X-Title': 'Vertex AI Chat' }
      ),
  },
];

// ─── Race with real abort ─────────────────────────────────────────────────────

async function raceProviders(
  opts: GenerateOptions,
  providers: Provider[]
): Promise<GenerateResult> {
  // One AbortController per provider — winner aborts all losers.
  const controllers = providers.map(() => new AbortController());

  // Global timeout aborts ALL if nobody wins in time.
  const timeout = abortAfter(TIMEOUT_MS);

  // Abort everything when global timeout fires.
  timeout.signal.addEventListener('abort', () => {
    controllers.forEach((c) => c.abort());
  });

  const races = providers.map((p, i) => {
    // Merge per-provider abort with global timeout abort.
    const signal = controllers[i].signal;
    return p
      .generate(opts, p.getKey(), signal)
      .then((text): GenerateResult => {
        // Winner — abort all other providers immediately.
        controllers.forEach((c, j) => { if (j !== i) c.abort(); });
        return { text, provider: p.name };
      });
  });

  try {
    const result = await Promise.any(races);
    timeout.clear();
    return result;
  } catch (aggErr: any) {
    timeout.clear();
    const msgs: string[] = aggErr?.errors
      ? (aggErr.errors as Error[]).map((e: Error, i: number) => `${providers[i]?.name ?? i}: ${e.message}`)
      : [String(aggErr)];
    throw new Error(msgs.join(' | '));
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateWithFailover(opts: GenerateOptions): Promise<GenerateResult> {
  const available = CHAIN.filter((p) => !!p.getKey());

  if (available.length === 0) {
    throw new Error(
      'No API keys configured. Set EXPO_PUBLIC_GEMINI_API_KEY, EXPO_PUBLIC_GROQ_API_KEY, ' +
      'EXPO_PUBLIC_MISTRAL_API_KEY, or EXPO_PUBLIC_OPENROUTER_API_KEY.'
    );
  }

  // Round 1 — race all providers.
  try {
    return await raceProviders(opts, available);
  } catch {
    // Round 2 — one retry after a brief pause (in case of transient errors).
    await new Promise((r) => setTimeout(r, 1500));
    return await raceProviders(opts, available);
  }
}
