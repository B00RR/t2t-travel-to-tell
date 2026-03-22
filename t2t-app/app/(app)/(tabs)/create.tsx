import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Palette } from '@/constants/theme';

export default function CreateDiaryScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

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
    
    // Convert comma-separated string to array
    const destArray = destinations.split(',').map(d => d.trim()).filter(d => d.length > 0);

    const { error } = await supabase
      .from('diaries')
      .insert({
        author_id: user?.id,
        title: title.trim(),
        description: description.trim(),
        destinations: destArray,
        status: 'draft',
        visibility: 'private', // starts as private draft until published
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{t('create.title')}</Text>
      <Text style={styles.subtitle}>{t('create.subtitle')}</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('create.title_label')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('create.title_placeholder')}
          placeholderTextColor={Palette.textMuted}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('create.destinations_label')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('create.destinations_placeholder')}
          placeholderTextColor={Palette.textMuted}
          value={destinations}
          onChangeText={setDestinations}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('create.description_label')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('create.description_placeholder')}
          placeholderTextColor={Palette.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, (!title.trim() || loading) && styles.buttonDisabled]} 
        onPress={handleCreateDiary}
        disabled={!title.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('create.create_btn')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.bgPrimary,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Palette.textSecondary,
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Palette.bgSurface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Palette.textPrimary,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  textArea: {
    minHeight: 120,
  },
  button: {
    backgroundColor: Palette.teal,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Palette.bgElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: Palette.bgPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
