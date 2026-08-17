import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import mobileAds from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_UNIT_ID } from '@/constants/ads';

interface DrawerBannerAdProps {
  visible: boolean;
}

export function DrawerBannerAd({ visible }: DrawerBannerAdProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;

    mobileAds()
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
  }, []);

  const bannerWidth = useMemo(
    () => Math.max(280, Math.min(screenWidth * 0.82, 300) - 16),
    [screenWidth],
  );

  if (!visible || !initialized) return null;

  return (
    <View style={styles.container} accessibilityLabel="Advertisement">
      <BannerAd
        unitId={ADMOB_BANNER_UNIT_ID}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
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