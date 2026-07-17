import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { SAMPLE_PROMPTS } from '@/context/ConversationContext';

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
      {/* Logo */}
      <View style={[styles.logoBox, { backgroundColor: colors.brand }]}>
        <Feather name="layers" size={36} color="#fff" />
      </View>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.hello, { color: colors.text }]}>Hello,</Text>
        <Text style={[styles.name, { color: colors.brand }]}>Vertex AI</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          How can I help you today?
        </Text>
      </View>

      {/* Sample prompts */}
      <View style={styles.prompts}>
        {SAMPLE_PROMPTS.map((prompt, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.promptCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onPromptPress(prompt)}
            activeOpacity={0.7}
          >
            <View style={[styles.promptIcon, { backgroundColor: colors.brand + '22' }]}>
              <Feather name="layers" size={14} color={colors.brand} />
            </View>
            <Text style={[styles.promptText, { color: colors.text }]}>{prompt}</Text>
            <Feather name="arrow-right" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 32,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    alignItems: 'center',
    gap: 4,
  },
  hello: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    lineHeight: 40,
  },
  name: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  prompts: {
    width: '100%',
    gap: 10,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  promptIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
});
