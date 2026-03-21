import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TripPlan } from '@/types/tripPlan';

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
      activeOpacity={0.9}
      onPress={() => router.push(`/planner/${item.id}`)}
    >
      {/* Cover */}
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="map-outline" size={40} color="#ccc" />
        </View>
      )}

      {/* From diary badge */}
      {item.source_diary_id && (
        <View style={styles.sourceBadge}>
          <Ionicons name="book-outline" size={12} color="#fff" />
          <Text style={styles.sourceBadgeText}>{t('planner.from_diary')}</Text>
        </View>
      )}

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
          <View style={styles.footerLeft}>
            {item.start_date ? (
              <Text style={styles.dateText}>{formatDate(item.start_date)}</Text>
            ) : null}
            {item.clone_count > 0 && (
              <View style={styles.cloneRow}>
                <Ionicons name="copy-outline" size={13} color="#999" />
                <Text style={styles.cloneText}>
                  {t('planner.clone_count', { count: item.clone_count })}
                </Text>
              </View>
            )}
          </View>

          {!isOwner && onClone && (
            <TouchableOpacity
              style={styles.cloneBtn}
              onPress={() => onClone(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="copy-outline" size={16} color="#007AFF" />
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
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  sourceBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 24,
  },
  destinationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  destPill: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  destPillText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'center',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#999',
  },
  cloneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cloneText: {
    fontSize: 12,
    color: '#999',
  },
  cloneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
  },
  cloneBtnText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
});
