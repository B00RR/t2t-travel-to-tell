import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

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
      console.error(error);
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
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('create.destinations_label')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('create.destinations_placeholder')}
          placeholderTextColor="#999"
          value={destinations}
          onChangeText={setDestinations}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('create.description_label')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('create.description_placeholder')}
          placeholderTextColor="#999"
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
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60, // Spazio per non sovrapporsi con la safe area in-app top
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    minHeight: 120,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
