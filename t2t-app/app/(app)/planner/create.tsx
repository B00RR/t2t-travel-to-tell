import { useState, useCallback, useMemo } from 'react';
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
import { useAppTheme, type AppTheme } from '@/hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/components/Toast';

type Step = 'choose' | 'manual' | 'from_diary';

type DiaryOption = {
  id: string;
  title: string;
  destinations: string[];
  status: string;
};

export default function CreateTripPlanScreen() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { creating, createManual, createFromDiary } = useCreateTripPlan(user?.id);
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, insets.top), [theme, insets.top]);

  const [step, setStep] = useState<Step>('choose');
  const [title, setTitle] = useState('');
  const [destinations, setDestinations] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    if (!error && data) setDiaries(data as DiaryOption[]);
    setLoadingDiaries(false);
  }, [user]);

  useFocusEffect(useCallback(() => { if (step === 'from_diary') fetchMyDiaries(); }, [step, fetchMyDiaries]));

  async function handleCreateManual() {
    toast.show({ message: t('planner.err_title_required'), type: 'error' });
    const destArray = destinations.split(',').map(d => d.trim()).filter(Boolean);
    const newId = await createManual({ title: title.trim(), description: description.trim() || undefined, destinations: destArray, start_date: startDate.trim() || undefined, end_date: endDate.trim() || undefined, visibility: 'private' });
    if (newId) router.replace(`/planner/${newId}`);
  }

  async function handleCreateFromDiary() {
    toast.show({ message: t('planner.err_select_diary'), type: 'error' });
    const newId = await createFromDiary(selectedDiaryId);
    if (newId) router.replace(`/planner/${newId}`);
  }

  // ─── Step: Choose method ────────────────────────────────────────────────────
  if (step === 'choose') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('planner.new_plan')}</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.chooseContent}>
          <Text style={styles.chooseSubtitle}>{t('planner.choose_method')}</Text>
          <TouchableOpacity style={styles.methodCard} onPress={() => setStep('manual')}>
            <View style={styles.methodIconWrap}>
              <Ionicons name="create-outline" size={28} color={theme.teal} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>{t('planner.create_manual')}</Text>
              <Text style={styles.methodDesc}>{t('planner.create_manual_desc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.methodCard} onPress={() => { setStep('from_diary'); fetchMyDiaries(); }}>
            <View style={[styles.methodIconWrap, styles.methodIconWrapWarm]}>
              <Ionicons name="book-outline" size={28} color={theme.orange} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>{t('planner.create_from_diary')}</Text>
              <Text style={styles.methodDesc}>{t('planner.create_from_diary_desc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Step: Manual form ──────────────────────────────────────────────────────
  if (step === 'manual') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setStep('choose')}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('planner.create_manual')}</Text>
          <View style={styles.iconBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>{t('planner.title_label')} *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t('planner.title_placeholder')} placeholderTextColor={theme.textMuted} />
          <Text style={styles.fieldLabel}>{t('planner.destinations_label')}</Text>
          <TextInput style={styles.input} value={destinations} onChangeText={setDestinations} placeholder={t('planner.destinations_placeholder')} placeholderTextColor={theme.textMuted} />
          <Text style={styles.fieldLabel}>{t('planner.description_label')}</Text>
          <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder={t('planner.description_placeholder')} placeholderTextColor={theme.textMuted} multiline />
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>{t('planner.start_date_label')}</Text>
              <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>{t('planner.end_date_label')}</Text>
              <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} />
            </View>
          </View>
          <TouchableOpacity style={[styles.submitBtn, (!title.trim() || creating) && styles.submitBtnDisabled]} onPress={handleCreateManual} disabled={!title.trim() || creating}>
            {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('planner.create_btn')}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── Step: From diary ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setStep('choose')}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('planner.create_from_diary')}</Text>
        <View style={styles.iconBtn} />
      </View>
      <Text style={styles.selectHint}>{t('planner.select_diary_hint')}</Text>
      {loadingDiaries ? (
        <View style={styles.center}><ActivityIndicator color={theme.teal} /></View>
      ) : diaries.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={48} color={theme.border} />
          <Text style={styles.emptyText}>{t('planner.no_diaries_to_import')}</Text>
        </View>
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.diaryListContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.diaryOption, selectedDiaryId === item.id && styles.diaryOptionSelected]} onPress={() => setSelectedDiaryId(item.id)}>
              <View style={styles.diaryOptionInfo}>
                <Text style={styles.diaryOptionTitle} numberOfLines={1}>{item.title}</Text>
                {item.destinations && item.destinations.length > 0 && (
                  <Text style={styles.diaryOptionDest} numberOfLines={1}>📍 {item.destinations.slice(0, 2).join(', ')}</Text>
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
        <TouchableOpacity style={[styles.submitBtn, (!selectedDiaryId || creating) && styles.submitBtnDisabled]} onPress={handleCreateFromDiary} disabled={!selectedDiaryId || creating}>
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('planner.import_diary')}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(t: AppTheme, topInset: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: topInset, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    iconBtn: { width: 40, padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: t.textPrimary },
    chooseContent: { flex: 1, padding: 24 },
    chooseSubtitle: { fontSize: 15, color: t.textSecondary, marginBottom: 24 },
    methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bgSurface, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: t.border },
    methodIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: t.tealAlpha10, justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: t.tealAlpha25 },
    methodIconWrapWarm: { backgroundColor: t.orangeAlpha10, borderColor: t.orange + '40' },
    methodInfo: { flex: 1 },
    methodTitle: { fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 4 },
    methodDesc: { fontSize: 13, color: t.textMuted, lineHeight: 18 },
    formContent: { padding: 24, paddingBottom: 48 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: t.textMuted, marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { borderWidth: 1, borderColor: t.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: t.textPrimary, backgroundColor: t.bgSurface },
    textarea: { minHeight: 90, textAlignVertical: 'top' },
    dateRow: { flexDirection: 'row', gap: 12 },
    dateField: { flex: 1 },
    submitBtn: { backgroundColor: t.teal, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 32 },
    submitBtnDisabled: { opacity: 0.4 },
    submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    selectHint: { fontSize: 14, color: t.textSecondary, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
    emptyText: { fontSize: 15, color: t.textMuted, textAlign: 'center' },
    diaryListContent: { padding: 16, paddingBottom: 120 },
    diaryOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bgSurface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: t.border },
    diaryOptionSelected: { borderColor: t.teal, backgroundColor: t.tealAlpha10 },
    diaryOptionInfo: { flex: 1 },
    diaryOptionTitle: { fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 4 },
    diaryOptionDest: { fontSize: 13, color: t.textMuted },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: t.border, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
    radioOuterSelected: { borderColor: t.teal },
    radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: t.teal },
    footerBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: t.bg, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36, borderTopWidth: 1, borderTopColor: t.border },
  });
}