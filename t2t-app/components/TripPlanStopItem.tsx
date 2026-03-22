import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TripPlanStop } from '@/types/tripPlan';
import { useAppTheme, type AppTheme } from '@/hooks/useAppTheme';

interface TripPlanStopItemProps {
  stop: TripPlanStop;
  isOwner: boolean;
  onUpdate?: (stopId: string, updates: Partial<Pick<TripPlanStop, 'title' | 'location_name' | 'notes'>>) => void;
  onDelete?: (stopId: string) => void;
}

export function TripPlanStopItem({ stop, isOwner, onUpdate, onDelete }: TripPlanStopItemProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(stop.title ?? '');
  const [locationName, setLocationName] = useState(stop.location_name ?? '');
  const [notes, setNotes] = useState(stop.notes ?? '');

  function handleSave() {
    onUpdate?.(stop.id, {
      title: title.trim() || null,
      location_name: locationName.trim() || null,
      notes: notes.trim() || null,
    });
    setEditing(false);
  }

  function handleCancel() {
    setTitle(stop.title ?? '');
    setLocationName(stop.location_name ?? '');
    setNotes(stop.notes ?? '');
    setEditing(false);
  }

  return (
    <View style={styles.container}>
      {/* Timeline column */}
      <View style={styles.timelineCol}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayNumber}>{stop.day_number}</Text>
        </View>
        <View style={styles.timelineLine} />
      </View>

      <View style={styles.card}>
        {editing ? (
          <>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Day title"
              placeholderTextColor={theme.textMuted}
            />
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.textMuted} />
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={locationName}
                onChangeText={setLocationName}
                placeholder="Location"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes..."
              placeholderTextColor={theme.textMuted}
              multiline
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.cardHeader}>
              <Text style={styles.stopTitle}>
                {stop.title || `Day ${stop.day_number}`}
              </Text>
              {isOwner && (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="pencil-outline" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete?.(stop.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={16} color={theme.red} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {stop.location_name ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={theme.teal} />
                <Text style={styles.locationText}>{stop.location_name}</Text>
              </View>
            ) : null}
            {stop.notes ? (
              <Text style={styles.notesText} numberOfLines={2}>{stop.notes}</Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function makeStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    timelineCol: {
      alignItems: 'center',
      width: 44,
      marginRight: 12,
    },
    dayBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.tealAlpha15,
      borderWidth: 1.5,
      borderColor: t.teal,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayNumber: {
      fontSize: 14,
      fontWeight: '800',
      color: t.teal,
    },
    timelineLine: {
      flex: 1,
      width: 1.5,
      backgroundColor: t.border,
      marginTop: 4,
      marginBottom: -4,
      minHeight: 24,
    },
    card: {
      flex: 1,
      backgroundColor: t.bgElevated,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: t.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    stopTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: t.textPrimary,
      marginRight: 8,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    locationText: {
      fontSize: 13,
      color: t.teal,
      fontWeight: '500',
    },
    notesText: {
      fontSize: 13,
      color: t.textSecondary,
      lineHeight: 18,
      marginTop: 2,
    },
    input: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: t.textPrimary,
      backgroundColor: t.bgSubtle,
      marginBottom: 8,
    },
    locationInput: {
      flex: 1,
    },
    notesInput: {
      minHeight: 60,
      textAlignVertical: 'top',
    },
    editActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 4,
    },
    cancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
    },
    cancelBtnText: {
      fontSize: 13,
      color: t.textSecondary,
      fontWeight: '600',
    },
    saveBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: t.teal,
    },
    saveBtnText: {
      fontSize: 13,
      color: '#fff',
      fontWeight: '700',
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      flexShrink: 0,
    },
  });
}
