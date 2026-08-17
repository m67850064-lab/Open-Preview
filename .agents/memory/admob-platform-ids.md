---
name: AdMob platform IDs
description: Platform-specific AdMob App ID handling for this mobile app.
---

The supplied AdMob App ID is configured for Android APK/AAB builds. The banner is Android-only until a separate iOS App ID is provided; web and iOS render no ad.

**Why:** Google Mobile Ads App IDs are platform-specific. Reusing an Android App ID for iOS can cause native SDK initialization failures or incorrect ad configuration.

**How to apply:** Keep the Android ID in the Android config plugin and Android-only banner component. Add a separately supplied iOS App ID before enabling the iOS native implementation.