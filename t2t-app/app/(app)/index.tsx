import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Diary = {
  id: string;
  title: string;
  description: string;
  destinations: string[];
  status: string;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiaries();
  }, [user]);

  async function fetchDiaries() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('diaries')
      .select('id, title, description, destinations, status')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDiaries(data);
    }
    setLoading(false);
  }

  function renderDiaryItem({ item }: { item: Diary }) {
    return (
      <TouchableOpacity 
        style={styles.diaryCard}
        onPress={() => router.push(`/diary/${item.id}`)}
      >
        <View style={styles.diaryContent}>
          <Text style={styles.diaryTitle}>{item.title}</Text>
          {item.destinations && item.destinations.length > 0 && (
            <Text style={styles.diaryDestinations}>
              📍 {item.destinations.join(', ')}
            </Text>
          )}
          <Text style={styles.diaryStatus}>
            {item.status === 'draft' ? '📝 Bozza' : '🌍 Pubblicato'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Bentornato, {user?.user_metadata?.username || user?.email?.split('@')[0]}</Text>
          <Text style={styles.title}>I tuoi Diari</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="journal-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Non hai ancora iniziato nessun diario.</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => router.push('/(app)/create')}>
            <Text style={styles.createButtonText}>Crea il tuo primo Diario</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={(item) => item.id}
          renderItem={renderDiaryItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  logoutBtn: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  diaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  diaryContent: {
    flex: 1,
    marginRight: 16,
  },
  diaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  diaryDestinations: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  diaryStatus: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    backgroundColor: '#e6f2ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
