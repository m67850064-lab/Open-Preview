import { Platform } from 'react-native';
import type { ChatAttachment } from './fileUpload';

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN || 'localhost'}/api`;

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

async function attachmentToFormDataPart(attachment: ChatAttachment): Promise<File | { uri: string; name: string; type: string }> {
  if (Platform.OS === 'web') {
    const res = await fetch(attachment.uri);
    const blob = await res.blob();
    return new File([blob], attachment.name, { type: attachment.mimeType });
  }

  return {
    uri: attachment.uri,
    name: attachment.name,
    type: attachment.mimeType,
  };
}
