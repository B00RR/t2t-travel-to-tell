import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemePreference, ThemePreference } from '@/hooks/useThemePreference';
import { Radius, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '@/i18n';
import { useToast } from '@/components/Toast';

const LANGUAGES = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
] as const;

const THEMES: { code: ThemePreference; icon: keyof typeof Ionicons.glyphMap; key: string }[] = [
  { code: 'system', icon: 'phone-portrait-outline', key: 'settings.theme_system' },
  { code: 'light', icon: 'sunny-outline', key: 'settings.theme_light' },
  { code: 'dark', icon: 'moon-outline', key: 'settings.theme_dark' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { updateProfile } = useUserProfile(user?.id);
  const { preference: themePref, setPreference: setThemePref } = useThemePreference();
  const toast = useToast();

  async function handleLanguageChange(lang: string) {
    i18n.changeLanguage(lang);
    await updateProfile({ preferred_language: lang });
  }

  async function handleThemeChange(pref: ThemePreference) {
    await setThemePref(pref);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.show({ message: t('common.logout'), type: 'success' });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bgSurface, borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('settings.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Lingua */}
        <View style={[styles.section, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('settings.language')}</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{t('settings.language_subtitle')}</Text>
          <View style={styles.segmentRow}>
            {LANGUAGES.map(lang => {
              const isActive = i18n.language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.segmentBtn, { backgroundColor: theme.bgElevated, borderColor: isActive ? theme.teal : 'transparent' }]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.segmentFlag}>{lang.flag}</Text>
                  <Text style={[styles.segmentLabel, { color: isActive ? theme.teal : theme.textPrimary }]}>
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

        {/* Aspetto */}
        <View style={[styles.section, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('settings.appearance')}</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{t('settings.appearance_subtitle')}</Text>
          <View style={styles.segmentRow}>
            {THEMES.map(opt => {
              const isActive = themePref === opt.code;
              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[styles.segmentBtn, { backgroundColor: theme.bgElevated, borderColor: isActive ? theme.teal : 'transparent' }]}
                  onPress={() => handleThemeChange(opt.code)}
                  accessibilityRole="button"
                  accessibilityLabel={t(opt.key)}
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons name={opt.icon} size={18} color={isActive ? theme.teal : theme.textPrimary} />
                  <Text style={[styles.segmentLabel, { color: isActive ? theme.teal : theme.textPrimary }]}>
                    {t(opt.key)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: theme.bgSurface, borderTopColor: theme.border, borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('settings.account')}</Text>

          <TouchableOpacity
            style={[styles.row, { borderTopColor: theme.border }]}
            onPress={() => router.push('/(app)/settings/password' as never)}
            accessibilityRole="button"
          >
            <Ionicons name="key-outline" size={22} color={theme.textPrimary} />
            <Text style={[styles.rowText, { color: theme.textPrimary }]}>{t('settings.change_password')}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderTopColor: theme.border }]}
            onPress={handleLogout}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={22} color={theme.red} />
            <Text style={[styles.rowTextDanger, { color: theme.red }]}>{t('settings.logout')}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderTopColor: theme.border }]}
            onPress={() => router.push('/(app)/settings/delete-account' as never)}
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={22} color={theme.red} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTextDanger, { color: theme.red }]}>{t('settings.delete_account')}</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>{t('settings.delete_account_subtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Versione */}
        <View style={styles.versionRow}>
          <Text style={[styles.versionText, { color: theme.textMuted }]}>T2T — Travel to Tell  •  v1.0.0</Text>
        </View>
      </ScrollView>
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
  segmentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentBtn: {
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
  segmentFlag: {
    fontSize: 20,
  },
  segmentLabel: {
    fontSize: 14,
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
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowTextDanger: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  versionRow: {
    alignItems: 'center',
    marginTop: 40,
  },
  versionText: {
    fontSize: 13,
  },
});
