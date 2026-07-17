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
  onClearAll?: () => void;
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
  onClearAll,
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

      {/* Sidebar drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: colors.sidebar,
            transform: [{ translateX: slideAnim }],
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        {/* Header: star + Vertex AI */}
        <View style={styles.drawerHeader}>
          <View style={styles.brandRow}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.menuBtn}
            >
              <Feather name="menu" size={22} color={colors.textMuted} />
            </TouchableOpacity>
            <GeminiStar size={20} />
            <Text style={[styles.brandName, { color: colors.text }]}>Vertex AI</Text>
          </View>
        </View>

        {/* + New chat button */}
        <View style={styles.newChatWrapper}>
          <TouchableOpacity
            style={[
              styles.newChatBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              onNewChat();
            }}
            activeOpacity={0.75}
          >
            <Feather name="plus" size={16} color={colors.text} />
            <Text style={[styles.newChatText, { color: colors.text }]}>New chat</Text>
          </TouchableOpacity>

          {conversations.length > 0 && onClearAll && (
            <TouchableOpacity
              style={styles.clearAllBtn}
              onPress={() =>
                Alert.alert('Clear all history', 'Delete every conversation? This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                      onClearAll();
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      }
                    },
                  },
                ])
              }
            >
              <Feather name="trash-2" size={14} color={colors.destructive} />
              <Text style={[styles.clearAllText, { color: colors.destructive }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RECENT label */}
        {conversations.length > 0 && (
          <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>RECENT</Text>
        )}

        {/* Conversations list */}
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No conversations yet
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              isActive={item.id === activeId}
              onSelect={() => onSelectChat(item.id)}
              onDelete={() => onDeleteChat(item.id)}
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

  const handleDelete = () => {
    // Direct delete: no confirmation dialog
    onDelete();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.convRow,
        isActive && { backgroundColor: colors.surfaceHover },
      ]}
    >
      {editing ? (
        <TextInput
          style={[
            styles.renameInput,
            { color: colors.text, borderColor: colors.brand },
          ]}
          value={editValue}
          onChangeText={setEditValue}
          onBlur={handleSubmitRename}
          onSubmitEditing={handleSubmitRename}
          autoFocus
          selectTextOnFocus
          returnKeyType="done"
        />
      ) : (
        <TouchableOpacity
          style={styles.convTextArea}
          onPress={onSelect}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.convTitle,
              { color: isActive ? colors.text : colors.textMuted },
            ]}
            numberOfLines={1}
          >
            {conversation.title}
          </Text>
        </TouchableOpacity>
      )}

      {!editing && (
        <View style={styles.convActions}>
          <TouchableOpacity
            onPress={() => {
              setEditValue(conversation.title);
              setEditing(true);
            }}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="edit-3" size={15} color={colors.textSubtle} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={15} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  newChatWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  newChatText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  clearAllText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  emptyState: {
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  convTextArea: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  convTitle: {
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
    marginVertical: 4,
  },
  convActions: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
