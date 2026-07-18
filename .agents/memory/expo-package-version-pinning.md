---
name: Expo package version pinning
description: How to avoid Metro bundler errors when installing Expo packages in this workspace.
---

When installing Expo packages into `artifacts/mobile`, always pin the version that matches the installed `expo` SDK version.

**Why:** Installing a newer major version (e.g., `expo-document-picker@57.0.1` with Expo 54) caused Metro to bundle the package into the web bundle and then crash on a broken symlink inside its transitive dependencies. The Expo CLI's `expo install --check` warning is the signal to fix the version.

**How to apply:**
- Run `pnpm exec expo install --check` to see expected versions.
- Install the exact expected version in the workspace, e.g. `pnpm --filter @workspace/mobile add expo-document-picker@14.0.8`.
- After installing, restart the mobile workflow and verify the bundler no longer crashes.
