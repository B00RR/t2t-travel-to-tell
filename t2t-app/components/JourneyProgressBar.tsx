import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Palette } from '@/constants/theme';

interface JourneyProgressBarProps {
  totalDays: number;
  currentDay: number;
  onDayPress: (index: number) => void;
}

/**
 * Segmented progress bar for the Journey Player.
 * Shows one segment per day; active segment fills with teal.
 * Tap a segment to jump to that day.
 */
export function JourneyProgressBar({ totalDays, currentDay, onDayPress }: JourneyProgressBarProps) {
  if (totalDays <= 1) return null;

  return (
    <View style={styles.container}>
      {Array.from({ length: totalDays }).map((_, i) => {
        const isActive = i === currentDay;
        const isPast = i < currentDay;

        return (
          <TouchableOpacity
            key={i}
            style={[styles.segment, { flex: 1 }]}
            onPress={() => onDayPress(i)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.segmentBar,
                isPast && styles.segmentPast,
                isActive && styles.segmentActive,
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segment: {
    height: 20,
    justifyContent: 'center',
  },
  segmentBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  segmentPast: {
    backgroundColor: 'rgba(0,201,167,0.5)',
  },
  segmentActive: {
    backgroundColor: Palette.teal,
    height: 4,
  },
});
