---
name: Gemini model availability
description: Verify which Gemini model aliases are available for the configured API key.
---

Not all Gemini model aliases are usable with every API key/project. The project's configured key returned `404 Not Found` for `gemini-1.5-flash-latest` and other 1.5 aliases, while `gemini-2.5-flash` was available and returned responses.

**Why:** The API key/project may be restricted to newer model families or may have no quota remaining for older models. A 404 from the Gemini `generateContent` endpoint does not necessarily mean the code is wrong; it may mean the model is not accessible.

**How to apply:**
- Use `curl "https://generativelanguage.googleapis.com/v1beta/models?key=$KEY"` to list available models before committing to a model name.
- Prefer a supported model such as `gemini-2.5-flash` for both the backend route and the mobile client-side failover chain.
- If a request returns 429, that indicates quota exhaustion rather than a missing model.
