import React, { useCallback } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useConversations } from '@/context/ConversationContext';
import { Header } from '@/components/Header';
import { ChatInput } from '@/components/ChatInput';
import { MessageBubble } from '@/components/MessageBubble';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ConversationDrawer } from '@/components/ConversationDrawer';
import type { ChatMessage } from '@/context/ConversationContext';

export default function ChatScreen() {
  const colors = useColors();
  const {
    conversations,
    activeId,
    activeConversation,
    drawerOpen,
    openDrawer,
    closeDrawer,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    handleRenameChat,
    handleSendMessage,
    stopGeneration,
    clearAllHistory,
  } = useConversations();

  const messages = activeConversation?.messages ?? [];
  const isEmpty = messages.length === 0;

  // Inverted FlatList expects data in reverse (newest first)
  const reversedMessages = [...messages].reverse();

  const hasTyping = messages.length > 0 && messages[messages.length - 1].role === 'model' && messages[messages.length - 1].text === '';

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header onMenuPress={openDrawer} onNewChat={handleNewChat} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {isEmpty ? (
          <WelcomeScreen onPromptPress={handleSendMessage} />
        ) : (
          <View style={styles.chatContainer}>
            <FlatList
              data={reversedMessages}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              inverted
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              scrollEnabled
            />
          </View>
        )}

        <ChatInput onSend={handleSendMessage} onStop={stopGeneration} disabled={hasTyping} />
      </KeyboardAvoidingView>

      <ConversationDrawer
        visible={drawerOpen}
        conversations={conversations}
        activeId={activeId}
        onClose={closeDrawer}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onClearAll={clearAllHistory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  listContent: {
    paddingVertical: 16,
    flexGrow: 1,
  },
});
