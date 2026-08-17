---
name: Native build API configuration
description: Rules for keeping Android/iOS builds connected and preventing provider key exposure.
---

Standalone APK/AAB binaries cannot use a localhost API fallback and must receive a public HTTPS API URL at build time. Provider credentials, including speech-transcription credentials, must stay on the server; `EXPO_PUBLIC_*` values are bundled into the client and are not secret.

**Why:** A native device's `localhost` points to the device itself, not the Replit API server, and any client-bundled provider key can be extracted from the binary.

**How to apply:** Configure `EXPO_PUBLIC_API_URL` (or the server domain) for every native build profile, fail explicitly if it is missing on native, and proxy AI/transcription requests through the backend.