import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

// Hooks & Types
import { useDayEntries } from '@/hooks/useDayEntries';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import type { DayEntry } from '@/types/dayEntry';

// Components
import { EntryCard } from '@/components/EntryCard';
import { AddEntryForm } from '@/components/AddEntryForm';
import { EditEntryModal } from '@/components/EditEntryModal';
import { MoodPickerModal } from '@/components/MoodPickerModal';

type AddableType = 'text' | 'tip' | 'location';

export default function DayDetailScreen() {
  const { t } = useTranslation();
  const { day_id, diary_id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Custom Hooks
  const {
    dayInfo, entries, loading, saving,
    fetchDayInfo, fetchEntries, addEntry, addMood, updateEntry, deleteEntry, getNextSortOrder,
  } = useDayEntries(day_id as string);

  const { uploading: uploadingMedia, pickAndUploadMedia } = useMediaUpload({
    userId: user?.id,
    diaryId: diary_id as string,
    dayId: day_id as string,
    getNextSortOrder,
    onUploadComplete: fetchEntries,
  });

  // Local UI State
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addingType, setAddingType] = useState<AddableType | null>(null);
  const [newContent, setNewContent] = useState('');

  const [showMoodPicker, setShowMoodPicker] = useState(false);

  const [editingEntry, setEditingEntry] = useState<DayEntry | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch data on focus
  useFocusEffect(
    useCallback(() => {
      if (day_id) {
        fetchDayInfo();
        fetchEntries();
      }
    }, [day_id, fetchDayInfo, fetchEntries])
  );

  // --- Handlers ---

  const handleStartAdding = (type: AddableType) => {
    setAddingType(type);
    setNewContent('');
    setShowAddMenu(false);
  };

  const handleSaveAdd = async () => {
    if (!addingType) return;
    const success = await addEntry(addingType, newContent);
    if (success) {
      setAddingType(null);
      setNewContent('');
    }
  };

  const handleStartEdit = (entry: DayEntry) => {
    if (entry.type === 'photo') return; // Cannot edit photo text currently
    setEditingEntry(entry);
    setEditContent(entry.content || '');
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    const success = await updateEntry(editingEntry.id, editContent);
    if (success) {
      setEditingEntry(null);
      setEditContent('');
    }
  };

  // --- Renders ---

  if (loading && !dayInfo) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {t('day.title', { number: dayInfo?.day_number })}{dayInfo?.title ? `: ${dayInfo.title}` : ''}
          </Text>
          {dayInfo?.date && <Text style={styles.headerDate}>{dayInfo.date}</Text>}
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setShowAddMenu(!showAddMenu)}>
          <Ionicons name="add-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Add Menu */}
      {showAddMenu && (
        <View style={styles.addMenu}>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => handleStartAdding('text')}>
            <Ionicons name="document-text" size={22} color="#007AFF" />
            <Text style={styles.addMenuText}>{t('day.type_text')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => { setShowAddMenu(false); pickAndUploadMedia(); }}>
            <Ionicons name="camera" size={22} color="#34C759" />
            <Text style={styles.addMenuText}>{t('day.type_photo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => handleStartAdding('tip')}>
            <Ionicons name="bulb" size={22} color="#FF9500" />
            <Text style={styles.addMenuText}>{t('day.type_tip')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => { setShowMoodPicker(true); setShowAddMenu(false); }}>
            <Text style={{ fontSize: 22 }}>😊</Text>
            <Text style={styles.addMenuText}>{t('day.type_mood')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => handleStartAdding('location')}>
            <Ionicons name="location" size={22} color="#FF3B30" />
            <Text style={styles.addMenuText}>{t('day.type_location')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Overlay */}
      {uploadingMedia && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadText}>{t('day.uploading_media')}</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {entries.length === 0 && !addingType && (
          <View style={styles.emptyState}>
            <Ionicons name="create-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>{t('day.no_content')}</Text>
            <Text style={styles.emptySub}>{t('day.add_hint')}</Text>
          </View>
        )}

        {/* Entry List */}
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onPress={handleStartEdit}
            onLongPress={deleteEntry}
          />
        ))}

        {/* Inline Add Form */}
        {addingType && (
          <AddEntryForm
            type={addingType}
            value={newContent}
            onChangeText={setNewContent}
            onSave={handleSaveAdd}
            onCancel={() => { setAddingType(null); setNewContent(''); }}
            saving={saving}
          />
        )}
      </ScrollView>

      {/* Modals */}
      <MoodPickerModal
        visible={showMoodPicker}
        onSelect={async (emoji, label) => {
          setShowMoodPicker(false);
          await addMood(emoji, label);
        }}
        onClose={() => setShowMoodPicker(false)}
      />

      <EditEntryModal
        entry={editingEntry}
        value={editContent}
        onChangeText={setEditContent}
        saving={saving}
        onSave={handleSaveEdit}
        onClose={() => { setEditingEntry(null); setEditContent(''); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff',
  },
  headerIcon: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  headerDate: { fontSize: 13, color: '#666', marginTop: 2 },
  addMenu: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10,
    paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#f9f9f9',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  addMenuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  addMenuText: { fontSize: 13, fontWeight: '600', color: '#333' },
  uploadOverlay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 10, backgroundColor: '#e8f4fd',
  },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  content: { flex: 1 },
  contentInner: { padding: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#999', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#bbb', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
});
