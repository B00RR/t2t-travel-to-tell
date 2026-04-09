import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Typography } from '@/constants/theme';
import i18n from '@/i18n';

const LANGUAGES = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
] as const;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const { updateProfile } = useUserProfile(user?.id);

  async function handleLanguageChange(lang: string) {
    i18n.changeLanguage(lang);
    await updateProfile({ preferred_language: lang });
  }

  function handleLogout() {
    Alert.alert(
      t('common.logout'),
      t('common.logout_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.logout'), style: 'destructive', onPress: () => supabase.auth.signOut() },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bgSurface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('settings.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Lingua */}
      <View style={[styles.section, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('settings.language')}</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{t('settings.language_subtitle')}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map(lang => {
            const isActive = i18n.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langBtn, { backgroundColor: theme.bgElevated, borderColor: isActive ? theme.teal : 'transparent' }]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, { color: isActive ? theme.teal : theme.textPrimary }]}>
                  {lang.label}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={18} color={theme.teal} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Account */}
      <View style={[styles.section, { backgroundColor: theme.bgSurface, borderTopColor: theme.border, borderBottomColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('settings.account')}</Text>
        <TouchableOpacity style={[styles.row, { borderTopColor: theme.border }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={theme.red} />
          <Text style={[styles.rowTextDanger, { color: theme.red }]}>{t('settings.logout')}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      {/* Versione */}
      <View style={styles.versionRow}>
        <Text style={[styles.versionText, { color: theme.textMuted }]}>T2T — Travel to Tell  •  v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...Typography.caption,
    marginBottom: 14,
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  langFlag: {
    fontSize: 20,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  rowTextDanger: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionRow: {
    alignItems: 'center',
    marginTop: 40,
  },
  versionText: {
    fontSize: 13,
  },
});
