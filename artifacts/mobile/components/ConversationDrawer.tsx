import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { GeminiStar } from './GeminiStar';
import type { Conversation } from '@/context/ConversationContext';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 300);

interface ConversationDrawerProps {
  visible: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
}

export function ConversationDrawer({
  visible,
  conversations,
  activeId,
  onClose,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}: ConversationDrawerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 24 : insets.bottom;

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted && !visible) return null;

  return (
    <Modal
      visible={mounted || visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: colors.surface,
            transform: [{ translateX: slideAnim }],
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.brandRow}>
            <GeminiStar size={22} />
            <Text style={[styles.brandName, { color: colors.text }]}>Gemini</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* New chat button */}
        <View style={styles.newChatWrapper}>
          <TouchableOpacity
            style={[styles.newChatBtn, { backgroundColor: colors.surfaceHover }]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              onNewChat();
            }}
            activeOpacity={0.75}
          >
            <Feather name="plus" size={17} color={colors.text} />
            <Text style={[styles.newChatText, { color: colors.text }]}>New chat</Text>
          </TouchableOpacity>
        </View>

        {/* Section label */}
        {conversations.length > 0 && (
          <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
            Recent
          </Text>
        )}

        {/* Conversations list */}
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={22} color={colors.textSubtle} />
              <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
                No chats yet
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              isActive={item.id === activeId}
              onSelect={() => onSelectChat(item.id)}
              onDelete={() => {
                Alert.alert('Delete chat', 'Delete this conversation?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDeleteChat(item.id),
                  },
                ]);
              }}
              onRename={(title) => onRenameChat(item.id, title)}
            />
          )}
        />
      </Animated.View>
    </Modal>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const colors = useColors();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);

  const handleSubmitRename = () => {
    const trimmed = editValue.trim();
    if (trimmed) onRename(trimmed);
    else setEditValue(conversation.title);
    setEditing(false);
  };

  return (
    <TouchableOpacity
      style={[
        styles.convItem,
        isActive && { backgroundColor: colors.surfaceHover },
      ]}
      onPress={editing ? undefined : onSelect}
      activeOpacity={0.7}
    >
      <Feather
        name="message-square"
        size={14}
        color={isActive ? colors.brand : colors.textSubtle}
        style={styles.convIcon}
      />

      {editing ? (
        <TextInput
          style={[styles.renameInput, { color: colors.text, borderColor: colors.brand }]}
          value={editValue}
          onChangeText={setEditValue}
          onBlur={handleSubmitRename}
          onSubmitEditing={handleSubmitRename}
          autoFocus
          selectTextOnFocus
          returnKeyType="done"
        />
      ) : (
        <Text
          style={[
            styles.convTitle,
            { color: isActive ? colors.text : colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {conversation.title}
        </Text>
      )}

      {!editing && (
        <View style={styles.convActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setEditValue(conversation.title);
              setEditing(true);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.actionBtn}
          >
            <Feather name="edit-3" size={12} color={colors.textSubtle} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.actionBtn}
          >
            <Feather name="trash-2" size={12} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  newChatWrapper: {
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
  },
  newChatText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
  },
  convIcon: {
    flexShrink: 0,
  },
  convTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  renameInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  convActions: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
  },
  actionBtn: {
    padding: 4,
  },
});
