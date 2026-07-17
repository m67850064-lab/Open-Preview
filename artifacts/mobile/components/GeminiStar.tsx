import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface GeminiStarProps {
  size?: number;
}

export function GeminiStar({ size = 24 }: GeminiStarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4285f4" />
          <Stop offset="50%" stopColor="#9b72cb" />
          <Stop offset="100%" stopColor="#d96570" />
        </LinearGradient>
      </Defs>
      {/* 4-pointed Gemini star */}
      <Path
        d="M12 2C12 2 12.9 8.1 14.8 10.2C16.7 12.3 22 12 22 12C22 12 16.7 11.7 14.8 13.8C12.9 15.9 12 22 12 22C12 22 11.1 15.9 9.2 13.8C7.3 11.7 2 12 2 12C2 12 7.3 12.3 9.2 10.2C11.1 8.1 12 2 12 2Z"
        fill="url(#g1)"
      />
    </Svg>
  );
}
