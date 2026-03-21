import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TripPlanStop } from '@/types/tripPlan';

interface TripPlanStopItemProps {
  stop: TripPlanStop;
  isOwner: boolean;
  onUpdate?: (stopId: string, updates: Partial<Pick<TripPlanStop, 'title' | 'location_name' | 'notes'>>) => void;
  onDelete?: (stopId: string) => void;
}

export function TripPlanStopItem({ stop, isOwner, onUpdate, onDelete }: TripPlanStopItemProps) {
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
      <View style={styles.dayBadge}>
        <Text style={styles.dayNumber}>{stop.day_number}</Text>
      </View>

      <View style={styles.content}>
        {editing ? (
          <>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Day title"
              placeholderTextColor="#bbb"
            />
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#999" />
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={locationName}
                onChangeText={setLocationName}
                placeholder="Location"
                placeholderTextColor="#bbb"
              />
            </View>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes..."
              placeholderTextColor="#bbb"
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
            <Text style={styles.stopTitle}>
              {stop.title || `Day ${stop.day_number}`}
            </Text>
            {stop.location_name ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color="#007AFF" />
                <Text style={styles.locationText}>{stop.location_name}</Text>
              </View>
            ) : null}
            {stop.notes ? (
              <Text style={styles.notesText} numberOfLines={2}>{stop.notes}</Text>
            ) : null}
          </>
        )}
      </View>

      {isOwner && !editing && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil-outline" size={18} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete?.(stop.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  stopTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#1a1a1a',
    backgroundColor: '#fff',
    marginBottom: 6,
  },
  locationInput: {
    flex: 1,
    marginBottom: 6,
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
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  saveBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 8,
    paddingTop: 2,
  },
});
