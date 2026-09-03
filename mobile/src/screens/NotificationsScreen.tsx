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
import { NotificationItem } from '../types';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useSocketStore } from '../store/socketStore';
import apiClient from '../api/client';

export const NotificationsScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socket = useSocketStore((state) => state.socket);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for live Socket.io pushed notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotif = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    socket.on('notification:new', handleNewNotif);
    return () => {
      socket.off('notification:new', handleNewNotif);
    };
  }, [socket]);

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await apiClient.patch(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }

    // Action routing based on payload
    if (item.payload?.conversationId) {
      navigation.navigate('ChatRoom', {
        conversationId: item.payload.conversationId,
        title: item.title,
      });
    } else if (item.payload?.projectId) {
      navigation.navigate('ProjectDetail', {
        projectId: item.payload.projectId,
      });
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const renderNotifItem = ({ item }: { item: NotificationItem }) => {
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.unreadCard]}
        activeOpacity={0.8}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.topRow}>
          <Text style={styles.title}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.message}>{item.message}</Text>

        <View style={styles.bottomRow}>
          <Badge
            label={item.type}
            variant={item.type === 'APPLICATION_STATUS' ? 'primary' : 'secondary'}
          />
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Notifications Feed</Text>
        {notifications.some((n) => !n.isRead) && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ padding: 20 }}>
          <Skeleton height={80} style={{ borderRadius: 12 }} />
          <Skeleton height={80} style={{ borderRadius: 12 }} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotifItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Notifications"
              description="You're all caught up! Updates regarding application responses, team chats, and matches will land here."
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  markReadText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  unreadCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  message: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: colors.textDim,
    fontSize: 11,
  },
});
