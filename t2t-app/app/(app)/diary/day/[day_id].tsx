import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Dimensions, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - 40;

const MOODS = [
  { emoji: '😍', label: 'Fantastico' },
  { emoji: '😊', label: 'Felice' },
  { emoji: '😌', label: 'Rilassato' },
  { emoji: '🤩', label: 'Entusiasta' },
  { emoji: '😋', label: 'Goloso' },
  { emoji: '🥱', label: 'Stanco' },
  { emoji: '😤', label: 'Frustrato' },
  { emoji: '🥶', label: 'Congelato' },
  { emoji: '🥵', label: 'Sudato' },
  { emoji: '🤢', label: 'Malato' },
];

type DayEntry = {
  id: string;
  type: 'text' | 'tip' | 'photo' | 'mood' | 'location';
  content: string | null;
  metadata: any;
  sort_order: number;
};

type DayInfo = {
  id: string;
  day_number: number;
  title: string | null;
  date: string | null;
};

export default function DayDetailScreen() {
  const { day_id, diary_id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [dayInfo, setDayInfo] = useState<DayInfo | null>(null);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Aggiunta inline
  const [addingType, setAddingType] = useState<'text' | 'tip' | 'location' | null>(null);
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Upload foto
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Mood selector
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  // Editing
  const [editingEntry, setEditingEntry] = useState<DayEntry | null>(null);
  const [editContent, setEditContent] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (day_id) {
        fetchDayInfo();
        fetchEntries();
      }
    }, [day_id])
  );

  async function fetchDayInfo() {
    const { data, error } = await supabase
      .from('diary_days')
      .select('id, day_number, title, date')
      .eq('id', day_id)
      .single();
    if (!error && data) setDayInfo(data);
  }

  async function fetchEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from('day_entries')
      .select('id, type, content, metadata, sort_order')
      .eq('day_id', day_id)
      .order('sort_order', { ascending: true });
    if (!error && data) setEntries(data);
    setLoading(false);
  }

  function getNextSortOrder() {
    return entries.length > 0 ? Math.max(...entries.map(e => e.sort_order)) + 1 : 1;
  }

  // === AGGIUNTA ENTRY ===
  async function addEntry(type: 'text' | 'tip' | 'location', content: string) {
    if (!content.trim()) return;
    setSaving(true);

    const metadata = type === 'tip' ? { category: 'general' }
      : type === 'location' ? { place_name: content.trim() }
      : null;

    const { error } = await supabase.from('day_entries').insert({
      day_id, type, content: content.trim(), metadata, sort_order: getNextSortOrder(),
    });
    setSaving(false);

    if (error) {
      Alert.alert('Errore', `Impossibile aggiungere.\n${error.message}`);
    } else {
      setNewContent(''); setAddingType(null); fetchEntries();
    }
  }

  // === MOOD ===
  async function addMood(emoji: string, label: string) {
    setShowMoodPicker(false);
    setSaving(true);

    const { error } = await supabase.from('day_entries').insert({
      day_id, type: 'mood', content: emoji, metadata: { label }, sort_order: getNextSortOrder(),
    });
    setSaving(false);

    if (error) {
      Alert.alert('Errore', error.message);
    } else {
      fetchEntries();
    }
  }

  // === FOTO ===
  async function pickAndUploadPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permesso negato', 'Devi consentire l\'accesso alla galleria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: false, quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setShowAddMenu(false);
    setUploadingPhoto(true);

    try {
      const fileExt = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user?.id}/${diary_id}/${day_id}/${Date.now()}.${fileExt}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('diary-media')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: false,
        });

      if (uploadError) { Alert.alert('Errore Upload', uploadError.message); setUploadingPhoto(false); return; }

      const { data: urlData, error: urlError } = await supabase.storage
        .from('diary-media')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      if (urlError || !urlData?.signedUrl) { Alert.alert('Errore', 'Impossibile generare il link.'); setUploadingPhoto(false); return; }

      const { error: entryError } = await supabase.from('day_entries').insert({
        day_id, type: 'photo', content: urlData.signedUrl,
        metadata: { width: asset.width, height: asset.height, caption: '' },
        sort_order: getNextSortOrder(),
      });

      if (entryError) Alert.alert('Errore', entryError.message);
      else fetchEntries();
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    }
    setUploadingPhoto(false);
  }

  // === EDIT ===
  function startEdit(entry: DayEntry) {
    if (entry.type === 'photo') return; // non si edita il testo delle foto
    setEditingEntry(entry);
    setEditContent(entry.content || '');
  }

  async function saveEdit() {
    if (!editingEntry || !editContent.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('day_entries')
      .update({ content: editContent.trim() })
      .eq('id', editingEntry.id);

    setSaving(false);
    if (error) {
      Alert.alert('Errore', error.message);
    } else {
      setEditingEntry(null); setEditContent(''); fetchEntries();
    }
  }

  // === DELETE ===
  async function deleteEntry(entryId: string) {
    Alert.alert('Elimina', 'Vuoi eliminare questo blocco?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive', onPress: async () => {
          const entry = entries.find(e => e.id === entryId);
          if (entry?.type === 'photo' && entry.content) {
            try {
              const url = new URL(entry.content);
              const parts = url.pathname.split('/diary-media/');
              if (parts.length > 1) await supabase.storage.from('diary-media').remove([parts[1]]);
            } catch (_) {}
          }
          const { error } = await supabase.from('day_entries').delete().eq('id', entryId);
          if (!error) fetchEntries();
          else Alert.alert('Errore', 'Impossibile eliminare.');
        }
      },
    ]);
  }

  function startAdding(type: 'text' | 'tip' | 'location') {
    setAddingType(type); setNewContent(''); setShowAddMenu(false);
  }

  // === RENDER ENTRIES ===
  function renderEntry(entry: DayEntry) {
    // MOOD
    if (entry.type === 'mood') {
      return (
        <TouchableOpacity key={entry.id} style={styles.moodCard} onLongPress={() => deleteEntry(entry.id)} delayLongPress={600}>
          <Text style={styles.moodEmoji}>{entry.content}</Text>
          <Text style={styles.moodLabel}>{entry.metadata?.label || 'Mood'}</Text>
        </TouchableOpacity>
      );
    }

    // PHOTO
    if (entry.type === 'photo') {
      const ar = entry.metadata?.width && entry.metadata?.height ? entry.metadata.width / entry.metadata.height : 4 / 3;
      return (
        <TouchableOpacity key={entry.id} style={styles.photoCard} onLongPress={() => deleteEntry(entry.id)} delayLongPress={600}>
          <Image source={{ uri: entry.content || '' }} style={[styles.entryPhoto, { width: IMAGE_WIDTH, height: IMAGE_WIDTH / ar }]} resizeMode="cover" />
          {entry.metadata?.caption ? <Text style={styles.photoCaption}>{entry.metadata.caption}</Text> : null}
        </TouchableOpacity>
      );
    }

    // LOCATION
    if (entry.type === 'location') {
      return (
        <TouchableOpacity key={entry.id} style={styles.locationCard} onPress={() => startEdit(entry)} onLongPress={() => deleteEntry(entry.id)} delayLongPress={600}>
          <Ionicons name="location" size={20} color="#FF3B30" />
          <Text style={styles.locationText}>{entry.content}</Text>
        </TouchableOpacity>
      );
    }

    // TEXT / TIP
    return (
      <TouchableOpacity
        key={entry.id}
        style={[styles.entryCard, entry.type === 'tip' && styles.entryCardTip]}
        onPress={() => startEdit(entry)}
        onLongPress={() => deleteEntry(entry.id)}
        delayLongPress={600}
      >
        <View style={styles.entryHeader}>
          <Ionicons name={entry.type === 'tip' ? 'bulb' : 'document-text'} size={18} color={entry.type === 'tip' ? '#FF9500' : '#007AFF'} />
          <Text style={[styles.entryType, entry.type === 'tip' && styles.entryTypeTip]}>
            {entry.type === 'tip' ? 'Consiglio' : 'Testo'}
          </Text>
          <Ionicons name="pencil" size={14} color="#bbb" style={{ marginLeft: 'auto' }} />
        </View>
        <Text style={styles.entryContent}>{entry.content}</Text>
      </TouchableOpacity>
    );
  }

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
            Giorno {dayInfo?.day_number}{dayInfo?.title ? `: ${dayInfo.title}` : ''}
          </Text>
          {dayInfo?.date && <Text style={styles.headerDate}>{dayInfo.date}</Text>}
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setShowAddMenu(!showAddMenu)}>
          <Ionicons name="add-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Menu Aggiungi */}
      {showAddMenu && (
        <View style={styles.addMenu}>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => startAdding('text')}>
            <Ionicons name="document-text" size={22} color="#007AFF" />
            <Text style={styles.addMenuText}>Testo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={pickAndUploadPhoto}>
            <Ionicons name="camera" size={22} color="#34C759" />
            <Text style={styles.addMenuText}>Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => startAdding('tip')}>
            <Ionicons name="bulb" size={22} color="#FF9500" />
            <Text style={styles.addMenuText}>Tip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => { setShowMoodPicker(true); setShowAddMenu(false); }}>
            <Text style={{ fontSize: 22 }}>😊</Text>
            <Text style={styles.addMenuText}>Mood</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => startAdding('location')}>
            <Ionicons name="location" size={22} color="#FF3B30" />
            <Text style={styles.addMenuText}>Luogo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload overlay */}
      {uploadingPhoto && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadText}>Caricamento foto...</Text>
        </View>
      )}

      {/* Contenuto */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {entries.length === 0 && !addingType && (
          <View style={styles.emptyState}>
            <Ionicons name="create-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nessun contenuto ancora</Text>
            <Text style={styles.emptySub}>Premi il + in alto per aggiungere testi, foto, mood o consigli!</Text>
          </View>
        )}

        {entries.map(renderEntry)}

        {/* Form aggiunta inline */}
        {addingType && (
          <View style={[styles.addForm, addingType === 'tip' && styles.addFormTip, addingType === 'location' && styles.addFormLocation]}>
            <View style={styles.addFormHeader}>
              <Ionicons
                name={addingType === 'tip' ? 'bulb' : addingType === 'location' ? 'location' : 'document-text'}
                size={20}
                color={addingType === 'tip' ? '#FF9500' : addingType === 'location' ? '#FF3B30' : '#007AFF'}
              />
              <Text style={styles.addFormTitle}>
                {addingType === 'tip' ? 'Nuovo Consiglio' : addingType === 'location' ? 'Nuovo Luogo' : 'Nuovo Testo'}
              </Text>
            </View>
            <TextInput
              style={[styles.addFormInput, addingType === 'location' && { minHeight: 48 }]}
              placeholder={
                addingType === 'tip' ? "Es. Prendete il biglietto cumulativo!"
                  : addingType === 'location' ? "Es. Colosseo, Roma"
                  : "Racconta cosa hai vissuto..."
              }
              placeholderTextColor="#999"
              value={newContent}
              onChangeText={setNewContent}
              multiline={addingType !== 'location'}
              numberOfLines={addingType === 'location' ? 1 : 4}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.addFormActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAddingType(null); setNewContent(''); }}>
                <Text style={styles.cancelBtnText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !newContent.trim() && styles.saveBtnDisabled]}
                disabled={!newContent.trim() || saving}
                onPress={() => addEntry(addingType, newContent)}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Salva</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Mood Picker */}
      <Modal visible={showMoodPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.moodPickerContainer}>
            <Text style={styles.moodPickerTitle}>Come ti senti oggi?</Text>
            <View style={styles.moodGrid}>
              {MOODS.map((m) => (
                <TouchableOpacity key={m.emoji} style={styles.moodOption} onPress={() => addMood(m.emoji, m.label)}>
                  <Text style={styles.moodOptionEmoji}>{m.emoji}</Text>
                  <Text style={styles.moodOptionLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.moodCancelBtn} onPress={() => setShowMoodPicker(false)}>
              <Text style={styles.cancelBtnText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Edit */}
      <Modal visible={!!editingEntry} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.editModalTitle}>
              Modifica {editingEntry?.type === 'tip' ? 'Consiglio' : editingEntry?.type === 'location' ? 'Luogo' : 'Testo'}
            </Text>
            <TextInput
              style={styles.editModalInput}
              multiline={editingEntry?.type !== 'location'}
              value={editContent}
              onChangeText={setEditContent}
              autoFocus
              textAlignVertical="top"
            />
            <View style={styles.addFormActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingEntry(null); setEditContent(''); }}>
                <Text style={styles.cancelBtnText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !editContent.trim() && styles.saveBtnDisabled]}
                disabled={!editContent.trim() || saving}
                onPress={saveEdit}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Salva</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  headerIcon: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  headerDate: { fontSize: 13, color: '#666', marginTop: 2 },
  addMenu: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee' },
  addMenuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  addMenuText: { fontSize: 13, fontWeight: '600', color: '#333' },
  uploadOverlay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, backgroundColor: '#e8f4fd' },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  content: { flex: 1 },
  contentInner: { padding: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#999', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#bbb', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },

  // Entry cards
  entryCard: { backgroundColor: '#f5f7fa', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  entryCardTip: { backgroundColor: '#fff8ed', borderLeftColor: '#FF9500' },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  entryType: { fontSize: 12, fontWeight: '700', color: '#007AFF', textTransform: 'uppercase' },
  entryTypeTip: { color: '#FF9500' },
  entryContent: { fontSize: 15, lineHeight: 22, color: '#333' },
  photoCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  entryPhoto: { borderRadius: 16 },
  photoCaption: { padding: 12, fontSize: 14, color: '#666', fontStyle: 'italic' },

  // Mood
  moodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f8ff', borderRadius: 16, padding: 16, marginBottom: 12, gap: 12, borderLeftWidth: 4, borderLeftColor: '#5856D6' },
  moodEmoji: { fontSize: 32 },
  moodLabel: { fontSize: 16, fontWeight: '600', color: '#5856D6' },

  // Location
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff0f0', borderRadius: 16, padding: 16, marginBottom: 12, gap: 10, borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
  locationText: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1 },

  // Add form
  addForm: { backgroundColor: '#f0f4ff', borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed' },
  addFormTip: { backgroundColor: '#fff8ed', borderColor: '#FF9500' },
  addFormLocation: { backgroundColor: '#fff0f0', borderColor: '#FF3B30' },
  addFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  addFormTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  addFormInput: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#1a1a1a', minHeight: 100, lineHeight: 22 },
  addFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  cancelBtnText: { fontSize: 15, color: '#666', fontWeight: '600' },
  saveBtn: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },

  // Mood Picker Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  moodPickerContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  moodPickerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 20 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  moodOption: { alignItems: 'center', width: 72, paddingVertical: 12, backgroundColor: '#f5f5f5', borderRadius: 16 },
  moodOptionEmoji: { fontSize: 28 },
  moodOptionLabel: { fontSize: 11, color: '#666', marginTop: 4, fontWeight: '600' },
  moodCancelBtn: { alignItems: 'center', marginTop: 20, paddingVertical: 12 },

  // Edit Modal
  editModalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  editModalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  editModalInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 15, color: '#1a1a1a', minHeight: 120, lineHeight: 22 },
});
