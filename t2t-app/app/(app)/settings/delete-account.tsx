import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Delete account screen — requires the user to type the confirmation
 * word (localized) before enabling the destructive button. The deletion
 * itself is performed by the `delete-account` Edge Function which runs
 * `auth.admin.deleteUser()` on behalf of the authenticated caller.
 */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirmWord = t('delete_account.confirm_word');
  const canSubmit = confirmInput.trim().toUpperCase() === confirmWord.toUpperCase() && !deleting;

  const handleDelete = useCallback(async () => {
    if (!canSubmit) return;

    setDeleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      });

      if (error || !data?.ok) {
        console.error('Account deletion failed:', error);
        setDeleting(false);
        Alert.alert(t('common.error'), t('delete_account.err_generic'));
        return;
      }

      // The session is now invalid server-side; force sign-out locally
      // so the auth listener routes us back to the login screen.
      // If signOut itself fails, the account is already deleted server-side
      // so we still sign out to clear the local session.
      try {
        await supabase.auth.signOut();
      } catch {
        // Account already deleted — local session cleanup is best-effort.
        // The auth listener will eventually detect the invalid session.
      }
    } catch (err) {
      console.error('delete-account error:', err);
      setDeleting(false);
      Alert.alert(t('common.error'), t('delete_account.err_generic'));
    }
  }, [canSubmit, t]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('delete_account.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.warningCard, { backgroundColor: theme.bgSurface, borderColor: theme.red }]}>
          <View style={[styles.warningIconCircle, { backgroundColor: theme.red }]}>
            <Ionicons name="warning" size={28} color="#fff" />
          </View>
          <Text style={[styles.warningTitle, { color: theme.red }]}>
            {t('delete_account.warning_title')}
          </Text>
          <Text style={[styles.warningBody, { color: theme.textPrimary }]}>
            {t('delete_account.warning_msg')}
          </Text>
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          {t('delete_account.confirm_label')}
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary },
          ]}
          value={confirmInput}
          onChangeText={setConfirmInput}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={confirmWord}
          placeholderTextColor={theme.textMuted}
        />

        <TouchableOpacity
          style={[
            styles.deleteBtn,
            { backgroundColor: theme.red },
            !canSubmit && styles.btnDisabled,
          ]}
          onPress={handleDelete}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit, busy: deleting }}
        >
          {deleting ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.deleteBtnText}>{t('delete_account.deleting')}</Text>
            </>
          ) : (
            <>
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.deleteBtnText}>{t('delete_account.confirm_btn')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  warningCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  warningIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  warningTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  warningBody: {
    ...Typography.body,
    textAlign: 'center',
  },
  fieldLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: Spacing.xl,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.md,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.4 },
});
