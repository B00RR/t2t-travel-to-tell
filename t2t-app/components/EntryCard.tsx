import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { DayEntry } from '@/types/dayEntry';
import type { VideoDayEntry } from '@/types/dayEntry';
import { VideoEntryCard } from './VideoEntryCard';
import { RichTextRenderer } from './RichTextRenderer';
import { Palette } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - 40;

interface EntryCardProps {
  entry: DayEntry;
  onPress: (entry: DayEntry) => void;
  onLongPress: (entryId: string) => void;
}

export function EntryCard({ entry, onPress, onLongPress }: EntryCardProps) {
  const { t } = useTranslation();

  // --- MOOD ---
  if (entry.type === 'mood') {
    return (
      <TouchableOpacity
        style={styles.moodCard}
        onLongPress={() => onLongPress(entry.id)}
        delayLongPress={600}
      >
        <Text style={styles.moodEmoji}>{entry.content}</Text>
        <Text style={styles.moodLabel}>{entry.metadata?.label || t('day.type_mood')}</Text>
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
        style={styles.photoCard}
        onLongPress={() => onLongPress(entry.id)}
        delayLongPress={600}
      >
        <Image
          source={{ uri: entry.content || '' }}
          style={[styles.entryPhoto, { width: IMAGE_WIDTH, height: IMAGE_WIDTH / ar }]}
          resizeMode="cover"
        />
        {entry.metadata?.caption ? (
          <Text style={styles.photoCaption}>{entry.metadata.caption}</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  // --- VIDEO ---
  if (entry.type === 'video') {
    return <VideoEntryCard entry={entry as VideoDayEntry} onLongPress={onLongPress} />;
  }

  // --- LOCATION ---
  if (entry.type === 'location') {
    return (
      <TouchableOpacity
        style={styles.locationCard}
        onPress={() => onPress(entry)}
        onLongPress={() => onLongPress(entry.id)}
        delayLongPress={600}
      >
        <Ionicons name="location" size={20} color={Palette.red} />
        <Text style={styles.locationText}>{entry.content}</Text>
      </TouchableOpacity>
    );
  }

  // --- TEXT / TIP ---
  return (
    <TouchableOpacity
      style={[styles.entryCard, entry.type === 'tip' && styles.entryCardTip]}
      onPress={() => onPress(entry)}
      onLongPress={() => onLongPress(entry.id)}
      delayLongPress={600}
    >
      <View style={styles.entryHeader}>
        <Ionicons
          name={entry.type === 'tip' ? 'bulb' : 'document-text'}
          size={18}
          color={entry.type === 'tip' ? Palette.orange : Palette.teal}
        />
        <Text style={[styles.entryType, entry.type === 'tip' && styles.entryTypeTip]}>
          {entry.type === 'tip' ? t('day.type_tip') : t('day.type_text')}
        </Text>
        <Ionicons name="pencil" size={14} color={Palette.textMuted} style={{ marginLeft: 'auto' }} />
      </View>
      {entry.type === 'text' && entry.content ? (
        <RichTextRenderer text={entry.content} />
      ) : (
        <Text style={styles.entryContent}>{entry.content}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Text / Tip
  entryCard: {
    backgroundColor: Palette.bgSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Palette.teal,
  },
  entryCardTip: {
    backgroundColor: Palette.bgSurface,
    borderLeftColor: Palette.orange,
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
    color: Palette.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryTypeTip: { color: Palette.orange },
  entryContent: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textSecondary,
  },

  // Photo
  photoCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Palette.bgElevated,
  },
  entryPhoto: { borderRadius: 16 },
  photoCaption: {
    padding: 12,
    fontSize: 14,
    color: Palette.textSecondary,
    fontStyle: 'italic',
  },

  // Mood
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.bgSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7C7BF5',
  },
  moodEmoji: { fontSize: 32 },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9D9CF7',
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.bgSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Palette.red,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textPrimary,
    flex: 1,
  },
});
