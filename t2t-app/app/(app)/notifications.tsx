import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useAppTheme } from '@/hooks/useAppTheme';

type NotifType = Notification['type'];

const TYPE_CONFIG: Record<NotifType, { icon: string; color: string; bg: string }> = {
  like:    { icon: 'heart',        color: '#FF3B30', bg: '#fff0ee' },
  comment: { icon: 'chatbubble',   color: '#34C759', bg: '#edfaf1' },
  follow:  { icon: 'person-add',   color: '#007AFF', bg: '#e8f0fe' },
};

function AvatarWithIcon({ name, avatarUrl, type }: { name: string; avatarUrl?: string | null; type: NotifType }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.like;
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.avatarWrapper}>
      <View style={[styles.avatar, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.avatarInitials, { color: cfg.color }]}>{initials}</Text>
      </View>
      <View style={[styles.typeIcon, { backgroundColor: cfg.color }]}>
        <Ionicons name={cfg.icon as any} size={11} color="#fff" />
      </View>
    </View>
  );
}

function formatRelativeTime(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
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
}

function getDateBucket(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return 'older';
}

type ListItem =
  | { kind: 'header'; label: string }
  | { kind: 'item'; data: Notification };

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  const listData = useMemo<ListItem[]>(() => {
    const buckets: Record<string, Notification[]> = { today: [], yesterday: [], older: [] };
    notifications.forEach(n => buckets[getDateBucket(n.created_at)].push(n));

    const result: ListItem[] = [];
    const labels: Record<string, string> = {
      today: t('notifications.group_today'),
      yesterday: t('notifications.group_yesterday'),
      older: t('notifications.group_older'),
    };
    for (const key of ['today', 'yesterday', 'older'] as const) {
      if (buckets[key].length > 0) {
        result.push({ kind: 'header', label: labels[key] });
        buckets[key].forEach(n => result.push({ kind: 'item', data: n }));
      }
    }
    return result;
  }, [notifications, t]);

  async function handlePress(n: Notification) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!n.is_read) await markAsRead(n.id);
    if (n.type === 'follow') {
      router.push(`/(app)/profile/${n.actor_id}`);
    } else {
      router.push(`/(app)/diary/${n.target_id}`);
    }
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'header') {
      return <Text style={styles.sectionHeader}>{item.label}</Text>;
    }
    const n = item.data;
    const actorName = n.actor?.username || t('common.anonymous');
    const actionText = t(`notifications.${n.type}`);

    return (
      <TouchableOpacity
        style={[styles.item, !n.is_read && styles.unreadItem]}
        onPress={() => handlePress(n)}
      >
        <AvatarWithIcon name={actorName} avatarUrl={n.actor?.avatar_url} type={n.type} />
        <View style={styles.textBlock}>
          <Text style={styles.text}>
            <Text style={styles.bold}>{actorName}</Text>
            {'  '}{actionText}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(n.created_at, t)}</Text>
        </View>
        {!n.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const hasUnread = useMemo(() => notifications.some(n => !n.is_read), [notifications]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        {hasUnread ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markReadText}>{t('notifications.mark_all_read')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, idx) =>
            item.kind === 'header' ? `header-${idx}` : item.data.id
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor="#007AFF" />
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
  container: { flex: 1, backgroundColor: '#fff' },
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
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  markReadText: { fontSize: 13, color: '#007AFF', fontWeight: '600', textAlign: 'right', width: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { flexGrow: 1, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  unreadItem: { backgroundColor: '#f0f7ff' },
  avatarWrapper: { position: 'relative', marginRight: 14 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: 16, fontWeight: '800' },
  typeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  textBlock: { flex: 1 },
  text: { fontSize: 14, color: '#333', lineHeight: 20 },
  bold: { fontWeight: '700', color: '#1a1a1a' },
  time: { fontSize: 12, color: '#aaa', marginTop: 3 },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
