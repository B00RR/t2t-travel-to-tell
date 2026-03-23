import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography } from '@/constants/theme';

export default function CreateDiaryScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinations, setDestinations] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreateDiary() {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('create.err_title_required'));
      return;
    }

    setLoading(true);
    const destArray = destinations.split(',').map(d => d.trim()).filter(d => d.length > 0);

    const { error } = await supabase
      .from('diaries')
      .insert({
        author_id: user?.id,
        title: title.trim(),
        description: description.trim(),
        destinations: destArray,
        status: 'draft',
        visibility: 'private',
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      Alert.alert(t('common.error'), t('create.err_create_failed'));
    } else {
      Alert.alert(t('create.success_title'), t('create.success_msg'));
      setTitle('');
      setDescription('');
      setDestinations('');
      router.replace('/(app)/(tabs)');
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('create.title')}</Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('create.subtitle')}</Text>

      {/* Illustration area */}
      <View style={[styles.illustrationArea, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
        <Ionicons name="journal-outline" size={48} color={theme.teal} />
        <Text style={[styles.illustrationText, { color: theme.textMuted }]}>
          Start documenting your next adventure
        </Text>
      </View>

      {/* Form */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('create.title_label')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary }]}
          placeholder={t('create.title_placeholder')}
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('create.destinations_label')}</Text>
        <View style={[styles.inputWithIcon, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Ionicons name="location-outline" size={18} color={theme.teal} style={styles.inputPrefixIcon} />
          <TextInput
            style={[styles.inputInner, { color: theme.textPrimary }]}
            placeholder={t('create.destinations_placeholder')}
            placeholderTextColor={theme.textMuted}
            value={destinations}
            onChangeText={setDestinations}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('create.description_label')}</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary }]}
          placeholder={t('create.description_placeholder')}
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.teal },
          (!title.trim() || loading) && styles.buttonDisabled,
        ]}
        onPress={handleCreateDiary}
        disabled={!title.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t('create.create_btn')}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  illustrationText: {
    ...Typography.caption,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  inputPrefixIcon: {
    paddingLeft: Spacing.md,
  },
  inputInner: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    borderRadius: Radius.sm,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
