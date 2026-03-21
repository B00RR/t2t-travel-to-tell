import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, Image,
  FlatList, TextInput, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useStockImages } from '@/hooks/useStockImages';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_SIZE = (SCREEN_WIDTH - 48 - 16) / 3;

interface CoverImagePickerProps {
  visible: boolean;
  itemId: string;
  table?: 'diaries' | 'trip_plans';
  userId: string | undefined;
  destinations: string[];
  onCoverSet: (url: string) => void;
  onClose: () => void;
}

export function CoverImagePicker({
  visible, itemId, table = 'diaries', userId, destinations, onCoverSet, onClose,
}: CoverImagePickerProps) {
  const { t } = useTranslation();
  const { images, loading: stockLoading, searchImages, apiKeyMissing } = useStockImages();
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-search by first destination when modal opens
  useEffect(() => {
    if (visible && destinations.length > 0) {
      const query = destinations[0];
      setSearchQuery(query);
      searchImages(query);
    }
  }, [visible, destinations, searchImages]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchImages(searchQuery.trim());
    }
  };

  const handleSelectStock = async (url: string) => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from(table)
        .update({ cover_image_url: url })
        .eq('id', itemId);

      if (error) throw error;
      onCoverSet(url);
      onClose();
    } catch (e) {
      Alert.alert(t('common.error'), t('cover.err_set_failed'));
    } finally {
      setUploading(false);
    }
  };

  const handlePickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.error'), t('cover.permission_denied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const asset = result.assets[0];

      // Compress and resize
      const manipResult = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Upload to Supabase storage
      const timestamp = Date.now();
      const path = `${userId}/covers/${itemId}/${timestamp}.jpg`;

      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('diary-media')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      // Get a long-lived signed URL
      const { data: urlData } = await supabase.storage
        .from('diary-media')
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      if (!urlData?.signedUrl) throw new Error('Failed to get signed URL');

      const { error: updateError } = await supabase
        .from(table)
        .update({ cover_image_url: urlData.signedUrl })
        .eq('id', itemId);

      if (updateError) throw updateError;

      onCoverSet(urlData.signedUrl);
      onClose();
    } catch (e) {
      console.error('Cover upload failed:', e);
      Alert.alert(t('common.error'), t('cover.err_upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const renderStockImage = ({ item }: { item: { id: number; url: string; thumbnailUrl: string; photographer: string } }) => (
    <TouchableOpacity
      style={styles.thumbContainer}
      onPress={() => handleSelectStock(item.url)}
      disabled={uploading}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('cover.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Upload from gallery */}
        <TouchableOpacity
          style={styles.galleryBtn}
          onPress={handlePickFromGallery}
          disabled={uploading}
        >
          <Ionicons name="images-outline" size={22} color="#007AFF" />
          <Text style={styles.galleryBtnText}>{t('cover.from_gallery')}</Text>
        </TouchableOpacity>

        {/* Stock images search */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>{t('cover.stock_images')}</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('cover.search_placeholder')}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.uploadingText}>{t('cover.uploading')}</Text>
          </View>
        )}

        {stockLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : apiKeyMissing ? (
          <View style={styles.center}>
            <Ionicons name="images-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>{t('cover.api_key_missing')}</Text>
          </View>
        ) : images.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="images-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>{t('cover.no_stock_results')}</Text>
          </View>
        ) : (
          <FlatList
            data={images}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderStockImage}
            numColumns={3}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeBtn: {
    padding: 4,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    gap: 8,
  },
  galleryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  grid: {
    padding: 20,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  thumbContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 0.67,
    borderRadius: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  uploadingOverlay: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  uploadingText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
  },
});
