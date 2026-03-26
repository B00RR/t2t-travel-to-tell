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
import type { AppTheme } from '@/hooks/useAppTheme';

type NotifType = Notification['type'];

function getTypeConfig(theme: AppTheme) {
  return {
    like:    { icon: 'heart' as const,       color: theme.red,            bg: theme.red + '18' },
    comment: { icon: 'chatbubble' as const,  color: theme.sage,           bg: theme.sage + '18' },
    follow:  { icon: 'person-add' as const,  color: theme.teal,           bg: theme.tealAlpha10 },
  };
}

function AvatarWithIcon({
  name, avatarUrl, type, theme,
}: {
  name: string; avatarUrl?: string | null; type: NotifType; theme: AppTheme;
}) {
  const config = getTypeConfig(theme);
  const cfg = config[type] ?? config.like;
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
        <Ionicons name={cfg.icon} size={11} color={theme.bgSurface} />
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
  const theme = useAppTheme();
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
      return (
        <Text style={[styles.sectionHeader, { color: theme.textMuted, backgroundColor: theme.bg }]}>
          {item.label}
        </Text>
      );
    }
    const n = item.data;
    const actorName = n.actor?.username || t('common.anonymous');
    const actionText = t(`notifications.${n.type}`);

    return (
      <TouchableOpacity
        style={[
          styles.item,
          { borderBottomColor: theme.borderLight },
          !n.is_read && { backgroundColor: theme.tealAlpha10 },
        ]}
        onPress={() => handlePress(n)}
      >
        <AvatarWithIcon name={actorName} avatarUrl={n.actor?.avatar_url} type={n.type} theme={theme} />
        <View style={styles.textBlock}>
          <Text style={{ fontSize: 14, color: theme.textPrimary, lineHeight: 20 }}>
            <Text style={{ fontWeight: '700' as const }}>{actorName}</Text>
            {'  '}{actionText}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>
            {formatRelativeTime(n.created_at, t)}
          </Text>
        </View>
        {!n.is_read && <View style={[styles.unreadDot, { backgroundColor: theme.teal }]} />}
      </TouchableOpacity>
    );
  };

  const hasUnread = useMemo(() => notifications.some(n => !n.is_read), [notifications]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('notifications.title')}</Text>
        {hasUnread ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={[styles.markReadText, { color: theme.teal }]}>
              {t('notifications.mark_all_read')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.teal} />
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
            <RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={theme.teal} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {t('notifications.empty')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700' },
  markReadText: { fontSize: 13, fontWeight: '600', textAlign: 'right', width: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { flexGrow: 1, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
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
  },
  textBlock: { flex: 1 },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: 8,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, marginTop: 12 },
});
