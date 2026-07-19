import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { Icon, type IconName } from './Icon';
import { useColors } from '@/hooks/useColors';

const SAMPLE_PROMPTS: { text: string; icon: IconName }[] = [
  { text: 'Explain quantum computing in simple terms', icon: 'bulb-outline' },
  { text: 'Write a poem about the ocean',              icon: 'create-outline' },
  { text: 'Give me ideas for a weekend project',       icon: 'flask-outline' },
  { text: 'What are the latest AI trends?',            icon: 'search-outline' },
];

interface WelcomeScreenProps {
  onPromptPress: (text: string) => void;
}

function GradientHello({ width }: { width: number }) {
  return (
    <Svg height={52} width={width}>
      <Defs>
        <LinearGradient id="helloGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#4f7af8" />
          <Stop offset="55%" stopColor="#7c3aed" />
          <Stop offset="100%" stopColor="#8b5cf6" />
        </LinearGradient>
      </Defs>
      <SvgText
        fill="url(#helloGrad)"
        fontSize="38"
        fontWeight="bold"
        x={width / 2}
        y="44"
        textAnchor="middle"
      >
        Hello, there!
      </SvgText>
    </Svg>
  );
}

export function WelcomeScreen({ onPromptPress }: WelcomeScreenProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const contentWidth = width - 32; // 16px padding each side

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Gradient "Hello, there!" */}
      <View style={styles.greetingArea}>
        <GradientHello width={contentWidth} />
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          What can I help you with today?
        </Text>
      </View>

      {/* 2×2 prompt card grid */}
      <View style={styles.grid}>
        {SAMPLE_PROMPTS.map((prompt, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                width: (contentWidth - 12) / 2,
              },
            ]}
            onPress={() => onPromptPress(prompt.text)}
            activeOpacity={0.75}
          >
            <View style={[styles.cardIcon, { backgroundColor: colors.accent }]}>
              <Icon name={prompt.icon} size={20} color={colors.brand} />
            </View>
            <Text
              style={[styles.cardText, { color: colors.text }]}
              numberOfLines={3}
            >
              {prompt.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 24,
    gap: 28,
  },
  greetingArea: {
    alignItems: 'center',
    gap: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 32,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
});
