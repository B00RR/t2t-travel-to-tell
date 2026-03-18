import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons'; // Useremo questo più avanti per le immagini

export default function CreateDiaryScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinations, setDestinations] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreateDiary() {
    if (!title.trim()) {
      Alert.alert('Errore', 'Inserisci un titolo per il tuo diario.');
      return;
    }

    setLoading(true);
    
    // Convert comma-separated string to array
    const destArray = destinations.split(',').map(d => d.trim()).filter(d => d.length > 0);

    const { data, error } = await supabase
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
      Alert.alert('Errore', "Impossibile creare il diario. E' un problema che controlleremo.");
      console.error(error);
    } else {
      Alert.alert('Diario Creato!', 'Ora puoi iniziare a scriverlo.');
      // router.push(`/diary/${data.id}`); // This route doesn't exist yet, so we just go home for now
      setTitle('');
      setDescription('');
      setDestinations('');
      router.replace('/(app)');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Nuovo Diario di Viaggio</Text>
      <Text style={styles.subtitle}>Dove ti porta la tua prossima avventura?</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Titolo del Viaggio *</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. Estate a Bali 2026"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Destinazioni (separate da virgola)</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. Indonesia, Bali, Ubud"
          placeholderTextColor="#999"
          value={destinations}
          onChangeText={setDestinations}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Breve Descrizione</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Di cosa parla questo viaggio?"
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
          <Text style={styles.buttonText}>Crea Diario</Text>
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
