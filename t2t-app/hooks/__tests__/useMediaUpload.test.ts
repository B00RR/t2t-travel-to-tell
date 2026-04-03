import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useMediaUpload } from '../useMediaUpload';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' }
}));

jest.mock('expo-video-thumbnails', () => ({
  getThumbnailAsync: jest.fn(),
}));

describe('useMediaUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob()),
    });
    global.Response = jest.fn().mockImplementation(() => ({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    })) as any;
  });

  it('handles successful image pick and compression', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://original.jpg', width: 4000, height: 3000, type: 'image' }],
    });
    
    // Mock manipulate to return compressed dimensions
    (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
      uri: 'file://compressed.jpg',
      width: 1920,
      height: 1440,
    });

    const mockUpload = jest.fn().mockResolvedValue({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });
    
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const mockOnUploadComplete = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMediaUpload({
      userId: 'user-1',
      diaryId: 'diary-1',
      dayId: 'day-1',
      getNextSortOrder: () => 1,
      onUploadComplete: mockOnUploadComplete,
    }));

    await act(async () => {
      await result.current.pickAndUploadMedia();
    });

    expect(ImageManipulator.manipulateAsync).toHaveBeenCalled();
    expect(mockUpload).toHaveBeenCalledTimes(1); 
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      type: 'photo',
      content: null,
      day_id: 'day-1',
      sort_order: 1,
      metadata: expect.objectContaining({
        width: 1920,
        height: 1440,
        storagePath: expect.stringContaining('.jpg')
      })
    }));
    expect(mockOnUploadComplete).toHaveBeenCalled();
  });

  it('falls back to .mp4 for video assets with invalid extensions', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://video.php', width: 1080, height: 1920, type: 'video', duration: 15 }],
    });

    // Mock thumbnail extraction
    (VideoThumbnails.getThumbnailAsync as jest.Mock).mockResolvedValue({
      uri: 'file://thumb.jpg',
    });

    const mockUpload = jest.fn().mockResolvedValue({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const mockOnUploadComplete = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMediaUpload({
      userId: 'user-1',
      diaryId: 'diary-1',
      dayId: 'day-1',
      getNextSortOrder: () => 1,
      onUploadComplete: mockOnUploadComplete,
    }));

    await act(async () => {
      await result.current.pickAndUploadMedia();
    });

    expect(VideoThumbnails.getThumbnailAsync).toHaveBeenCalled();
    expect(mockUpload).toHaveBeenCalledTimes(2);

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      type: 'video',
      content: null,
      metadata: expect.objectContaining({
        duration: 15,
        storagePath: expect.stringContaining('.mp4'), // Ensures it fell back to .mp4 despite the .php extension
        thumbnailStoragePath: expect.stringContaining('_thumb.jpg')
      })
    }));
  });

  it('handles successful video pick, thumbnail extraction, and dual upload', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://video.mp4', width: 1080, height: 1920, type: 'video', duration: 15 }],
    });
    
    // Mock thumbnail extraction
    (VideoThumbnails.getThumbnailAsync as jest.Mock).mockResolvedValue({
      uri: 'file://thumb.jpg',
    });

    const mockUpload = jest.fn().mockResolvedValue({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });
    
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const mockOnUploadComplete = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMediaUpload({
      userId: 'user-1',
      diaryId: 'diary-1',
      dayId: 'day-1',
      getNextSortOrder: () => 1,
      onUploadComplete: mockOnUploadComplete,
    }));

    await act(async () => {
      await result.current.pickAndUploadMedia();
    });

    expect(VideoThumbnails.getThumbnailAsync).toHaveBeenCalled();
    // Twice: once for video, once for thumbnail
    expect(mockUpload).toHaveBeenCalledTimes(2); 
    
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      type: 'video',
      content: null,
      metadata: expect.objectContaining({
        duration: 15,
        storagePath: expect.stringContaining('.mp4'),
        thumbnailStoragePath: expect.stringContaining('_thumb.jpg')
      })
    }));
  });

  it('continues upload when thumbnail generation fails', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://video.mp4', width: 1080, height: 1920, type: 'video', duration: 15 }],
    });

    // Mock thumbnail extraction to fail
    (VideoThumbnails.getThumbnailAsync as jest.Mock).mockRejectedValue(new Error('Thumbnail generation failed'));

    const mockUpload = jest.fn().mockResolvedValue({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload: mockUpload });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const mockOnUploadComplete = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMediaUpload({
      userId: 'user-1',
      diaryId: 'diary-1',
      dayId: 'day-1',
      getNextSortOrder: () => 1,
      onUploadComplete: mockOnUploadComplete,
    }));

    await act(async () => {
      await result.current.pickAndUploadMedia();
    });

    expect(VideoThumbnails.getThumbnailAsync).toHaveBeenCalled();

    // Warning should have been logged
    expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to generate thumbnail', expect.any(Error));

    // Only once for the video, since thumbnail failed
    expect(mockUpload).toHaveBeenCalledTimes(1);

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      type: 'video',
      content: null,
      metadata: expect.objectContaining({
        duration: 15,
        storagePath: expect.stringContaining('.mp4'),
        thumbnailStoragePath: '' // Thumbnail path should be empty
      })
    }));

    consoleWarnSpy.mockRestore();
  });

  it('handles upload errors and shows an alert', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(Alert, 'alert');

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://original.jpg', width: 4000, height: 3000, type: 'image' }],
    });

    // Mock manipulate to reject with an error
    (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValue(new Error('Manipulation failed'));

    const mockOnUploadComplete = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMediaUpload({
      userId: 'user-1',
      diaryId: 'diary-1',
      dayId: 'day-1',
      getNextSortOrder: () => 1,
      onUploadComplete: mockOnUploadComplete,
    }));

    await act(async () => {
      await result.current.pickAndUploadMedia();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Upload error:', 'Manipulation failed');
    expect(alertSpy).toHaveBeenCalledWith('common.upload_error', 'media.upload_failed');

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
