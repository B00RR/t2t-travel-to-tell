import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TripPlan } from '@/types/tripPlan';
import { Palette } from '@/constants/theme';

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
          <Ionicons name="map-outline" size={44} color={Palette.border} />
        </View>
      )}

      {/* Overlay gradient effect */}
      <View style={styles.coverOverlay} />

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
            <Ionicons name="copy-outline" size={11} color={Palette.teal} />
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
              <Ionicons name="calendar-outline" size={12} color={Palette.textMuted} />
              <Text style={styles.dateText}>{formatDate(item.start_date)}</Text>
            </View>
          ) : <View />}

          {!isOwner && onClone && (
            <TouchableOpacity
              style={styles.cloneBtn}
              onPress={() => onClone(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="copy-outline" size={14} color={Palette.teal} />
              <Text style={styles.cloneBtnText}>{t('planner.clone')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const TripPlanCard = React.memo(TripPlanCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.bgSurface,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  coverImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: 110,
    backgroundColor: Palette.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    background: 'transparent',
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
    backgroundColor: 'rgba(0,201,167,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,201,167,0.3)',
  },
  cloneBadgeText: {
    color: Palette.teal,
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
    backgroundColor: Palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: Palette.bgPrimary,
    fontWeight: '700',
    fontSize: 10,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
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
    backgroundColor: Palette.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  destPillText: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: Palette.textMuted,
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
    color: Palette.textMuted,
    fontWeight: '500',
  },
  cloneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,201,167,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,201,167,0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  cloneBtnText: {
    fontSize: 13,
    color: Palette.teal,
    fontWeight: '700',
  },
});
