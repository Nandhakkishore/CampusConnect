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

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_STATUS':
        return '🚀';
      case 'MESSAGE':
        return '💬';
      case 'NEW_MATCH':
        return '🤝';
      default:
        return '🔔';
    }
  };

  const renderNotifItem = ({ item }: { item: NotificationItem }) => {
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.unreadCard]}
        activeOpacity={0.82}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 16 }}>{getNotifIcon(item.type)}</Text>
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.bottomRow}>
          <Badge
            label={item.type.replace('_', ' ')}
            variant={item.type === 'APPLICATION_STATUS' ? 'primary' : 'secondary'}
            size="sm"
          />
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Activity & Alerts</Text>
          <Text style={styles.screenSubtitle}>Team invites, applications & campus updates</Text>
        </View>
        {notifications.some((n) => !n.isRead) && (
          <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn} activeOpacity={0.8}>
            <Text style={styles.markReadText}>Mark all read ✓</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ padding: 20 }}>
          <Skeleton height={88} style={{ borderRadius: 16, marginBottom: 12 }} />
          <Skeleton height={88} style={{ borderRadius: 16, marginBottom: 12 }} />
          <Skeleton height={88} style={{ borderRadius: 16 }} />
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
    paddingBottom: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  markReadBtn: {
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  markReadText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadCard: {
    borderColor: 'rgba(5, 150, 105, 0.4)',
    backgroundColor: '#F0FDF4', // Subtle light emerald tint
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  message: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingLeft: 46,
  },
  timeText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '500',
  },
});

