import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../app/theme';
import { RootStackParamList, Message } from '../app/types';
import useChat from '../hooks/useChat';
import socketService from '../services/socket';
import TopBar from '../components/TopBar';
import InputBar from '../components/InputBar';
import MessageBubble from '../components/MessageBubble';
import BottomNav from '../components/BottomNav';

type ChatScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
};

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);

  const {
    messages,
    users,
    currentUser,
    isHost,
    isConnected,
    typingUsers,
    sendMessage,
    sendVoiceMessage,
    sendImageMessage,
    setTyping,
    editMessage,
    deleteMessage,
  } = useChat();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = (content: string) => {
    if (editingMessage) {
      editMessage(editingMessage.id, content);
      setEditingMessage(null);
    } else {
      sendMessage(content);
    }
  };

  const handleEditRequest = (messageId: string, currentContent: string) => {
    setEditingMessage({ id: messageId, content: currentContent });
  };

  const handleDeleteRequest = (messageId: string) => {
    deleteMessage(messageId);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === currentUser?.id;
    const prevMessage = messages[messages.indexOf(item) - 1];
    const showSenderName = !prevMessage || prevMessage.senderId !== item.senderId;

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showSenderName={showSenderName}
        onEdit={handleEditRequest}
        onDelete={handleDeleteRequest}
      />
    );
  };

  const renderContent = () => {
    if (messages.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>Start the conversation!</Text>
        </View>
      );
    }

    return (
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />
    );
  };

  const handleTabPress = (tab: 'host' | 'join' | 'chat' | 'users') => {
    switch (tab) {
      case 'host':
        navigation.navigate('Host', { username: currentUser?.username || 'User', serverIP: socketService.getIP() || '' });
        break;
      case 'join':
        navigation.navigate('Join', { username: currentUser?.username || 'User', serverIP: socketService.getIP() || '' });
        break;
      case 'users':
        navigation.navigate('Users');
        break;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <TopBar
        title="Fluid Chat"
        subtitle={`${users.length} Users Online`}
        onSettingsPress={() => {}}
      />

      <View style={styles.chatContainer}>
        {typingUsers.length > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Text>
          </View>
        )}
        {renderContent()}
      </View>

      {editingMessage && (
        <View style={styles.editingBanner}>
          <Text style={styles.editingText}>Editing message</Text>
          <Text style={styles.editingCancel} onPress={() => setEditingMessage(null)}>Cancel</Text>
        </View>
      )}

      <View style={{ paddingBottom: insets.bottom }}>
        <InputBar
          onSendMessage={handleSend}
          onSendVoice={sendVoiceMessage}
          onSendImage={sendImageMessage}
          onTyping={setTyping}
          placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
          initialText={editingMessage?.content}
        />
      </View>

      <BottomNav activeTab="chat" onTabPress={handleTabPress} isHost={isHost} isConnected={isConnected} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors['surface-container-low'],
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  messageList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  typingIndicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typingText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors['on-surface-variant'],
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors['on-surface'],
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors['on-surface-variant'],
  },
  editingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors['surface-container-high'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
  },
  editingText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  editingCancel: {
    fontSize: 13,
    color: colors['on-surface-variant'],
  },
});

export default ChatScreen;
