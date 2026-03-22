import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { DayEntry } from '@/types/dayEntry';
import type { VideoDayEntry } from '@/types/dayEntry';
import { VideoEntryCard } from './VideoEntryCard';
import { RichTextRenderer } from './RichTextRenderer';

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
        <Ionicons name="location" size={20} color="#FF3B30" />
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
          color={entry.type === 'tip' ? '#FF9500' : '#007AFF'}
        />
        <Text style={[styles.entryType, entry.type === 'tip' && styles.entryTypeTip]}>
          {entry.type === 'tip' ? t('day.type_tip') : t('day.type_text')}
        </Text>
        <Ionicons name="pencil" size={14} color="#bbb" style={{ marginLeft: 'auto' }} />
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
    backgroundColor: '#f5f7fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  entryCardTip: {
    backgroundColor: '#fff8ed',
    borderLeftColor: '#FF9500',
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
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  entryTypeTip: { color: '#FF9500' },
  entryContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },

  // Photo
  photoCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  entryPhoto: { borderRadius: 16 },
  photoCaption: {
    padding: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  // Mood
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5856D6',
  },
  moodEmoji: { fontSize: 32 },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5856D6',
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
});
