import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';
import type { Diary } from '@/types/supabase';

interface ProfileDiaryCardProps {
  item: Diary;
}

const ProfileDiaryCardComponent = ({ item }: ProfileDiaryCardProps) => {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.diaryCard, { backgroundColor: theme.bgElevated }]}
      onPress={() => router.push(`/diary/${item.id}`)}
    >
      <View style={styles.diaryInfo}>
        <Text style={[styles.diaryTitle, { color: theme.textPrimary }]} numberOfLines={1}>{item.title}</Text>
        {item.destinations && item.destinations.length > 0 && (
          <Text style={[styles.diaryDest, { color: theme.textMuted }]} numberOfLines={1}>
            📍 {item.destinations.join(', ')}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
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
    borderRadius: Radius.sm,
  },
  diaryInfo: {
    flex: 1,
    paddingRight: 10,
  },
  diaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  diaryDest: {
    fontSize: 13,
  },
});
