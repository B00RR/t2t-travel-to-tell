import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
      onPress={() => router.push(`/diary/${item.id}`)}
    >
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.cardImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="map-outline" size={32} color="#ccc" />
        </View>
      )}
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => router.push(`/profile/${item.author_id}`)}>
          <Text style={styles.cardAuthor}>{t('profile.follow')} {item.profiles?.display_name || item.profiles?.username || t('common.anonymous')}</Text>
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
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardAuthor: {
    color: '#ddd',
    fontSize: 12,
  },
});
