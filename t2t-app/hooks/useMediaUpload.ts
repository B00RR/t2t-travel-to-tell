import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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

  const processAndUploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    const isVideo = asset.type === 'video';
    const timestamp = Date.now();

    let finalUri = asset.uri;
    let finalWidth = asset.width;
    let finalHeight = asset.height;

    // 1. Process Image or Video
    if (!isVideo) {
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

    // 2. Validate MIME type + file extension
    const REAL_EXT_MAP: Record<string, string> = {
      'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/x-msvideo': 'avi',
      'video/x-matroska': 'mkv', 'video/webm': 'webm', 'video/x-m4v': 'm4v',
    };

    const assetMime = asset.mimeType;
    const hasRealMime = assetMime && assetMime.includes('/');
    if (isVideo && hasRealMime) {
      const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/x-m4v'];
      if (!ALLOWED_VIDEO_MIMES.includes(assetMime)) {
        if (__DEV__) console.warn('Skipping unsupported video MIME:', assetMime);
        return;
      }
    }

    const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
    let fileExt = 'jpg';
    if (isVideo) {
      if (hasRealMime && REAL_EXT_MAP[assetMime!]) {
        fileExt = REAL_EXT_MAP[assetMime!];
      } else {
        const extractedExt = asset.uri.split('.').pop()?.toLowerCase() || 'mp4';
        fileExt = ALLOWED_VIDEO_EXTENSIONS.includes(extractedExt) ? extractedExt : 'mp4';
      }
    }

    const mainStoragePath = `${userId}/${dId}/${daId}/${timestamp}.${fileExt}`;
    const videoExt = fileExt === 'm4v' ? 'mp4' : fileExt;
    const contentType = isVideo ? `video/${videoExt}` : 'image/jpeg';

    let thumbnailUri = '';
    let thumbnailStoragePath = '';

    // 3. Process Thumbnail if Video
    if (isVideo) {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
        thumbnailUri = uri;
        thumbnailStoragePath = `${userId}/${dId}/${daId}/${timestamp}_thumb.jpg`;
      } catch (e) {
        if (__DEV__) console.warn('Failed to generate thumbnail', e);
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
          if (error) {
            if (__DEV__) console.warn('Failed to upload thumbnail, continuing without it', error);
          }
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
      content: null,
      metadata,
      sort_order: getNextSortOrder(),
      author_id: userId,
    });

    if (entryError) {
      throw new Error(entryError.message);
    }

    // Auto-set cover image if diary doesn't have one yet
    if (!isVideo) {
      try {
        const { data: diaryData } = await supabase
          .from('diaries')
          .select('cover_image_url')
          .eq('id', dId)
          .single();

        if (diaryData && !diaryData.cover_image_url) {
          const { data: urlData } = await supabase.storage
            .from('diary-media')
            .createSignedUrl(mainStoragePath, 60 * 60 * 24 * 365);

          if (urlData?.signedUrl) {
            await supabase
              .from('diaries')
              .update({ cover_image_url: urlData.signedUrl })
              .eq('id', dId);
          }
        }
      } catch (e) {
        if (__DEV__) console.warn('Failed to auto-set cover image:', e);
      }
    }
  };

  const pickAndUploadMedia = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.error'), t('media.permission_denied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);

    let succeeded = 0;
    let failed = 0;

    for (const asset of result.assets) {
      try {
        await processAndUploadAsset(asset);
        succeeded++;
      } catch (e: unknown) {
        failed++;
        const message = e instanceof Error ? e.message : String(e);
        if (__DEV__) console.error('Upload error for asset:', message);
      }
    }

    if (succeeded > 0) {
      await onUploadComplete();
    }

    if (failed > 0) {
      Alert.alert(t('common.upload_error'), t('media.upload_failed'));
    }

    setUploading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, diaryId, dayId, getNextSortOrder, onUploadComplete, t, dId, daId]);

  return { uploading, pickAndUploadMedia };
}
