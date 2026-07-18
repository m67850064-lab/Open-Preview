import { Router, type Request, type Response } from "express";
import multer from "multer";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const router = Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const responseText = result.response.text();
    res.json({ text: responseText, provider: "Gemini" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
