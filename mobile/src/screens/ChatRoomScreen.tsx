import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Message } from '../types';
import { chatApi } from '../api/chatApi';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { Skeleton } from '../components/Skeleton';

export const ChatRoomScreen = ({ route, navigation }: any) => {
  const { conversationId, title } = route.params;
  const currentUser = useAuthStore((state) => state.user);
  const { socket, connectSocket } = useSocketStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set navigation header title
  useEffect(() => {
    navigation.setOptions({ title: title || 'Chat Room' });
  }, [navigation, title]);

  // Connect socket and fetch message history
  const loadMessages = useCallback(async () => {
    try {
      const res = await chatApi.getMessages(conversationId);
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    connectSocket();
    loadMessages();
  }, [connectSocket, loadMessages]);

  // Handle Socket.io events
  useEffect(() => {
    if (!socket) return;

    // Join conversation room
    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId && data.userId !== currentUser?.id) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:typing', handleTyping);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:typing', handleTyping);
    };
  }, [socket, conversationId, currentUser?.id]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');

    if (socket && socket.connected) {
      socket.emit('send_message', { conversationId, content });
      socket.emit('typing_stop', conversationId);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);

    if (socket && socket.connected) {
      socket.emit('typing_start', conversationId);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', conversationId);
      }, 2000);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    if (item.isSystem) {
      return (
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{item.content}</Text>
        </View>
      );
    }

    const isMine = item.senderId === currentUser?.id;
    const senderName = item.sender?.profile?.fullName || 'Member';

    return (
      <View style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow]}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          {!isMine && <Text style={styles.senderName}>{senderName}</Text>}
          <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMine ? styles.myTime : styles.theirTime]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        {loading ? (
          <View style={{ padding: 20 }}>
            <Skeleton height={40} width="60%" style={{ alignSelf: 'flex-start' }} />
            <Skeleton height={50} width="70%" style={{ alignSelf: 'flex-end' }} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {isTyping && (
          <View style={styles.typingIndicatorContainer}>
            <Text style={styles.typingText}>Someone is typing...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textDim}
            value={inputText}
            onChangeText={handleTextChange}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 10,
  },
  systemText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  messageRow: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  theirRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  senderName: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTime: {
    color: colors.textDim,
  },
  typingIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    color: colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
