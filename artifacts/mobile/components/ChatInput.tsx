import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { isVoiceSupported, startListening, stopListening } from '@/lib/voiceInput';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const canSend = !!text.trim() && !disabled;
  const bottomPadding = Platform.OS === 'web' ? 16 : Math.max(insets.bottom, 12);

  useEffect(() => {
    if (recording) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => { pulseLoop.current?.stop(); };
  }, [recording]);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    const trimmed = text.trim();
    setText('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onSend(trimmed);
  }, [canSend, text, onSend]);

  const handleMicPress = useCallback(async () => {
    if (!isVoiceSupported()) {
      Alert.alert('Not supported', 'Voice input is not available on this device.');
      return;
    }

    if (recording) {
      setRecording(false);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      await stopListening((transcript) => {
        setText((prev) => (prev ? prev + ' ' + transcript : transcript));
      });
    } else {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      setRecording(true);
      try {
        await startListening((transcript) => {
          setText((prev) => (prev ? prev + ' ' + transcript : transcript));
          setRecording(false);
        });
      } catch {
        setRecording(false);
      }
    }
  }, [recording]);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: bottomPadding, backgroundColor: colors.background },
      ]}
    >
      {/* Input pill — matches screenshot exactly */}
      <View
        style={[
          styles.inputPill,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: '#000',
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }]}
          placeholder={recording ? 'Listening...' : 'Ask anything...'}
          placeholderTextColor={recording ? '#ef4444' : colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
          onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
          blurOnSubmit={Platform.OS === 'web'}
          returnKeyType={Platform.OS === 'web' ? 'send' : 'default'}
          editable={!recording}
        />

        {/* Mic button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={handleMicPress}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={recording ? 'stop-circle' : 'mic-outline'}
              size={22}
              color={recording ? '#ef4444' : colors.textMuted}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Send / arrow-up button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendBtn,
            {
              backgroundColor: canSend ? colors.brand : colors.surfaceHover,
            },
          ]}
          activeOpacity={0.8}
        >
          <Feather
            name="arrow-up"
            size={17}
            color={canSend ? '#fff' : colors.textSubtle}
          />
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <Text style={[styles.disclaimer, { color: colors.textSubtle }]}>
        Vertex AI can make mistakes. Verify important information.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    borderWidth: 1,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    maxHeight: 120,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: Platform.OS === 'android' ? 6 : 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
