import { Router, type Request, type Response } from "express";
import multer from "multer";
import { logger } from "../lib/logger";

const router = Router();
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = /^audio\/(aac|m4a|mp4|mpeg|mp3|wav|webm|x-m4a)$/i;
    if (allowed.test(file.mimetype) || /\.(aac|m4a|mp3|mp4|wav|webm)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported audio type."));
    }
  },
});

function getGroqKey(): string | undefined {
  return (
    process.env.GROQ_API_KEY ||
    process.env.VITE_GROQ_API_KEY ||
    process.env.EXPO_PUBLIC_GROQ_API_KEY
  );
}

router.post(
  "/transcribe",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const key = getGroqKey();
      if (!key) {
        res.status(500).json({ error: "Groq API key not configured on server." });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "Audio file is required." });
        return;
      }

      const body = new FormData();
      const audioBytes = new Uint8Array(req.file.buffer.length);
      audioBytes.set(req.file.buffer);
      body.append(
        "file",
        new Blob([audioBytes.buffer], { type: req.file.mimetype }),
        req.file.originalname || "voice.m4a",
      );
      body.append("model", "whisper-large-v3-turbo");
      body.append("response_format", "json");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/audio/transcriptions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${key}` },
            body,
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          throw new Error(`Groq transcription HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
        }

        const result = (await response.json()) as { text?: string };
        if (!result.text?.trim()) {
          throw new Error("Groq returned an empty transcript.");
        }
        res.json({ text: result.text.trim(), provider: "Groq Whisper" });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription failed.";
      logger.warn({ error: message }, "Voice transcription failed");
      res.status(500).json({ error: message });
    }
  },
);

export default router;