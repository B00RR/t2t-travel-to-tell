import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from '@/lib/supabase';
import type { VideoMetadata, PhotoMetadata } from '@/types/dayEntry';

interface UseMediaUploadOptions {
  userId: string | undefined;
  diaryId: string | string[];
  dayId: string | string[];
  getNextSortOrder: () => number;
  onUploadComplete: () => Promise<void>;
}

export function useMediaUpload({
  userId,
  diaryId,
  dayId,
  getNextSortOrder,
  onUploadComplete,
}: UseMediaUploadOptions) {
  const [uploading, setUploading] = useState(false);

  const dId = Array.isArray(diaryId) ? diaryId[0] : diaryId;
  const daId = Array.isArray(dayId) ? dayId[0] : dayId;

  const uploadFileToSupabase = async (uri: string, path: string, contentType: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from('diary-media')
      .upload(path, arrayBuffer, {
        contentType,
        upsert: false,
      });

    return { error };
  };

  const pickAndUploadMedia = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permesso negato', "Devi consentire l'accesso alla galleria.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'], 
      allowsEditing: false,
      quality: 1, 
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploading(true);

    try {
      const isVideo = asset.type === 'video';
      const timestamp = Date.now();
      
      let finalUri = asset.uri;
      let finalWidth = asset.width;
      let finalHeight = asset.height;
      
      // 1. Process Image or Video
      if (!isVideo) {
        // Compress and resize image
        const targetDimension = 1920;
        let resizeAction = {};
        if (asset.width > targetDimension || asset.height > targetDimension) {
          if (asset.width > asset.height) {
            resizeAction = { resize: { width: targetDimension } };
            finalWidth = targetDimension;
            finalHeight = Math.round((targetDimension / asset.width) * asset.height);
          } else {
            resizeAction = { resize: { height: targetDimension } };
            finalHeight = targetDimension;
            finalWidth = Math.round((targetDimension / asset.height) * asset.width);
          }
        }
        
        const actions = Object.keys(resizeAction).length ? [resizeAction as ImageManipulator.Action] : [];
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          actions,
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        finalUri = manipResult.uri;
        finalWidth = manipResult.width;
        finalHeight = manipResult.height;
      }

      // 2. Prepare Storage Paths
      const fileExt = isVideo ? (asset.uri.split('.').pop()?.toLowerCase() || 'mp4') : 'jpg';
      const mainStoragePath = `${userId}/${dId}/${daId}/${timestamp}.${fileExt}`;
      const contentType = isVideo ? `video/${fileExt}` : 'image/jpeg';

      let thumbnailUri = '';
      let thumbnailStoragePath = '';

      // 3. Process Thumbnail if Video (before main upload to allow concurrency)
      if (isVideo) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
          thumbnailUri = uri;
          thumbnailStoragePath = `${userId}/${dId}/${daId}/${timestamp}_thumb.jpg`;
        } catch (e) {
          console.warn("Failed to generate thumbnail, uploading without it", e);
        }
      }

      // 4. Upload Assets Concurrently
      const uploadPromises = [
        uploadFileToSupabase(finalUri, mainStoragePath, contentType).then(({ error }) => {
          if (error) throw new Error(error.message);
        })
      ];

      if (thumbnailUri) {
        uploadPromises.push(
          uploadFileToSupabase(thumbnailUri, thumbnailStoragePath, 'image/jpeg').then(({ error }) => {
            if (error) console.warn("Failed to upload thumbnail", error);
          })
        );
      }

      await Promise.all(uploadPromises);

      let metadata: PhotoMetadata | VideoMetadata;

      if (isVideo) {
        metadata = {
          width: finalWidth,
          height: finalHeight,
          duration: asset.duration,
          caption: '',
          storagePath: mainStoragePath,
          thumbnailStoragePath,
        } as VideoMetadata;

      } else {
        metadata = {
          width: finalWidth,
          height: finalHeight,
          caption: '',
          storagePath: mainStoragePath,
        } as PhotoMetadata;
      }

      // 5. Save to Database
      const { error: entryError } = await supabase.from('day_entries').insert({
        day_id: daId,
        type: isVideo ? 'video' : 'photo',
        content: null, // Resolved on-demand
        metadata,
        sort_order: getNextSortOrder(),
      });

      if (entryError) {
        throw new Error(entryError.message);
      } else {
        await onUploadComplete();
      }
    } catch (e: any) {
      Alert.alert('Errore Upload', e.message);
    }

    setUploading(false);
  }, [userId, dId, daId, getNextSortOrder, onUploadComplete]);

  return { uploading, pickAndUploadMedia };
}
