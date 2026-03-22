import { renderHook, act } from '@testing-library/react-native';
import { useUserProfile } from '../useUserProfile';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          not: jest.fn(() => ({
            count: 'exact',
            head: true,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://test.com/avatar.jpg' } })),
      })),
    },
  },
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('useUserProfile', () => {
  const mockProfileId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch profile data on mount', async () => {
    const mockData = { id: mockProfileId, username: 'testuser', display_name: 'Test User' };
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      })),
    });

    const { result } = renderHook(() => useUserProfile(mockProfileId));

    // Wait for the effect
    await act(async () => {});

    expect(result.current.profile).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  it('should handle fetch profile error', async () => {
    const errorMessage = 'Failed to fetch profile';
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
        })),
      })),
    });

    const { result } = renderHook(() => useUserProfile(mockProfileId));

    // Wait for the effect
    await act(async () => {});

    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.loading).toBe(false);
  });

  it('should handle update profile', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { id: mockProfileId }, error: null }),
        })),
      })),
    });

    const { result } = renderHook(() => useUserProfile(mockProfileId));
    
    await act(async () => {
      const res = await result.current.updateProfile({ display_name: 'New Name' });
      expect(res.success).toBe(true);
    });

    expect(result.current.profile?.display_name).toBe('New Name');
  });

  it('should handle update profile error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Network error' } }),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { id: mockProfileId }, error: null }),
        })),
      })),
    });

    const { result } = renderHook(() => useUserProfile(mockProfileId));

    await act(async () => {
      const res = await result.current.updateProfile({ display_name: 'New Name' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Network error');
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'profile.err_update_failed');

    consoleErrorSpy.mockRestore();
  });

  it('should handle upload avatar error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: { message: 'Network error' } }),
      getPublicUrl: jest.fn(),
    });

    const { result } = renderHook(() => useUserProfile(mockProfileId));

    await act(async () => {
      const res = await result.current.uploadAvatar('file://test.jpg');
      expect(res.success).toBe(false);
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.upload_error', 'profile.err_avatar_failed');

    consoleErrorSpy.mockRestore();
  });

  it('should check username uniqueness', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          not: jest.fn().mockResolvedValue({ count: 0, error: null }),
          single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })),
      })),
    });

    const { result } = renderHook(() => useUserProfile(mockProfileId));
    
    await act(async () => {
      const isUnique = await result.current.checkUsernameUnique('newuser');
      expect(isUnique).toBe(true);
    });
  });
});
