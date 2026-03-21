import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTripPlan } from '@/hooks/useCreateTripPlan';

type Step = 'choose' | 'manual' | 'from_diary';

type DiaryOption = {
  id: string;
  title: string;
  destinations: string[];
  status: string;
};

export default function CreateTripPlanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { creating, createManual, createFromDiary } = useCreateTripPlan(user?.id);

  const [step, setStep] = useState<Step>('choose');

  // Manual form state
  const [title, setTitle] = useState('');
  const [destinations, setDestinations] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // From diary state
  const [diaries, setDiaries] = useState<DiaryOption[]>([]);
  const [loadingDiaries, setLoadingDiaries] = useState(false);
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);

  const fetchMyDiaries = useCallback(async () => {
    if (!user) return;
    setLoadingDiaries(true);
    const { data, error } = await supabase
      .from('diaries')
      .select('id, title, destinations, status')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDiaries(data as DiaryOption[]);
    } else {
      console.error('fetchMyDiaries error', error);
    }
    setLoadingDiaries(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (step === 'from_diary') fetchMyDiaries();
    }, [step, fetchMyDiaries])
  );

  async function handleCreateManual() {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('planner.err_title_required'));
      return;
    }
    const destArray = destinations
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);

    const newId = await createManual({
      title: title.trim(),
      description: description.trim() || undefined,
      destinations: destArray,
      start_date: startDate.trim() || undefined,
      end_date: endDate.trim() || undefined,
      visibility: 'private',
    });

    if (newId) {
      router.replace(`/planner/${newId}`);
    }
  }

  async function handleCreateFromDiary() {
    if (!selectedDiaryId) {
      Alert.alert(t('common.error'), t('planner.err_select_diary'));
      return;
    }
    const newId = await createFromDiary(selectedDiaryId);
    if (newId) {
      router.replace(`/planner/${newId}`);
    }
  }

  // ─── Step: Choose method ───────────────────────────────────────────────────
  if (step === 'choose') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('planner.new_plan')}</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.chooseContent}>
          <Text style={styles.chooseSubtitle}>{t('planner.choose_method')}</Text>

          <TouchableOpacity style={styles.methodCard} onPress={() => setStep('manual')}>
            <View style={styles.methodIcon}>
              <Ionicons name="create-outline" size={32} color="#007AFF" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>{t('planner.create_manual')}</Text>
              <Text style={styles.methodDesc}>{t('planner.create_manual_desc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => {
              setStep('from_diary');
              fetchMyDiaries();
            }}
          >
            <View style={styles.methodIcon}>
              <Ionicons name="book-outline" size={32} color="#34C759" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>{t('planner.create_from_diary')}</Text>
              <Text style={styles.methodDesc}>{t('planner.create_from_diary_desc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Step: Manual form ────────────────────────────────────────────────────
  if (step === 'manual') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setStep('choose')}>
            <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('planner.create_manual')}</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>{t('planner.title_label')} *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('planner.title_placeholder')}
            placeholderTextColor="#bbb"
          />

          <Text style={styles.fieldLabel}>{t('planner.destinations_label')}</Text>
          <TextInput
            style={styles.input}
            value={destinations}
            onChangeText={setDestinations}
            placeholder={t('planner.destinations_placeholder')}
            placeholderTextColor="#bbb"
          />

          <Text style={styles.fieldLabel}>{t('planner.description_label')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('planner.description_placeholder')}
            placeholderTextColor="#bbb"
            multiline
          />

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>{t('planner.start_date_label')}</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#bbb"
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>{t('planner.end_date_label')}</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#bbb"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!title.trim() || creating) && styles.submitBtnDisabled]}
            onPress={handleCreateManual}
            disabled={!title.trim() || creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>{t('planner.create_btn')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── Step: From diary ─────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setStep('choose')}>
          <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('planner.create_from_diary')}</Text>
        <View style={styles.iconBtn} />
      </View>

      <Text style={styles.selectHint}>{t('planner.select_diary_hint')}</Text>

      {loadingDiaries ? (
        <View style={styles.center}>
          <ActivityIndicator color="#007AFF" />
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>{t('planner.no_diaries_to_import')}</Text>
        </View>
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.diaryListContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.diaryOption, selectedDiaryId === item.id && styles.diaryOptionSelected]}
              onPress={() => setSelectedDiaryId(item.id)}
            >
              <View style={styles.diaryOptionInfo}>
                <Text style={styles.diaryOptionTitle} numberOfLines={1}>{item.title}</Text>
                {item.destinations && item.destinations.length > 0 && (
                  <Text style={styles.diaryOptionDest} numberOfLines={1}>
                    📍 {item.destinations.slice(0, 2).join(', ')}
                  </Text>
                )}
              </View>
              <View style={[styles.radioOuter, selectedDiaryId === item.id && styles.radioOuterSelected]}>
                {selectedDiaryId === item.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.submitBtn, (!selectedDiaryId || creating) && styles.submitBtnDisabled]}
          onPress={handleCreateFromDiary}
          disabled={!selectedDiaryId || creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{t('planner.import_diary')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  iconBtn: {
    width: 40,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  // Choose step
  chooseContent: {
    flex: 1,
    padding: 24,
  },
  chooseSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  methodIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  // Manual form
  formContent: {
    padding: 24,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 0,
  },
  dateField: {
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  // From diary
  selectHint: {
    fontSize: 15,
    color: '#666',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 12,
  },
  diaryListContent: {
    padding: 16,
    paddingBottom: 120,
  },
  diaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  diaryOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f2ff',
  },
  diaryOptionInfo: {
    flex: 1,
  },
  diaryOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  diaryOptionDest: {
    fontSize: 13,
    color: '#666',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioOuterSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
