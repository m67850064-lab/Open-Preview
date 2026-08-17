import { Platform } from 'react-native';
import type { ChatAttachment } from './fileUpload';

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN || 'localhost'}/api`;

// ─── Text chat via server (server has fast internet) ──────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendTextOptions {
  prompt: string;
  history?: ChatMessage[];
}

export async function sendTextToServer({ prompt, history = [] }: SendTextOptions): Promise<{ text: string; provider: string }> {
  const controller = new AbortController();
  // The server tries four providers sequentially, each with an 8-second
  // timeout, so allow the full fallback chain plus connection overhead.
  const timer = setTimeout(() => controller.abort(), 40_000);

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(body || `Server error ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

// ─── File + text via server ───────────────────────────────────────────────────

export interface SendToBackendOptions {
  text: string;
  attachment?: ChatAttachment;
}

export async function sendToBackend({ text, attachment }: SendToBackendOptions): Promise<{ text: string }> {
  const form = new FormData();
  form.append('text', text);

  if (attachment) {
    const filePart = await attachmentToFormDataPart(attachment);
    form.append('file', filePart as any);
  }

  const response = await fetch(`${API_BASE}/gemini`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => 'Request failed');
    throw new Error(body || `Server error ${response.status}`);
  }

  return response.json();
}

async function attachmentToFormDataPart(
  attachment: ChatAttachment
): Promise<File | { uri: string; name: string; type: string }> {
  if (Platform.OS === 'web') {
    const res = await fetch(attachment.uri);
    const blob = await res.blob();
    return new File([blob], attachment.name, { type: attachment.mimeType });
  }
  return { uri: attachment.uri, name: attachment.name, type: attachment.mimeType };
}
