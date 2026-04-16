import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Platform,
  KeyboardAvoidingView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme, type AppTheme } from '@/hooks/useAppTheme';
import { useDiaryPermissions } from '@/hooks/useDiaryPermissions';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { Spacing, Radius, Typography, Shadows } from '@/constants/theme';
import type { Diary } from '@/types/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Visibility = 'private' | 'public' | 'friends';
type Status = 'draft' | 'published';

const VISIBILITIES: Visibility[] = ['private', 'public', 'friends'];
const STATUSES: Status[] = ['draft', 'published'];

/**
 * Edit existing diary — title, description, destinations, visibility, status, cover.
 * Only the owner can access this screen (enforced via useDiaryPermissions).
 */
export default function EditDiaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const permissions = useDiaryPermissions(id);

  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinations, setDestinations] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [status, setStatus] = useState<Status>('draft');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Load diary
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('diaries')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        Alert.alert(t('common.error'), t('diary.not_found'));
        router.back();
        return;
      }

      setDiary(data);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setDestinations((data.destinations || []).join(', '));
      setVisibility((data.visibility as Visibility) || 'private');
      setStatus((data.status as Status) || 'draft');
      setCoverImageUrl(data.cover_image_url);
      setLoading(false);
    })();
  }, [id, t, router]);

  // Owner-only guard (runs after diary load + permissions resolve)
  useEffect(() => {
    if (
      !loading &&
      !permissions.loading &&
      diary &&
      permissions.role &&
      permissions.role !== 'owner'
    ) {
      Alert.alert(t('common.error'), t('edit_diary.permission_denied'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    }
  }, [loading, permissions.loading, diary, permissions.role, t, router]);

  const handleSave = useCallback(async () => {
    if (!diary) return;
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('create.err_title_required'));
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const destArray = destinations
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    const { error } = await supabase
      .from('diaries')
      .update({
        title: title.trim(),
        description: description.trim(),
        destinations: destArray,
        visibility,
        status,
      })
      .eq('id', diary.id);

    setSaving(false);

    if (error) {
      console.error('Diary update failed:', error);
      Alert.alert(t('common.error'), t('edit_diary.err_save_failed'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('edit_diary.saved_title'), t('edit_diary.saved_msg'), [
      { text: t('common.ok'), onPress: () => router.back() },
    ]);
  }, [diary, title, description, destinations, visibility, status, t, router]);

  const handleCoverSet = useCallback((url: string) => {
    setCoverImageUrl(url);
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.teal} />
      </View>
    );
  }

  if (!diary) {
    return null;
  }

  const styles2 = createStyles(theme);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles2.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles2.headerBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles2.headerTitle, { color: theme.textPrimary }]}>
          {t('edit_diary.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cover preview */}
        <TouchableOpacity
          style={[
            styles2.coverCard,
            { backgroundColor: theme.bgSurface, borderColor: theme.border },
            Shadows.elevated,
          ]}
          onPress={() => setShowCoverPicker(true)}
          activeOpacity={0.85}
        >
          {coverImageUrl ? (
            <View style={styles2.coverWrap}>
              <Image source={{ uri: coverImageUrl }} style={styles2.coverImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)']}
                style={styles2.coverGradient}
              />
              <View style={styles2.coverEditBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
                <Text style={styles2.coverEditText}>{t('create.cover_change')}</Text>
              </View>
            </View>
          ) : (
            <View style={styles2.coverEmpty}>
              <View style={[styles2.coverIconCircle, { backgroundColor: theme.tealAlpha10 }]}>
                <Ionicons name="image-outline" size={34} color={theme.teal} />
              </View>
              <Text style={[styles2.coverHint, { color: theme.textMuted }]}>
                {t('create.cover_hint')}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <View style={styles2.formGroup}>
          <Text style={[styles2.label, { color: theme.textSecondary }]}>
            {t('create.title_label')}
          </Text>
          <TextInput
            style={[
              styles2.inputLarge,
              { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary },
            ]}
            placeholder={t('create.title_placeholder')}
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={140}
          />
        </View>

        {/* Destinations */}
        <View style={styles2.formGroup}>
          <Text style={[styles2.label, { color: theme.textSecondary }]}>
            {t('create.destinations_label')}
          </Text>
          <View
            style={[
              styles2.inputWithIcon,
              { backgroundColor: theme.bgSurface, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={theme.teal}
              style={styles2.inputPrefixIcon}
            />
            <TextInput
              style={[styles2.inputInner, { color: theme.textPrimary }]}
              placeholder={t('create.destinations_placeholder')}
              placeholderTextColor={theme.textMuted}
              value={destinations}
              onChangeText={setDestinations}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles2.formGroup}>
          <Text style={[styles2.label, { color: theme.textSecondary }]}>
            {t('create.description_label')}
          </Text>
          <TextInput
            style={[
              styles2.input,
              styles2.textArea,
              { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary },
            ]}
            placeholder={t('create.description_placeholder')}
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Status */}
        <View style={styles2.formGroup}>
          <Text style={[styles2.label, { color: theme.textSecondary }]}>
            {t('edit_diary.status_label')}
          </Text>
          <View style={styles2.segmentGroup}>
            {STATUSES.map(s => {
              const active = status === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles2.segmentOption,
                    {
                      backgroundColor: active ? theme.teal : theme.bgSurface,
                      borderColor: active ? theme.teal : theme.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStatus(s);
                  }}
                >
                  <Text
                    style={[
                      styles2.segmentLabel,
                      { color: active ? '#fff' : theme.textPrimary },
                    ]}
                  >
                    {t(`edit_diary.status_${s}`)}
                  </Text>
                  <Text
                    style={[
                      styles2.segmentDesc,
                      { color: active ? 'rgba(255,255,255,0.85)' : theme.textMuted },
                    ]}
                  >
                    {t(`edit_diary.status_${s}_desc`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Visibility */}
        <View style={styles2.formGroup}>
          <Text style={[styles2.label, { color: theme.textSecondary }]}>
            {t('edit_diary.visibility_label')}
          </Text>
          <View style={styles2.visibilityColumn}>
            {VISIBILITIES.map(v => {
              const active = visibility === v;
              const icon =
                v === 'public' ? 'globe-outline' : v === 'friends' ? 'people-outline' : 'lock-closed-outline';
              return (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles2.visibilityRow,
                    {
                      backgroundColor: theme.bgSurface,
                      borderColor: active ? theme.teal : theme.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVisibility(v);
                  }}
                >
                  <View
                    style={[
                      styles2.visibilityIcon,
                      { backgroundColor: active ? theme.teal : theme.tealAlpha10 },
                    ]}
                  >
                    <Ionicons name={icon} size={18} color={active ? '#fff' : theme.teal} />
                  </View>
                  <View style={styles2.visibilityText}>
                    <Text style={[styles2.visibilityLabel, { color: theme.textPrimary }]}>
                      {t(`edit_diary.visibility_${v}`)}
                    </Text>
                    <Text style={[styles2.visibilityDesc, { color: theme.textMuted }]}>
                      {t(`edit_diary.visibility_${v}_desc`)}
                    </Text>
                  </View>
                  {active && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={theme.teal}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={[styles2.footer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
        <TouchableOpacity
          style={[
            styles2.saveBtn,
            { backgroundColor: theme.teal },
            (saving || !title.trim()) && styles2.btnDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || !title.trim()}
        >
          {saving ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles2.saveBtnText}>{t('edit_diary.saving')}</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles2.saveBtnText}>{t('edit_diary.save')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <CoverImagePicker
        visible={showCoverPicker}
        itemId={diary.id}
        userId={user?.id}
        destinations={diary.destinations || []}
        onCoverSet={handleCoverSet}
        onClose={() => setShowCoverPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      ...Typography.h3,
    },

    coverCard: {
      marginTop: Spacing.lg,
      borderRadius: Radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      minHeight: 180,
    },
    coverWrap: {
      position: 'relative',
    },
    coverImage: {
      width: '100%',
      height: 200,
    },
    coverGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 90,
    },
    coverEditBadge: {
      position: 'absolute',
      bottom: Spacing.md,
      right: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.full,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    coverEditText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    coverEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: Spacing.md,
    },
    coverIconCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
    },
    coverHint: {
      ...Typography.bodySm,
      textAlign: 'center',
    },

    formGroup: {
      marginTop: Spacing.xl,
    },
    label: {
      ...Typography.label,
      textTransform: 'uppercase',
      marginBottom: Spacing.sm,
    },
    input: {
      borderRadius: Radius.md,
      padding: Spacing.md,
      fontSize: 16,
      borderWidth: 1,
      fontFamily: Typography.body.fontFamily,
    },
    inputLarge: {
      borderRadius: Radius.md,
      padding: Spacing.lg,
      fontSize: 18,
      borderWidth: 1,
      fontFamily: Typography.h3.fontFamily,
      fontWeight: '600',
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radius.md,
      borderWidth: 1,
    },
    inputPrefixIcon: { paddingLeft: Spacing.md },
    inputInner: {
      flex: 1,
      padding: Spacing.md,
      fontSize: 16,
      fontFamily: Typography.body.fontFamily,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },

    segmentGroup: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    segmentOption: {
      flex: 1,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: 2,
    },
    segmentLabel: {
      fontSize: 14,
      fontWeight: '700',
    },
    segmentDesc: {
      fontSize: 11,
      marginTop: 2,
    },

    visibilityColumn: {
      gap: Spacing.sm,
    },
    visibilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1.5,
    },
    visibilityIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
    },
    visibilityText: { flex: 1 },
    visibilityLabel: {
      fontSize: 15,
      fontWeight: '700',
    },
    visibilityDesc: {
      fontSize: 12,
      marginTop: 2,
    },

    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: Radius.md,
    },
    saveBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.4,
    },
  });
