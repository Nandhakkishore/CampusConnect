import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { chatApi } from '../api/chatApi';
import { ChatConversation } from '../types';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';

export const ChatListScreen = ({ navigation }: any) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatApi.getConversations();
      if (res.success) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error('Error fetching chat conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const renderConversationItem = ({ item }: { item: ChatConversation }) => {
    const isTeam = item.type === 'TEAM';

    // Get display title
    let title = item.name || 'Conversation';
    if (!isTeam) {
      const otherPart = item.participants.find((p) => p.userId !== currentUser?.id);
      title = otherPart?.user?.profile?.fullName || otherPart?.user?.email || 'Campus Student';
    }

    const lastMsgText = item.lastMessage
      ? item.lastMessage.isSystem
        ? item.lastMessage.content
        : `${item.lastMessage.sender?.profile?.fullName || 'User'}: ${item.lastMessage.content}`
      : 'No messages yet';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('ChatRoom', {
            conversationId: item.id,
            title,
            isTeam,
          })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{isTeam ? '👥' : title.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {item.lastMessage ? (
              <Text style={styles.time}>
                {new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            ) : null}
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.previewText} numberOfLines={1}>
              {lastMsgText}
            </Text>
            {isTeam && <Badge label="Team Group" variant="secondary" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Chat & Messages</Text>
      </View>

      {loading ? (
        <View style={{ padding: 20 }}>
          <Skeleton height={70} style={{ borderRadius: 12 }} />
          <Skeleton height={70} style={{ borderRadius: 12 }} />
          <Skeleton height={70} style={{ borderRadius: 12 }} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchConversations();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Active Chats"
              description="Join a project team or message a campus peer to start chatting in real time!"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  listContent: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 11,
    color: colors.textDim,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
    marginRight: 8,
  },
});
