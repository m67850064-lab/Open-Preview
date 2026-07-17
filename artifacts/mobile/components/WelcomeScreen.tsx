import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { GeminiStar } from './GeminiStar';

const SUGGESTION_CHIPS = [
  { icon: 'code', label: 'Write code' },
  { icon: 'book-open', label: 'Summarize text' },
  { icon: 'image', label: 'Analyze image' },
  { icon: 'edit-3', label: 'Help me write' },
  { icon: 'cpu', label: 'Explain AI' },
  { icon: 'globe', label: 'Translate' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface WelcomeScreenProps {
  onPromptPress: (text: string) => void;
}

export function WelcomeScreen({ onPromptPress }: WelcomeScreenProps) {
  const colors = useColors();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Large star logo */}
      <View style={styles.logoArea}>
        <GeminiStar size={56} />
      </View>

      {/* Greeting */}
      <View style={styles.greetingArea}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          {getGreeting()}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          How can I help you today?
        </Text>
      </View>

      {/* Suggestion chips */}
      <View style={styles.chipsSection}>
        <Text style={[styles.chipsLabel, { color: colors.textSubtle }]}>
          Try asking
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {SUGGESTION_CHIPS.map((chip, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onPromptPress(chip.label)}
              activeOpacity={0.7}
            >
              <Feather name={chip.icon as any} size={14} color={colors.brand} />
              <Text style={[styles.chipText, { color: colors.text }]}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feature cards */}
      <View style={styles.cards}>
        {[
          {
            title: 'Ask anything',
            desc: 'Get answers, explanations and ideas',
            icon: 'message-circle',
          },
          {
            title: 'Create content',
            desc: 'Write, edit and brainstorm with AI',
            icon: 'edit-3',
          },
        ].map((card, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onPromptPress(card.title)}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: colors.surfaceHover }]}>
              <Feather name={card.icon as any} size={18} color={colors.brand} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{card.desc}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textSubtle} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingArea: {
    alignItems: 'center',
    marginBottom: 36,
    gap: 6,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  chipsSection: {
    marginBottom: 24,
    gap: 12,
  },
  chipsLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingLeft: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  cards: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
});
