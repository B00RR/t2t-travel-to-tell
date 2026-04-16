import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Typography } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);

    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.err_invalid_email'));
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.err_invalid_email'));
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Login error:', error);
      if (error.message.includes('Invalid login credentials')) {
        Alert.alert(t('common.error'), t('auth.err_invalid_credentials'));
      } else {
        Alert.alert(t('common.error'), t('auth.err_login_failed'));
      }
    } else {
      router.replace('/(app)' as any);
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 't2tapp://login',
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        Alert.alert(t('common.error'), t('auth.err_google_failed'));
        setGoogleLoading(false);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          't2tapp://login'
        );

        if (result.type === 'cancel') {
          setGoogleLoading(false);
          return;
        }

        if (result.type === 'success') {
          try {
            const parsedUrl = new URL(result.url);
            const code = parsedUrl.searchParams.get('code');
            if (code) {
              const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (!exchangeError) {
                router.replace('/(app)' as any);
                return;
              }
            }
            // Fallback: session may already be set (implicit flow)
            const { data: fallbackData } = await supabase.auth.getSession();
            if (fallbackData.session) {
              router.replace('/(app)' as any);
            } else {
              Alert.alert(t('common.error'), t('auth.err_google_failed'));
            }
          } catch {
            Alert.alert(t('common.error'), t('auth.err_google_failed'));
          }
        } else {
          Alert.alert(t('common.error'), t('auth.err_google_failed'));
        }
      }
    } catch (e) {
      console.error('Google sign in exception:', e);
      Alert.alert(t('common.error'), t('auth.err_google_failed'));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
          {/* Brand */}
          <View style={styles.brandSection}>
            <View style={[styles.logoMark, { backgroundColor: theme.teal }]}>
              <Ionicons name="earth" size={28} color="#fff" />
            </View>
            <Text style={[styles.logoText, { color: theme.textPrimary }]}>Travel to Tell</Text>
            <Text style={[styles.tagline, { color: theme.textMuted }]}>
              Share your journeys with the world
            </Text>
          </View>

          {/* Heading */}
          <View style={styles.headingSection}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('common.login')}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('auth.login_welcome')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>{t('auth.email')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('auth.email_placeholder')}
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>{t('auth.password')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('auth.password_placeholder')}
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.teal }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('common.login')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>{t('auth.continue_with')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={theme.textPrimary} />
              ) : (
                <>
                  <View style={styles.googleIconWrap}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={[styles.googleButtonText, { color: theme.textPrimary }]}>{t('auth.google')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerRow}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.75}
            >
              <Text style={[styles.footerText, { color: theme.teal }]}>{t('auth.no_account')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    ...Typography.h1,
    marginBottom: 4,
  },
  tagline: {
    ...Typography.caption,
    letterSpacing: 0.5,
  },
  headingSection: {
    marginBottom: 32,
  },
  title: {
    ...Typography.display,
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.body,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    ...Typography.label,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  button: {
    borderRadius: Radius.sm,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: Radius.sm,
    height: 52,
    borderWidth: 1,
  },
  googleIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285f4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
