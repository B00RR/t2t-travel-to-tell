import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Spacing } from '@/constants/theme';

// Hooks & Types
import { useDayEntries } from '@/hooks/useDayEntries';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import type { DayEntry } from '@/types/dayEntry';

// Components
import { EntryCard } from '@/components/EntryCard';
import { AddEntryForm } from '@/components/AddEntryForm';
import { EditEntryModal } from '@/components/EditEntryModal';
import { MoodPickerModal } from '@/components/MoodPickerModal';
import { EntryCardSkeleton } from '@/components/Skeleton';
import { ErrorView } from '@/components/ErrorView';

type AddableType = 'text' | 'tip' | 'location';

export default function DayDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const day_id = Array.isArray(params.day_id) ? params.day_id[0] : params.day_id;
  const diary_id = Array.isArray(params.diary_id) ? params.diary_id[0] : params.diary_id;
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();

  // Custom Hooks
  const {
    dayInfo, entries, loading, saving,
    fetchDayInfo, fetchEntries, addEntry, addMood, updateEntry, deleteEntry, moveEntry, getNextSortOrder,
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
  const [reorderMode, setReorderMode] = useState(false);

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
    if (entry.type === 'photo') return;
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

  if (loading && (!dayInfo || entries.length === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.header, { backgroundColor: theme.bgSurface, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
             <View style={{ backgroundColor: theme.bgElevated, width: 100, height: 20, borderRadius: 4 }} />
          </View>
          <View style={styles.headerIcon} />
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <EntryCardSkeleton />
          <EntryCardSkeleton />
          <EntryCardSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (!loading && !dayInfo) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.header, { backgroundColor: theme.bgSurface, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter} />
          <View style={styles.headerIcon} />
        </View>
        <ErrorView onRetry={() => { fetchDayInfo(); fetchEntries(); }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bgSurface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t('day.title', { number: dayInfo?.day_number })}{dayInfo?.title ? `: ${dayInfo.title}` : ''}
          </Text>
          {dayInfo?.date && <Text style={[styles.headerDate, { color: theme.textMuted }]}>{dayInfo.date}</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {entries.length > 1 && (
            <TouchableOpacity style={styles.headerIcon} onPress={() => { setReorderMode(r => !r); setShowAddMenu(false); }}>
              <Ionicons name={reorderMode ? 'checkmark-circle' : 'reorder-three-outline'} size={26} color={reorderMode ? theme.sage : theme.teal} />
            </TouchableOpacity>
          )}
          {!reorderMode && (
            <TouchableOpacity style={styles.headerIcon} onPress={() => setShowAddMenu(!showAddMenu)}>
              <Ionicons name="add-circle" size={28} color={theme.teal} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Add Menu */}
      {showAddMenu && (
        <View style={[styles.addMenu, { backgroundColor: theme.bgElevated, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={[styles.addMenuItem, { backgroundColor: theme.bgSurface }]} onPress={() => handleStartAdding('text')}>
            <Ionicons name="document-text" size={22} color={theme.teal} />
            <Text style={[styles.addMenuText, { color: theme.textPrimary }]}>{t('day.type_text')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addMenuItem, { backgroundColor: theme.bgSurface }]} onPress={() => { setShowAddMenu(false); pickAndUploadMedia(); }}>
            <Ionicons name="camera" size={22} color={theme.sage} />
            <Text style={[styles.addMenuText, { color: theme.textPrimary }]}>{t('day.type_photo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addMenuItem, { backgroundColor: theme.bgSurface }]} onPress={() => handleStartAdding('tip')}>
            <Ionicons name="bulb" size={22} color={theme.orange} />
            <Text style={[styles.addMenuText, { color: theme.textPrimary }]}>{t('day.type_tip')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addMenuItem, { backgroundColor: theme.bgSurface }]} onPress={() => { setShowMoodPicker(true); setShowAddMenu(false); }}>
            <Text style={{ fontSize: 22 }}>😊</Text>
            <Text style={[styles.addMenuText, { color: theme.textPrimary }]}>{t('day.type_mood')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addMenuItem, { backgroundColor: theme.bgSurface }]} onPress={() => handleStartAdding('location')}>
            <Ionicons name="location" size={22} color={theme.red} />
            <Text style={[styles.addMenuText, { color: theme.textPrimary }]}>{t('day.type_location')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Overlay */}
      {uploadingMedia && (
        <View style={[styles.uploadOverlay, { backgroundColor: theme.tealAlpha15 }]}>
          <ActivityIndicator size="small" color={theme.teal} />
          <Text style={[styles.uploadText, { color: theme.teal }]}>{t('day.uploading_media')}</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {entries.length === 0 && !addingType && (
          <View style={styles.emptyState}>
            <Ionicons name="create-outline" size={64} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>{t('day.no_content')}</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>{t('day.add_hint')}</Text>
          </View>
        )}

        {/* Entry List */}
        {entries.map((entry, idx) => (
          reorderMode ? (
            <View key={entry.id} style={styles.reorderRow}>
              <View style={{ flex: 1 }}>
                <EntryCard entry={entry} onPress={() => {}} onLongPress={() => {}} />
              </View>
              <View style={styles.reorderBtns}>
                <TouchableOpacity
                  style={[styles.reorderBtn, { backgroundColor: theme.tealAlpha10 }, idx === 0 && { backgroundColor: theme.bgElevated }]}
                  onPress={() => idx > 0 && moveEntry(entry.id, 'up')}
                  disabled={idx === 0}
                >
                  <Ionicons name="chevron-up" size={20} color={idx === 0 ? theme.border : theme.teal} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reorderBtn, { backgroundColor: theme.tealAlpha10 }, idx === entries.length - 1 && { backgroundColor: theme.bgElevated }]}
                  onPress={() => idx < entries.length - 1 && moveEntry(entry.id, 'down')}
                  disabled={idx === entries.length - 1}
                >
                  <Ionicons name="chevron-down" size={20} color={idx === entries.length - 1 ? theme.border : theme.teal} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <EntryCard
              key={entry.id}
              entry={entry}
              onPress={handleStartEdit}
              onLongPress={deleteEntry}
            />
          )
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
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerIcon: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerDate: { fontSize: 13, marginTop: 2 },
  addMenu: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10,
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  addMenuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  addMenuText: { fontSize: 13, fontWeight: '600' },
  uploadOverlay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 10,
  },
  uploadText: { fontSize: 14, fontWeight: '600' },
  content: { flex: 1 },
  contentInner: { padding: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  reorderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reorderBtns: { gap: 4 },
  reorderBtn: {
    width: 36, height: 36, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  reorderBtnDisabled: { opacity: 0.5 },
});
