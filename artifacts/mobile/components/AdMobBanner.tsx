import type { ReactNode } from 'react';

interface DrawerBannerAdProps {
  visible: boolean;
}

/**
 * AdMob is Android-only for now because the supplied App ID is an Android
 * App ID. This no-op keeps web preview and iOS builds ad-free until an iOS
 * App ID is provided.
 */
export function DrawerBannerAd(_props: DrawerBannerAdProps): ReactNode {
  return null;
}