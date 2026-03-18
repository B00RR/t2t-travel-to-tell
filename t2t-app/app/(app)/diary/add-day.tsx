import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function AddDayScreen() {
  const { diary_id } = useLocalSearchParams();
  const router = useRouter();

  const [dateStr, setDateStr] = useState(''); // MVP: testo DD/MM/YYYY
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddDay() {
    if (!diary_id) return;

    setLoading(true);

    // 1. Find current highest day_number for this diary
    const { data: daysData, error: countError } = await supabase
      .from('diary_days')
      .select('day_number')
      .eq('diary_id', diary_id)
      .order('day_number', { ascending: false })
      .limit(1);

    if (countError) {
      Alert.alert('Errore', 'Impossibile calcolare il numero del giorno.');
      setLoading(false);
      return;
    }

    const nextDayNumber = daysData && daysData.length > 0 ? daysData[0].day_number + 1 : 1;
    
    // Parse DD/MM/YYYY to YYYY-MM-DD if provided (optional for MVP)
    let parsedDate = null;
    if (dateStr) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // quick MVP parse
      }
    }

    // 2. Insert new day
    const { data: insertData, error: insertError } = await supabase
      .from('diary_days')
      .insert({
        diary_id: diary_id,
        day_number: nextDayNumber,
        title: title || `Giorno ${nextDayNumber}`,
        date: parsedDate || null
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      Alert.alert('Errore', 'Impossibile aggiungere la giornata.');
    } else {
      router.back();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()} disabled={loading}>
          <Ionicons name="close" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuova Giornata</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Titolo della giornata (opzionale)</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. Arrivo a Ubud e Templi"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Data (GG/MM/AAAA)</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. 15/08/2026"
            placeholderTextColor="#999"
            value={dateStr}
            onChangeText={setDateStr}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleAddDay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Aggiungi al Diario</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  backIcon: {
    padding: 8,
  },
  content: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
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
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
