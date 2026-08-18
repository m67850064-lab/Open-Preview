import { Router, type Request, type Response } from "express";
import multer from "multer";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { AI_SYSTEM_PROMPT } from "../lib/aiSystemPrompt";

const router = Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const PRIMARY_GEMINI_MODEL = "gemini-1.5-flash";
const FALLBACK_GEMINI_MODEL = "gemini-2.5-flash";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image\/(jpeg|png)|application\/pdf|text\/plain)$/i;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only JPG, PNG, PDF and TXT are allowed."));
    }
  },
});

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
}

function isModelUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("404") &&
    (normalized.includes("not found") ||
      normalized.includes("not supported") ||
      normalized.includes("does not exist"))
  );
}

router.post("/gemini", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      res.status(500).json({ error: "Gemini API key not configured" });
      return;
    }

    const text = (req.body.text as string | undefined) ?? "";
    const file = req.file;

    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);

    const parts: Part[] = [];

    if (file) {
      if (file.mimetype.startsWith("image/")) {
        parts.push({
          inlineData: {
            data: file.buffer.toString("base64"),
            mimeType: file.mimetype,
          },
        } as Part);
      } else {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gemini-upload-"));
        const extension = file.mimetype === "text/plain" ? ".txt" : ".pdf";
        const tmpPath = path.join(tmpDir, `upload${extension}`);
        await fs.writeFile(tmpPath, file.buffer);

        try {
          const uploadResult = await fileManager.uploadFile(tmpPath, {
            mimeType: file.mimetype,
            displayName: file.originalname || `upload${extension}`,
          });
          parts.push({
            fileData: {
              fileUri: uploadResult.file.uri,
              mimeType: file.mimetype,
            },
          } as Part);
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }
      }
    }

    if (text.trim()) {
      parts.unshift({ text } as Part);
    }

    if (parts.length === 0) {
      res.status(400).json({ error: "No text or file provided" });
      return;
    }

    const contents = [
      { role: "user" as const, parts: [{ text: AI_SYSTEM_PROMPT }] },
      { role: "model" as const, parts: [{ text: "Understood." }] },
      { role: "user" as const, parts },
    ];

    let result;
    try {
      const model = genAI.getGenerativeModel({ model: PRIMARY_GEMINI_MODEL });
      result = await model.generateContent({ contents });
    } catch (error) {
      if (!isModelUnavailableError(error)) throw error;

      console.warn(
        `[Gemini] ${PRIMARY_GEMINI_MODEL} is unavailable; retrying with ${FALLBACK_GEMINI_MODEL}`,
      );
      const fallbackModel = genAI.getGenerativeModel({
        model: FALLBACK_GEMINI_MODEL,
      });
      result = await fallbackModel.generateContent({ contents });
    }

    const responseText = result.response.text();
    res.json({ text: responseText, provider: "Gemini" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
