import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type Diary = {
  id: string;
  title: string;
  description: string;
  destinations: string[];
  status: string;
  created_at: string;
};

type DiaryDay = {
  id: string;
  day_number: number;
  title: string | null;
  date: string | null;
};

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [days, setDays] = useState<DiaryDay[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchDiaryDetails();
        fetchDiaryDays();
      }
    }, [id])
  );

  async function fetchDiaryDetails() {
    setLoading(true);
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setDiary(data);
    }
  }

  async function fetchDiaryDays() {
    setLoading(true); // Se vogliamo mostrare il loader anche durante il reload dei giorni
    const { data, error } = await supabase
      .from('diary_days')
      .select('id, day_number, title, date')
      .eq('diary_id', id)
      .order('day_number', { ascending: true });

    if (!error && data) {
      setDays(data);
    }
    setLoading(false);
  }

  function handleOptions() {
    Alert.alert(
      'Opzioni Diario',
      'Cosa vuoi fare?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina Diario', style: 'destructive', onPress: confirmDelete },
      ]
    );
  }

  function confirmDelete() {
    Alert.alert(
      'Sei sicuro?',
      'Questa azione è irreversibile e cancellerà tutte le giornate e le foto associate.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina definitamente', style: 'destructive', onPress: deleteDiary },
      ]
    );
  }

  async function deleteDiary() {
    const { error } = await supabase
      .from('diaries')
      .delete()
      .eq('id', id);

    if (error) {
      Alert.alert('Errore', 'Impossibile eliminare il diario.');
    } else {
      router.replace('/');
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!diary) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Diario non trovato.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editIcon} onPress={handleOptions}>
          <Ionicons name="ellipsis-horizontal" size={28} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{diary.title}</Text>
        
        {diary.destinations && diary.destinations.length > 0 && (
          <View style={styles.pillContainer}>
            {diary.destinations.map((dest, idx) => (
              <View key={idx} style={styles.pill}>
                <Text style={styles.pillText}>📍 {dest}</Text>
              </View>
            ))}
          </View>
        )}

        {diary.description ? (
          <Text style={styles.description}>{diary.description}</Text>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.daysHeader}>
          <Text style={styles.sectionTitle}>Giornate</Text>
          <TouchableOpacity 
            style={styles.addDayButton}
            onPress={() => router.push({ pathname: '/diary/add-day', params: { diary_id: id } })}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addDayText}>Aggiungi</Text>
          </TouchableOpacity>
        </View>

        {days.length === 0 ? (
          <View style={styles.emptyDays}>
            <Text style={styles.emptyDaysText}>Ancora nessuna giornata in questo diario.</Text>
            <Text style={styles.emptyDaysSub}>Inizia ad aggiungere i ricordi del tuo viaggio!</Text>
          </View>
        ) : (
          <View style={styles.daysList}>
            {days.map((day) => (
              <TouchableOpacity key={day.id} style={styles.dayCard}>
                <View style={styles.dayIconBox}>
                  <Text style={styles.dayIconText}>{day.day_number}</Text>
                </View>
                <View style={styles.dayContent}>
                  <Text style={styles.dayTitle}>Giorno {day.day_number}{day.title ? `: ${day.title}` : ''}</Text>
                  {day.date && <Text style={styles.dayDate}>{day.date}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backIcon: {
    padding: 8,
  },
  editIcon: {
    padding: 8,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addDayText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyDays: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyDaysText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDaysSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  daysList: {
    marginTop: 8,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dayIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dayIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  dayContent: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 14,
    color: '#666',
  },
});
