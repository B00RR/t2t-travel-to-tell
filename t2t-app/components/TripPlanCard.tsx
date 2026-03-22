import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TripPlan } from '@/types/tripPlan';
import { useAppTheme, type AppTheme } from '@/hooks/useAppTheme';

interface TripPlanCardProps {
  item: TripPlan;
  userId: string | undefined;
  onClone?: (planId: string) => void;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const TripPlanCardComponent = ({ item, userId, onClone }: TripPlanCardProps) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const isOwner = item.author_id === userId;
  const author = item.profiles;
  const authorName = author?.display_name || author?.username || t('common.anonymous');

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push(`/planner/${item.id}`)}
    >
      {/* Cover */}
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="map-outline" size={44} color={theme.border} />
        </View>
      )}

      {/* Badges over image */}
      <View style={styles.badgeRow}>
        {item.source_diary_id && (
          <View style={styles.sourceBadge}>
            <Ionicons name="book-outline" size={11} color="#fff" />
            <Text style={styles.sourceBadgeText}>{t('planner.from_diary')}</Text>
          </View>
        )}
        {item.clone_count > 0 && (
          <View style={styles.cloneBadge}>
            <Ionicons name="copy-outline" size={11} color={theme.teal} />
            <Text style={styles.cloneBadgeText}>{item.clone_count}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        {/* Author row (only in discover) */}
        {!isOwner && author && (
          <View style={styles.authorRow}>
            {author.avatar_url ? (
              <Image source={{ uri: author.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(authorName)}</Text>
              </View>
            )}
            <Text style={styles.authorName}>{authorName}</Text>
          </View>
        )}

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        {item.destinations && item.destinations.length > 0 && (
          <View style={styles.destinationRow}>
            {item.destinations.slice(0, 3).map((dest, idx) => (
              <View key={idx} style={styles.destPill}>
                <Text style={styles.destPillText}>📍 {dest}</Text>
              </View>
            ))}
            {item.destinations.length > 3 && (
              <Text style={styles.moreText}>+{item.destinations.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          {item.start_date ? (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={theme.textMuted} />
              <Text style={styles.dateText}>{formatDate(item.start_date)}</Text>
            </View>
          ) : <View />}

          {!isOwner && onClone && (
            <TouchableOpacity
              style={styles.cloneBtn}
              onPress={() => onClone(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="copy-outline" size={14} color={theme.teal} />
              <Text style={styles.cloneBtnText}>{t('planner.clone')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const TripPlanCard = React.memo(TripPlanCardComponent);

function makeStyles(t: AppTheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.bgSurface,
      borderRadius: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.borderLight,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: t.isDark ? 0.35 : 0.10,
      shadowRadius: 16,
      elevation: 6,
    },
    coverImage: {
      width: '100%',
      height: 180,
      resizeMode: 'cover',
    },
    coverPlaceholder: {
      width: '100%',
      height: 110,
      backgroundColor: t.bgElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeRow: {
      position: 'absolute',
      top: 12,
      left: 12,
      flexDirection: 'row',
      gap: 6,
    },
    sourceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
    },
    sourceBadgeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '600',
    },
    cloneBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.tealAlpha15,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: t.tealAlpha25,
    },
    cloneBadgeText: {
      color: t.teal,
      fontSize: 11,
      fontWeight: '700',
    },
    cardBody: {
      padding: 16,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    avatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
    },
    avatarPlaceholder: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: t.teal,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitials: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 10,
    },
    authorName: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textSecondary,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: t.textPrimary,
      marginBottom: 10,
      lineHeight: 24,
      letterSpacing: -0.3,
    },
    destinationRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 14,
    },
    destPill: {
      backgroundColor: t.bgElevated,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.border,
    },
    destPillText: {
      fontSize: 12,
      color: t.textSecondary,
      fontWeight: '500',
    },
    moreText: {
      fontSize: 12,
      color: t.textMuted,
      alignSelf: 'center',
      marginLeft: 2,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dateText: {
      fontSize: 12,
      color: t.textMuted,
      fontWeight: '500',
    },
    cloneBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.tealAlpha10,
      borderWidth: 1,
      borderColor: t.tealAlpha25,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 5,
    },
    cloneBtnText: {
      fontSize: 13,
      color: t.teal,
      fontWeight: '700',
    },
  });
}
