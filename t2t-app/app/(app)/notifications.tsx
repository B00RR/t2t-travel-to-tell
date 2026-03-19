import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, Notification } from '@/hooks/useNotifications';

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationPress = async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }

    if (n.type === 'follow') {
      router.push(`/(app)/profile/${n.actor_id}`);
    } else {
      // For like and comment, we go to the diary
      router.push(`/(app)/diary/${n.target_id}`);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t('notifications.just_now');
    
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return t('notifications.minutes_ago', { count: minutes });

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('notifications.hours_ago', { count: hours });

    const days = Math.floor(hours / 24);
    return t('notifications.days_ago', { count: days });
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const actionText = t(`notifications.${item.type}`);
    
    return (
      <TouchableOpacity 
        style={[styles.item, !item.is_read && styles.unreadItem]} 
        onPress={() => handleNotificationPress(item)}
      >
        <Image 
          source={item.actor?.avatar_url ? { uri: item.actor.avatar_url } : require('@/assets/images/icon.png')} 
          style={styles.avatar} 
        />
        <View style={styles.content}>
          <Text style={styles.text}>
            <Text style={styles.username}>{item.actor?.username || t('common.anonymous')}</Text>{' '}
            {actionText}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        {notifications.some(n => !n.is_read) ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markReadText}>{t('notifications.mark_all_read')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchNotifications} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  markReadText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  unreadItem: {
    backgroundColor: '#f0f7ff',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  text: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  username: {
    fontWeight: '700',
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});
