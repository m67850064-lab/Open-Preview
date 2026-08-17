import { Platform } from 'react-native';

/**
 * Returns the API base URL bundled into the app.
 *
 * Native builds must provide EXPO_PUBLIC_API_URL or EXPO_PUBLIC_DOMAIN at
 * build time. Falling back to https://localhost on Android/iOS would create a
 * binary that can never reach the backend, so fail with an actionable error.
 */
export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_DOMAIN;

  if (configured) {
    const withProtocol = /^https?:\/\//i.test(configured)
      ? configured
      : `https://${configured}`;
    const withoutTrailingSlash = withProtocol.replace(/\/+$/, '');
    return withoutTrailingSlash.endsWith('/api')
      ? withoutTrailingSlash
      : `${withoutTrailingSlash}/api`;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  throw new Error(
    'API URL is not configured. Set EXPO_PUBLIC_API_URL or EXPO_PUBLIC_DOMAIN when building the Android app.',
  );
}