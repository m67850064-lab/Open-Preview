/**
 * AI provider failover chain — parallel race strategy.
 *
 * All available providers are fired simultaneously.
 * Whichever responds first wins; the rest are silently ignored.
 * This eliminates sequential timeout waits and gives the fastest
 * possible response regardless of which provider is healthiest.
 *
 * Chain: Groq → Gemini → Mistral → OpenRouter
 * Keys read from EXPO_PUBLIC_* env vars.
 */

export interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
}

export interface GenerateResult {
  text: string;
  provider: string;
}

const GEMINI_MODEL = 'gemini-2.0-flash-lite';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MISTRAL_MODEL = 'mistral-small-latest';
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';

// Per-request timeout (ms). If a provider doesn't reply within this,
// it's treated as failed for this race — another provider still wins.
const PROVIDER_TIMEOUT_MS = 12000;

interface Provider {
  name: string;
  getKey: () => string;
  generate: (opts: GenerateOptions, key: string) => Promise<string>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label}: timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

async function callGemini(opts: GenerateOptions, key: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const contents: { role: string; parts: { text: string }[] }[] = [];
  if (opts.systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: opts.systemPrompt }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
  }
  contents.push({ role: 'user', parts: [{ text: opts.prompt }] });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini: empty response');
  return text;
}

async function callOpenAICompatible(
  url: string,
  model: string,
  opts: GenerateOptions,
  key: string,
  extraHeaders?: Record<string, string>
): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
  messages.push({ role: 'user', content: opts.prompt });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...extraHeaders,
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response');
  return text;
}

const CHAIN: Provider[] = [
  {
    name: 'Groq',
    getKey: () => process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '',
    generate: (opts, key) =>
      callOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', GROQ_MODEL, opts, key),
  },
  {
    name: 'Gemini',
    getKey: () => process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
    generate: (opts, key) => callGemini(opts, key),
  },
  {
    name: 'Mistral',
    getKey: () => process.env.EXPO_PUBLIC_MISTRAL_API_KEY ?? '',
    generate: (opts, key) =>
      callOpenAICompatible('https://api.mistral.ai/v1/chat/completions', MISTRAL_MODEL, opts, key),
  },
  {
    name: 'OpenRouter',
    getKey: () => process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '',
    generate: (opts, key) =>
      callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        OPENROUTER_MODEL,
        opts,
        key,
        {
          'HTTP-Referer': 'https://vertex-ai-chat.app',
          'X-Title': 'Vertex AI Chat',
        }
      ),
  },
];

export async function generateWithFailover(opts: GenerateOptions): Promise<GenerateResult> {
  const available = CHAIN.filter((p) => !!p.getKey());

  if (available.length === 0) {
    throw new Error(
      'No API keys configured. Set EXPO_PUBLIC_GEMINI_API_KEY, EXPO_PUBLIC_GROQ_API_KEY, ' +
      'EXPO_PUBLIC_MISTRAL_API_KEY, or EXPO_PUBLIC_OPENROUTER_API_KEY.'
    );
  }

  // Fire all providers simultaneously — first successful response wins.
  const races = available.map((p) =>
    withTimeout(p.generate(opts, p.getKey()), PROVIDER_TIMEOUT_MS, p.name).then(
      (text): GenerateResult => ({ text, provider: p.name })
    )
  );

  // Promise.any resolves with the first fulfilled promise.
  // If ALL reject (network down, bad keys, etc.), it throws AggregateError.
  try {
    return await Promise.any(races);
  } catch (aggErr: any) {
    // AggregateError: collect individual messages
    const errors: string[] = aggErr?.errors
      ? (aggErr.errors as Error[]).map((e, i) => `${available[i]?.name ?? i}: ${e.message}`)
      : [String(aggErr)];
    throw new Error(`All providers failed:\n${errors.join('\n')}`);
  }
}
