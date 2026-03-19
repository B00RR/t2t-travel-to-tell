import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, Image, RefreshControl
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { FeedDiary } from '@/types/supabase';

export default function DiscoveryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [diaries, setDiaries] = useState<FeedDiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDiscovery = useCallback(async (query = '') => {
    setLoading(true);
    
    let baseQuery = supabase
      .from('diaries')
      .select(`
        *,
        profiles!diaries_author_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (query.trim()) {
      // Simple text search on title, description or destinations
      baseQuery = baseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,destinations.cs.{${query}}`);
    }

    const { data, error } = await baseQuery.limit(50);

    if (!error && data) {
      setDiaries(data as FeedDiary[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchDiscovery();
  }, [fetchDiscovery]);

  const handleSearch = () => {
    fetchDiscovery(searchQuery);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDiscovery(searchQuery);
  };

  const renderItem = ({ item }: { item: FeedDiary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/diary/${item.id}`)}
    >
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.cardImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="map-outline" size={32} color="#ccc" />
        </View>
      )}
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardAuthor}>di {item.profiles?.display_name || item.profiles?.username || 'Anonimo'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Esplora</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca destinazioni o diari..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchDiscovery(''); }}>
              <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>Nessun risultato trovato per "{searchQuery}"</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardAuthor: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
