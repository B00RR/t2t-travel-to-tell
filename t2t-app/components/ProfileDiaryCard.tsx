import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Diary } from '@/types/supabase';

interface ProfileDiaryCardProps {
  item: Diary;
}

const ProfileDiaryCardComponent = ({ item }: ProfileDiaryCardProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.diaryCard}
      onPress={() => router.push(`/diary/${item.id}`)}
    >
      <View style={styles.diaryInfo}>
        <Text style={styles.diaryTitle} numberOfLines={1}>{item.title}</Text>
        {item.destinations && item.destinations.length > 0 && (
          <Text style={styles.diaryDest} numberOfLines={1}>
            📍 {item.destinations.join(', ')}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

export const ProfileDiaryCard = React.memo(ProfileDiaryCardComponent);

const styles = StyleSheet.create({
  diaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  diaryInfo: {
    flex: 1,
    paddingRight: 10,
  },
  diaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  diaryDest: {
    fontSize: 13,
    color: '#666',
  },
});
