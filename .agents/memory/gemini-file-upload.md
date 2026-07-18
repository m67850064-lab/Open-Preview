---
name: Gemini file upload via File API
description: Use Gemini's File API for PDF/TXT documents instead of local parsing libraries.
---

For document uploads sent to the backend Gemini API, use the Gemini File API (`GoogleAIFileManager` from `@google/generative-ai/server`) rather than parsing PDF/TXT locally.

**Why:** A local PDF parsing library (`pdf-parse`) was installed in the monorepo's root `node_modules` and caused the Expo Metro bundler to fail with an `ENOENT` error while trying to watch a broken temporary directory inside the package. Removing the parser and using the File API eliminated the bundler crash and let the model read the document directly.

**How to apply:**
- In `api-server`, import `GoogleAIFileManager` from `@google/generative-ai/server`.
- Accept the file in memory via `multer`, write it to a temp file, and call `fileManager.uploadFile(tmpPath, { mimeType, displayName })`.
- Use the returned `file.uri` as a `fileData` part in the `generateContent` request.
- Clean up the temp file in a `finally` block.
- For images, small files can be sent inline; larger files can also use the File API.
