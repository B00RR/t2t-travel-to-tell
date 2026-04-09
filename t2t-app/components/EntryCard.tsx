import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { DayEntry, VideoDayEntry } from '@/types/dayEntry';
import { VideoEntryCard } from './VideoEntryCard';
import { RichTextRenderer } from './RichTextRenderer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Fonts } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - 40;

interface EntryCardProps {
  entry: DayEntry;
  onPress?: (entry: DayEntry) => void;
  onLongPress?: (entryId: string) => void;
}

export function EntryCard({ entry, onPress, onLongPress }: EntryCardProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  // --- MOOD ---
  if (entry.type === 'mood') {
    return (
      <TouchableOpacity
        style={[styles.moodCard, { backgroundColor: theme.bgSurface, borderLeftColor: theme.ocean }]}
        onLongPress={() => onLongPress?.(entry.id)}
        delayLongPress={600}
      >
        <Text style={styles.moodEmoji}>{entry.content}</Text>
        <Text style={[styles.moodLabel, { color: theme.ocean }]}>{entry.metadata?.label || t('day.type_mood')}</Text>
      </TouchableOpacity>
    );
  }

  // --- PHOTO ---
  if (entry.type === 'photo') {
    const ar =
      entry.metadata?.width && entry.metadata?.height
        ? entry.metadata.width / entry.metadata.height
        : 4 / 3;

    return (
      <TouchableOpacity
        style={[styles.photoCard, { backgroundColor: theme.bgElevated }]}
        onLongPress={() => onLongPress?.(entry.id)}
        delayLongPress={600}
      >
        <Image
          source={{ uri: entry.content || '' }}
          style={[styles.entryPhoto, { width: IMAGE_WIDTH, height: IMAGE_WIDTH / ar }]}
          resizeMode="cover"
        />
        {entry.metadata?.caption ? (
          <Text style={[styles.photoCaption, { color: theme.textSecondary }]}>{entry.metadata.caption}</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  // --- VIDEO ---
  if (entry.type === 'video') {
    return <VideoEntryCard entry={entry as VideoDayEntry} onLongPress={() => onLongPress?.(entry.id)} />;
  }

  // --- LOCATION ---
  if (entry.type === 'location') {
    return (
      <TouchableOpacity
        style={[styles.locationCard, { backgroundColor: theme.bgSurface, borderLeftColor: theme.red }]}
        onPress={() => onPress?.(entry)}
        onLongPress={() => onLongPress?.(entry.id)}
        delayLongPress={600}
      >
        <Ionicons name="location" size={20} color={theme.red} />
        <Text style={[styles.locationText, { color: theme.textPrimary }]}>{entry.content}</Text>
      </TouchableOpacity>
    );
  }

  // --- TEXT / TIP ---
  return (
    <TouchableOpacity
      style={[
        styles.entryCard,
        { backgroundColor: theme.bgSurface, borderLeftColor: theme.teal },
        entry.type === 'tip' && { borderLeftColor: theme.orange },
      ]}
      onPress={() => onPress?.(entry)}
      onLongPress={() => onLongPress?.(entry.id)}
      delayLongPress={600}
    >
      <View style={styles.entryHeader}>
        <Ionicons
          name={entry.type === 'tip' ? 'bulb' : 'document-text'}
          size={18}
          color={entry.type === 'tip' ? theme.orange : theme.teal}
        />
        <Text style={[styles.entryType, { color: entry.type === 'tip' ? theme.orange : theme.teal }]}>
          {entry.type === 'tip' ? t('day.type_tip') : t('day.type_text')}
        </Text>
        <Ionicons name="pencil" size={14} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
      </View>
      {entry.type === 'text' && entry.content ? (
        <RichTextRenderer text={entry.content} />
      ) : (
        <Text style={[styles.entryContent, { color: theme.textSecondary }]}>{entry.content}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Text / Tip
  entryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  entryType: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryContent: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Photo
  photoCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  entryPhoto: { borderRadius: 16 },
  photoCaption: {
    padding: 12,
    fontFamily: Fonts.handwritten,
    fontSize: 16,
  },

  // Mood
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderLeftWidth: 3,
  },
  moodEmoji: { fontSize: 32 },
  moodLabel: {
    fontFamily: Fonts.handwrittenBold,
    fontSize: 18,
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    borderLeftWidth: 3,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});
