import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { GeminiStar } from './GeminiStar';
import type { ChatMessage } from '@/context/ConversationContext';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const colors = useColors();
  const isUser = message.role === 'user';
  const isTyping = message.role === 'model' && message.text === '';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  if (isUser) {
    return (
      <Animated.View
        style={[
          styles.userRow,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View
          style={[
            styles.userBubble,
            { backgroundColor: colors.userBubble },
          ]}
        >
          {message.attachment && (
            <View style={styles.userAttachment}>
              {message.attachment.type === 'image' ? (
                <Image source={{ uri: message.attachment.uri }} style={styles.userAttachmentImage} />
              ) : (
                <View style={[styles.userAttachmentDoc, { backgroundColor: colors.accent }]}>
                  <Feather name="file-text" size={16} color={colors.brand} />
                  <Text style={[styles.userAttachmentDocText, { color: colors.text }]} numberOfLines={1}>
                    {message.attachment.name}
                  </Text>
                </View>
              )}
            </View>
          )}
          {!!message.text && (
            <Text style={[styles.userText, { color: colors.userBubbleText }]}>
              {message.text}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  }

  // Model: no bubble, Vertex star avatar + plain text
  return (
    <Animated.View
      style={[
        styles.modelRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.avatar}>
        <GeminiStar size={20} />
      </View>
      <View style={styles.modelContent}>
        {isTyping ? (
          <TypingDots />
        ) : (
          <Text style={[styles.modelText, { color: colors.text }]}>
            {message.text}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true }),
          Animated.delay(Math.max(0, 700 - delay)),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.dotsRow}>
      {([dot1, dot2, dot3] as Animated.Value[]).map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { opacity: dot, backgroundColor: '#8b5cf6' }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── User ──
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  userBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderBottomRightRadius: 6,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  userAttachment: {
    marginBottom: 8,
  },
  userAttachmentImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
    backgroundColor: '#000',
  },
  userAttachmentDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 240,
  },
  userAttachmentDocText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },

  // ── Model ──
  modelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  avatar: {
    marginTop: 2,
    flexShrink: 0,
  },
  modelContent: {
    flex: 1,
    paddingRight: 8,
  },
  modelText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },

  // ── Typing ──
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
