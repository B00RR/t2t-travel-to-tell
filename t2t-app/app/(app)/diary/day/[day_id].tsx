import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type DayEntry = {
  id: string;
  type: 'text' | 'tip' | 'mood';
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

  const [dayInfo, setDayInfo] = useState<DayInfo | null>(null);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Stato per l'aggiunta inline
  const [addingType, setAddingType] = useState<'text' | 'tip' | null>(null);
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

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

    if (!error && data) {
      setDayInfo(data);
    }
  }

  async function fetchEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from('day_entries')
      .select('id, type, content, metadata, sort_order')
      .eq('day_id', day_id)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  }

  async function addEntry(type: 'text' | 'tip', content: string) {
    if (!content.trim()) return;

    setSaving(true);

    const nextSortOrder = entries.length > 0
      ? Math.max(...entries.map(e => e.sort_order)) + 1
      : 1;

    const metadata = type === 'tip' ? { category: 'general' } : null;

    const { error } = await supabase
      .from('day_entries')
      .insert({
        day_id: day_id,
        type,
        content: content.trim(),
        metadata,
        sort_order: nextSortOrder,
      });

    setSaving(false);

    if (error) {
      Alert.alert('Errore', `Impossibile aggiungere il contenuto.\n${error.message}`);
    } else {
      setNewContent('');
      setAddingType(null);
      fetchEntries();
    }
  }

  async function deleteEntry(entryId: string) {
    Alert.alert('Elimina', 'Vuoi eliminare questo blocco?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive', onPress: async () => {
          const { error } = await supabase
            .from('day_entries')
            .delete()
            .eq('id', entryId);

          if (!error) {
            fetchEntries();
          } else {
            Alert.alert('Errore', 'Impossibile eliminare il blocco.');
          }
        }
      },
    ]);
  }

  function startAdding(type: 'text' | 'tip') {
    setAddingType(type);
    setNewContent('');
    setShowAddMenu(false);
  }

  if (loading && !dayInfo) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            <Ionicons name="document-text" size={24} color="#007AFF" />
            <Text style={styles.addMenuText}>Testo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addMenuItem} onPress={() => startAdding('tip')}>
            <Ionicons name="bulb" size={24} color="#FF9500" />
            <Text style={styles.addMenuText}>Consiglio</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contenuto */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {entries.length === 0 && !addingType && (
          <View style={styles.emptyState}>
            <Ionicons name="create-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nessun contenuto ancora</Text>
            <Text style={styles.emptySub}>Premi il + in alto per aggiungere testi o consigli di viaggio!</Text>
          </View>
        )}

        {entries.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={[
              styles.entryCard,
              entry.type === 'tip' && styles.entryCardTip,
            ]}
            onLongPress={() => deleteEntry(entry.id)}
            delayLongPress={600}
          >
            <View style={styles.entryHeader}>
              <Ionicons
                name={entry.type === 'tip' ? 'bulb' : 'document-text'}
                size={18}
                color={entry.type === 'tip' ? '#FF9500' : '#007AFF'}
              />
              <Text style={[styles.entryType, entry.type === 'tip' && styles.entryTypeTip]}>
                {entry.type === 'tip' ? 'Consiglio' : 'Testo'}
              </Text>
            </View>
            <Text style={styles.entryContent}>{entry.content}</Text>
          </TouchableOpacity>
        ))}

        {/* Form aggiunta inline */}
        {addingType && (
          <View style={[styles.addForm, addingType === 'tip' && styles.addFormTip]}>
            <View style={styles.addFormHeader}>
              <Ionicons
                name={addingType === 'tip' ? 'bulb' : 'document-text'}
                size={20}
                color={addingType === 'tip' ? '#FF9500' : '#007AFF'}
              />
              <Text style={styles.addFormTitle}>
                {addingType === 'tip' ? 'Nuovo Consiglio' : 'Nuovo Testo'}
              </Text>
            </View>
            <TextInput
              style={styles.addFormInput}
              placeholder={
                addingType === 'tip'
                  ? "Es. Prendete il biglietto cumulativo, costa meno!"
                  : "Racconta cosa hai vissuto..."
              }
              placeholderTextColor="#999"
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.addFormActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setAddingType(null); setNewContent(''); }}
              >
                <Text style={styles.cancelBtnText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !newContent.trim() && styles.saveBtnDisabled]}
                disabled={!newContent.trim() || saving}
                onPress={() => addEntry(addingType, newContent)}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Salva</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerIcon: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  addMenu: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addMenuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#999',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
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
  entryTypeTip: {
    color: '#FF9500',
  },
  entryContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  addForm: {
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addFormTip: {
    backgroundColor: '#fff8ed',
    borderColor: '#FF9500',
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addFormTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  addFormInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 100,
    lineHeight: 22,
  },
  addFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});
