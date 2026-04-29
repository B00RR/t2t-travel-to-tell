import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, Image,
  FlatList, TextInput, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useStockImages } from '@/hooks/useStockImages';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';
import { useToast } from '@/components/Toast';

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
  const theme = useAppTheme();
  const toast = useToast();
  const { images, loading: stockLoading, searchImages, apiKeyMissing } = useStockImages();
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch {
      toast.show({ message: t('cover.err_set_failed'), type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handlePickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.show({ message: t('cover.permission_denied'), type: 'error' });
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

      const manipResult = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const timestamp = Date.now();
      const path = `${userId}/covers/${itemId}/${timestamp}.jpg`;

      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('diary-media')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

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
      toast.show({ message: t('cover.err_upload_failed'), type: 'error' });
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
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('cover.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.galleryBtn, { borderColor: theme.teal }]}
          onPress={handlePickFromGallery}
          disabled={uploading}
        >
          <Ionicons name="images-outline" size={22} color={theme.teal} />
          <Text style={[styles.galleryBtnText, { color: theme.teal }]}>{t('cover.from_gallery')}</Text>
        </TouchableOpacity>

        <View style={styles.searchSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('cover.stock_images')}</Text>
          <View style={[styles.searchBar, { backgroundColor: theme.bgElevated }]}>
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder={t('cover.search_placeholder')}
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color={theme.teal} />
            <Text style={[styles.uploadingText, { color: theme.teal }]}>{t('cover.uploading')}</Text>
          </View>
        )}

        {stockLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.teal} />
          </View>
        ) : apiKeyMissing ? (
          <View style={styles.center}>
            <Ionicons name="images-outline" size={48} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('cover.api_key_missing')}</Text>
          </View>
        ) : images.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="images-outline" size={48} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('cover.no_stock_results')}</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
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
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  galleryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xs,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  grid: {
    padding: 20,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  thumbContainer: {
    borderRadius: Radius.xs,
    overflow: 'hidden',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 0.67,
    borderRadius: Radius.xs,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  uploadingOverlay: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  uploadingText: {
    fontSize: 14,
    marginTop: 8,
  },
});
