import { renderHook, act } from '@testing-library/react-native';
import { useFollow } from '../useFollow';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
  },
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'Success',
  },
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'debug').mockImplementation(() => {});

describe('useFollow', () => {
  const currentUserId = 'user-1';
  const targetProfileId = 'user-2';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading true and isFollowing false', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useFollow(currentUserId, targetProfileId));

    expect(result.current.loading).toBe(true);
    expect(result.current.isFollowing).toBe(false);

    await act(async () => {});

    expect(result.current.loading).toBe(false);
  });

  it('should check follow status and set isFollowing to true if following', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: { follower_id: currentUserId }, error: null }),
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useFollow(currentUserId, targetProfileId));

    await act(async () => {});

    expect(result.current.isFollowing).toBe(true);
  });

  it('should log error and set isFollowing to false if checkFollowStatus fails', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockRejectedValue(new Error('Database error')),
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useFollow(currentUserId, targetProfileId));

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.isFollowing).toBe(false);
    expect(console.debug).toHaveBeenCalledWith('Failed to check follow status', expect.any(Error));
  });

  it('should require authentication to follow', async () => {
    const { result } = renderHook(() => useFollow(undefined, targetProfileId));

    await act(async () => {
      await result.current.toggleFollow();
    });

    expect(Alert.alert).toHaveBeenCalledWith('social.login_required', 'social.login_to_follow');
  });

  it('should not allow following oneself', async () => {
    const { result } = renderHook(() => useFollow(currentUserId, currentUserId));

    await act(async () => {
      await result.current.toggleFollow();
    });

    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should optimistically update and then delete follow record when already following', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: { follower_id: currentUserId }, error: null }),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    });

    const { result } = renderHook(() => useFollow(currentUserId, targetProfileId));

    await act(async () => {});
    expect(result.current.isFollowing).toBe(true);

    await act(async () => {
      await result.current.toggleFollow();
    });

    expect(Haptics.notificationAsync).toHaveBeenCalledWith('Success');
    expect(result.current.isFollowing).toBe(false);
    expect(supabase.from).toHaveBeenCalledWith('follows');
  });

  it('should optimistically update and then insert follow record', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useFollow(currentUserId, targetProfileId));

    await act(async () => {});
    expect(result.current.isFollowing).toBe(false);

    await act(async () => {
      await result.current.toggleFollow();
    });

    expect(Haptics.notificationAsync).toHaveBeenCalledWith('Success');
    expect(result.current.isFollowing).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('follows');
  });

  it('should revert optimistic update and show alert on API error', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
      insert: jest.fn().mockRejectedValue(new Error('Network error')),
    });

    const { result } = renderHook(() => useFollow(currentUserId, targetProfileId));

    await act(async () => {});
    expect(result.current.isFollowing).toBe(false);

    await act(async () => {
      await result.current.toggleFollow();
    });

    // Reverted back to false
    expect(result.current.isFollowing).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'social.err_follow_toggle');
  });
  it('should revert optimistic update and show alert on API error when unfollowing', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: { follower_id: currentUserId }, error: null }),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockRejectedValue(new Error('Network error during delete')),
        })),
      })),
    });

    const { result } = renderHook(() => useFollow(currentUserId, targetProfileId));

    await act(async () => {});
    expect(result.current.isFollowing).toBe(true);

    await act(async () => {
      await result.current.toggleFollow();
    });

    // Reverted back to true
    expect(result.current.isFollowing).toBe(true);
    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'social.err_follow_toggle');
    expect(console.warn).toHaveBeenCalledWith('Failed to toggle follow', expect.any(Error));
  });
});
