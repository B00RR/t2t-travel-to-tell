import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Palette } from '@/constants/theme';
import type { FeedDiary } from '@/types/supabase';

interface ExploreDiaryCardProps {
  item: FeedDiary;
}

const ExploreDiaryCardComponent = ({ item }: ExploreDiaryCardProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push(`/diary/${item.id}`)}
    >
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.cardImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="earth-outline" size={28} color={Palette.textMuted} />
        </View>
      )}

      {/* Gradient overlay */}
      <View style={styles.overlay}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <TouchableOpacity
          onPress={() => router.push(`/profile/${item.author_id}`)}
          activeOpacity={0.75}
        >
          <Text style={styles.cardAuthor}>
            {item.profiles?.display_name || item.profiles?.username || t('common.anonymous')}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const ExploreDiaryCard = React.memo(ExploreDiaryCardComponent);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    height: 200,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    backgroundColor: Palette.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.bgElevated,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 32,
    backgroundColor: 'rgba(9,9,15,0.72)',
  },
  cardTitle: {
    color: Palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  cardAuthor: {
    color: Palette.teal,
    fontSize: 11,
    fontWeight: '600',
  },
});
