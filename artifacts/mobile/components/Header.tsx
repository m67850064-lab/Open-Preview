import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { GeminiStar } from './GeminiStar';

interface HeaderProps {
  onMenuPress: () => void;
  onNewChat: () => void;
}

export function Header({ onMenuPress, onNewChat }: HeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* Hamburger menu */}
      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="menu" size={22} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Center brand */}
      <View style={styles.brand}>
        <GeminiStar size={22} />
        <Text style={[styles.title, { color: colors.text }]}>Gemini</Text>
        <View style={[styles.badge, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.badgeText, { color: colors.textMuted }]}>AI</Text>
        </View>
      </View>

      {/* New chat */}
      <TouchableOpacity
        onPress={onNewChat}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="edit-2" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
});
