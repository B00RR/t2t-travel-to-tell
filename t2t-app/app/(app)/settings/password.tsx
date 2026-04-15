import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Spacing, Typography } from '@/constants/theme';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Password change screen — requires re-auth with the current password
 * before calling supabase.auth.updateUser({ password }).
 */
export default function PasswordChangeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (next !== confirm) {
      Alert.alert(t('common.error'), t('password_change.err_mismatch'));
      return;
    }
    if (next.length < MIN_PASSWORD_LENGTH) {
      Alert.alert(t('common.error'), t('password_change.err_short'));
      return;
    }
    if (next === current) {
      Alert.alert(t('common.error'), t('password_change.err_same'));
      return;
    }
    if (!user?.email) {
      Alert.alert(t('common.error'), t('password_change.err_generic'));
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Re-authenticate with current password to confirm identity before
    // allowing the update. This prevents a stolen session from changing
    // the password without knowing the current one.
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (authError) {
      setSaving(false);
      Alert.alert(t('common.error'), t('password_change.err_wrong_current'));
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: next,
    });

    setSaving(false);

    if (updateError) {
      console.error('Password update failed:', updateError);
      Alert.alert(t('common.error'), t('password_change.err_generic'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      t('password_change.success_title'),
      t('password_change.success_msg'),
      [{ text: t('common.ok'), onPress: () => router.back() }],
    );
  }, [current, next, confirm, user?.email, t, router]);

  const canSubmit = current.length > 0 && next.length >= MIN_PASSWORD_LENGTH && confirm.length > 0 && !saving;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('password_change.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label={t('password_change.current')}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry={!showCurrent}
          onToggleVisible={() => setShowCurrent(v => !v)}
          visible={showCurrent}
          theme={theme}
          autoFocus
        />
        <Field
          label={t('password_change.new')}
          value={next}
          onChangeText={setNext}
          secureTextEntry={!showNext}
          onToggleVisible={() => setShowNext(v => !v)}
          visible={showNext}
          theme={theme}
        />
        <Field
          label={t('password_change.confirm')}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showConfirm}
          onToggleVisible={() => setShowConfirm(v => !v)}
          visible={showConfirm}
          theme={theme}
        />

        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: theme.teal },
            !canSubmit && styles.btnDisabled,
          ]}
          disabled={!canSubmit}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit, busy: saving }}
        >
          {saving ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.saveBtnText}>{t('password_change.saving')}</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>{t('password_change.save')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type Theme = ReturnType<typeof useAppTheme>;

function Field({
  label, value, onChangeText, secureTextEntry, onToggleVisible, visible, theme, autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry: boolean;
  onToggleVisible: () => void;
  visible: boolean;
  theme: Theme;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <TextInput
          style={[styles.input, { color: theme.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          placeholderTextColor={theme.textMuted}
          textContentType="password"
        />
        <TouchableOpacity
          onPress={onToggleVisible}
          style={styles.visToggle}
          accessibilityRole="button"
          accessibilityLabel={visible ? t('password_change.hide_password') : t('password_change.show_password')}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerTitle: { ...Typography.h3 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl },
  field: { marginBottom: Spacing.lg },
  fieldLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  visToggle: { paddingHorizontal: Spacing.md },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.4 },
});
