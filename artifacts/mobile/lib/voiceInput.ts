import { Platform } from 'react-native';

// ─── Web Speech Recognition ───────────────────────────────────────────────────

let recognition: any = null;

function getWebRecognition(): any {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  }
  return recognition;
}

export function isVoiceSupported(): boolean {
  if (Platform.OS === 'web') {
    return !!getWebRecognition();
  }
  // Native: always supported via expo-av + Groq Whisper
  return true;
}

// ─── Native recording (expo-av + Groq Whisper) ────────────────────────────────

let nativeRecording: any = null;

async function startNativeRecording(): Promise<void> {
  const { Audio } = await import('expo-av');
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  const rec = new Audio.Recording();
  await rec.prepareToRecordAsync({
    android: {
      extension: '.mp4',
      outputFormat: 2, // MPEG_4
      audioEncoder: 3, // AAC
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      audioQuality: 127, // MAX
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  });
  await rec.startAsync();
  nativeRecording = rec;
}

async function stopNativeRecording(): Promise<string | null> {
  if (!nativeRecording) return null;
  try {
    await nativeRecording.stopAndUnloadAsync();
    const uri = nativeRecording.getURI();
    nativeRecording = null;

    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey || !uri) return null;

    // Build multipart form data
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'audio.m4a';
    const ext = filename.split('.').pop() ?? 'm4a';
    const mimeType = ext === 'mp4' ? 'audio/mp4' : ext === 'webm' ? 'audio/webm' : 'audio/m4a';

    formData.append('file', { uri, name: filename, type: mimeType } as any);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.text ?? null;
  } catch {
    nativeRecording = null;
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function startListening(onResult: (text: string) => void): Promise<void> {
  if (Platform.OS === 'web') {
    const rec = getWebRecognition();
    if (!rec) return;
    rec.lang = navigator.language || 'en-US';
    rec.onresult = (event: any) => {
      const transcript: string = event.results[0]?.[0]?.transcript ?? '';
      if (transcript.trim()) onResult(transcript.trim());
    };
    rec.onerror = () => {};
    rec.start();
  } else {
    await startNativeRecording();
  }
}

export async function stopListening(onResult: (text: string) => void): Promise<void> {
  if (Platform.OS === 'web') {
    const rec = getWebRecognition();
    if (rec) rec.stop();
  } else {
    const text = await stopNativeRecording();
    if (text) onResult(text);
  }
}

export function cancelListening(): void {
  if (Platform.OS === 'web') {
    const rec = getWebRecognition();
    if (rec) rec.abort();
  } else {
    if (nativeRecording) {
      nativeRecording.stopAndUnloadAsync().catch(() => {});
      nativeRecording = null;
    }
  }
}
