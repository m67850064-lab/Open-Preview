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
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { isVoiceSupported, startListening, stopListening, cancelListening } from '@/lib/voiceInput';

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
  const bottomPadding = Platform.OS === 'web' ? 24 : Math.max(insets.bottom, 12);

  // Pulse animation when recording
  useEffect(() => {
    if (recording) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
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
      Alert.alert('Not supported', 'Voice input is not supported on this device.');
      return;
    }

    if (recording) {
      // Stop recording
      setRecording(false);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      await stopListening((transcript) => {
        setText((prev) => (prev ? prev + ' ' + transcript : transcript));
      });
    } else {
      // Start recording
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
      {/* Input pill */}
      <View
        style={[
          styles.inputPill,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* + button */}
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => Alert.alert('Attach', 'Image & file support coming soon')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="plus" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }]}
          placeholder={recording ? 'Listening...' : 'Ask Gemini'}
          placeholderTextColor={recording ? '#d96570' : colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
          onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
          blurOnSubmit={Platform.OS === 'web'}
          returnKeyType={Platform.OS === 'web' ? 'send' : 'default'}
          editable={!recording}
        />

        {/* Mic or Send button */}
        {canSend ? (
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.actionBtn, { backgroundColor: colors.brand }]}
            activeOpacity={0.8}
          >
            <Feather name="arrow-up" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={handleMicPress}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: recording ? '#d96570' : colors.surfaceHover,
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={recording ? 'stop' : 'mic'}
                size={18}
                color={recording ? '#fff' : colors.textMuted}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Disclaimer */}
      <Text style={[styles.disclaimer, { color: colors.textSubtle }]}>
        Gemini can make mistakes. Check important info.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
  },
  sideBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    maxHeight: 120,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: Platform.OS === 'android' ? 6 : 8,
    paddingHorizontal: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingBottom: 2,
  },
});
