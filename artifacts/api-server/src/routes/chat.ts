/**
 * POST /api/chat — text-only AI with server-side parallel failover.
 *
 * The server has good internet; device only needs to reach Replit.
 * Groq → Gemini → Mistral → OpenRouter all race simultaneously.
 * First to respond wins; losers are aborted.
 */
import { Router, type Request, type Response } from "express";

const router = Router();

const GEMINI_MODEL    = "gemini-2.0-flash-lite";
const GROQ_MODEL      = "llama-3.3-70b-versatile";
const MISTRAL_MODEL   = "mistral-small-latest";
const OPENROUTER_MODEL = "openai/gpt-4o-mini";

const TIMEOUT_MS = 20_000;

const SYSTEM_PROMPT =
  "You are Vertex AI, a friendly and helpful conversational assistant. " +
  "Reply directly and naturally in the same language the user speaks — " +
  "whether that is English, Hindi, Roman Urdu, or any other language. " +
  "Be concise, clear, and conversational. Do not echo or repeat the user's " +
  "question back. Just answer helpfully.";

interface ChatMessage {
  role: "user" | "assistant" | "model";
  content: string;
}

interface Provider {
  name: string;
  key: string | undefined;
  call: (prompt: string, history: ChatMessage[], signal: AbortSignal) => Promise<string>;
}

// ─── Gemini ────────────────────────────────────────────────────────────────────
async function callGemini(prompt: string, history: ChatMessage[], signal: AbortSignal): Promise<string> {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error("No Gemini key");

  const contents: { role: string; parts: { text: string }[] }[] = [
    { role: "user",  parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Understood." }] },
  ];

  // Include conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }
  contents.push({ role: "user", parts: [{ text: prompt }] });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
      signal,
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json() as any;
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini empty response");
  return text;
}

// ─── OpenAI-compatible (Groq, Mistral, OpenRouter) ────────────────────────────
async function callOpenAI(
  url: string,
  model: string,
  key: string,
  prompt: string,
  history: ChatMessage[],
  signal: AbortSignal,
  extra?: Record<string, string>
): Promise<string> {
  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role === "model" ? "assistant" : m.role, content: m.content })),
    { role: "user", content: prompt },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...extra },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 }),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as any;
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response");
  return text;
}

// ─── Race all providers ────────────────────────────────────────────────────────
async function raceProviders(prompt: string, history: ChatMessage[]): Promise<{ text: string; provider: string }> {
  const providers: { name: string; fn: (signal: AbortSignal) => Promise<string> }[] = [];

  const groqKey  = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const mistralKey = process.env.EXPO_PUBLIC_MISTRAL_API_KEY;
  const openrouterKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

  if (groqKey) providers.push({
    name: "Groq",
    fn: (s) => callOpenAI("https://api.groq.com/openai/v1/chat/completions", GROQ_MODEL, groqKey, prompt, history, s),
  });
  if (geminiKey) providers.push({
    name: "Gemini",
    fn: (s) => callGemini(prompt, history, s),
  });
  if (mistralKey) providers.push({
    name: "Mistral",
    fn: (s) => callOpenAI("https://api.mistral.ai/v1/chat/completions", MISTRAL_MODEL, mistralKey, prompt, history, s),
  });
  if (openrouterKey) providers.push({
    name: "OpenRouter",
    fn: (s) => callOpenAI(
      "https://openrouter.ai/api/v1/chat/completions", OPENROUTER_MODEL, openrouterKey, prompt, history, s,
      { "HTTP-Referer": "https://vertex-ai-chat.app", "X-Title": "Vertex AI Chat" }
    ),
  });

  if (providers.length === 0) throw new Error("No API keys configured on server");

  const controllers = providers.map(() => new AbortController());

  // Global timeout
  const globalTimer = setTimeout(() => controllers.forEach((c) => c.abort()), TIMEOUT_MS);

  const races = providers.map((p, i) =>
    p.fn(controllers[i].signal).then((text) => {
      // Winner aborts everyone else
      controllers.forEach((c, j) => { if (j !== i) c.abort(); });
      return { text, provider: p.name };
    })
  );

  try {
    const result = await Promise.any(races);
    clearTimeout(globalTimer);
    return result;
  } catch (err: any) {
    clearTimeout(globalTimer);
    const msgs: string[] = err?.errors
      ? (err.errors as Error[]).map((e: Error, i: number) => `${providers[i]?.name ?? i}: ${e.message}`)
      : [String(err)];
    throw new Error(msgs.join(" | "));
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { prompt, history = [] } = req.body as { prompt: string; history?: ChatMessage[] };

    if (!prompt?.trim()) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const result = await raceProviders(prompt.trim(), Array.isArray(history) ? history : []);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
