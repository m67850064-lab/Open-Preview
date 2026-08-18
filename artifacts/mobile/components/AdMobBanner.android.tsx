import React, { useEffect, useMemo, useState } from 'react';
import {
  NativeModules,
  StyleSheet,
  TurboModuleRegistry,
  useWindowDimensions,
  View,
} from 'react-native';
import { ADMOB_BANNER_UNIT_ID } from '@/constants/ads';

interface DrawerBannerAdProps {
  visible: boolean;
}

type GoogleMobileAdsModule = typeof import('react-native-google-mobile-ads');

function loadGoogleMobileAdsModule(): GoogleMobileAdsModule | null {
  try {
    const nativeAdsModule =
      NativeModules?.RNGoogleMobileAdsModule ??
      TurboModuleRegistry.get('RNGoogleMobileAdsModule');

    if (!nativeAdsModule) {
      return null;
    }

    return require('react-native-google-mobile-ads') as GoogleMobileAdsModule;
  } catch (error: unknown) {
    console.warn('[AdMob] Native SDK is unavailable; hiding banner', error);
    return null;
  }
}

const googleMobileAdsModule = loadGoogleMobileAdsModule();

export function DrawerBannerAd({ visible }: DrawerBannerAdProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!visible || !googleMobileAdsModule) return;

    let active = true;

    googleMobileAdsModule
      .default()
      .initialize()
      .then(() => {
        if (active) setInitialized(true);
      })
      .catch((error: unknown) => {
        console.warn('[AdMob] SDK initialization failed', error);
      });

    return () => {
      active = false;
    };
  }, [visible]);

  const bannerWidth = useMemo(
    () => Math.max(280, Math.min(screenWidth * 0.82, 300) - 16),
    [screenWidth],
  );

  if (!visible || !initialized || !googleMobileAdsModule) return null;

  return (
    <View style={styles.container} accessibilityLabel="Advertisement">
      <googleMobileAdsModule.BannerAd
        unitId={ADMOB_BANNER_UNIT_ID}
        size={googleMobileAdsModule.BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        width={bannerWidth}
        onAdFailedToLoad={(error) => {
          console.warn('[AdMob] Banner failed to load', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
});