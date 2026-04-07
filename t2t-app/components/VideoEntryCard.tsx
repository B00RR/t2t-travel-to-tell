import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { VideoDayEntry } from '@/types/dayEntry';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - 40;

interface VideoEntryCardProps {
  entry: VideoDayEntry;
  onLongPress: (entryId: string) => void;
}

export function VideoEntryCard({ entry, onLongPress }: VideoEntryCardProps) {
  const theme = useAppTheme();
  const player = useVideoPlayer(entry.content || '', (p) => {
    p.loop = false;
  });

  const [isVideoStarted, setIsVideoStarted] = useState(false);

  const ar =
    entry.metadata?.width && entry.metadata?.height
      ? entry.metadata.width / entry.metadata.height
      : 16 / 9;

  const thumbnailUrl = entry.metadata?.thumbnailUrl;

  const longPressGesture = Gesture.LongPress()
    .minDuration(600)
    .onEnd((_event, success) => {
      if (success) {
        runOnJS(onLongPress)(entry.id);
      }
    });

  const handleInitialPlay = () => {
    player.play();
    setIsVideoStarted(true);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.bgElevated }]}>
      <View style={{ width: IMAGE_WIDTH, height: IMAGE_WIDTH / ar, backgroundColor: theme.isDark ? '#000' : '#0A0A0A', borderRadius: 16, overflow: 'hidden' }}>
        <GestureDetector gesture={longPressGesture}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            nativeControls={isVideoStarted}
            contentFit="cover"
          />
        </GestureDetector>

        {thumbnailUrl && !isVideoStarted && (
          <Image
            source={{ uri: thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}

        {!isVideoStarted && (
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, styles.playOverlay]}
            onPress={handleInitialPlay}
            onLongPress={() => onLongPress(entry.id)}
            delayLongPress={600}
          >
            <Ionicons name="play-circle" size={80} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {entry.metadata?.caption ? (
        <Text style={[styles.caption, { color: theme.textMuted }]}>{entry.metadata.caption}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  playOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  caption: {
    padding: 12,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
