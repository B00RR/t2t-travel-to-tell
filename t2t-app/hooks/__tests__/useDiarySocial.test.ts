import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDiarySocial } from '../useDiarySocial';
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
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('useDiarySocial', () => {
  const diaryId = 'diary-1';
  const userId = 'user-1';
  const initialCounters = { like_count: 5, save_count: 2, comment_count: 0 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loadingInitialState true and default values', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useDiarySocial({ diaryId, userId, initialCounters }));

    expect(result.current.loadingInitialState).toBe(true);
    expect(result.current.hasLiked).toBe(false);
    expect(result.current.hasSaved).toBe(false);
    expect(result.current.counters).toEqual(initialCounters);

    await waitFor(() => {
      expect(result.current.loadingInitialState).toBe(false);
    });
  });

  it('should skip fetching if userId is undefined', async () => {
    const { result } = renderHook(() => useDiarySocial({ diaryId, userId: undefined, initialCounters }));

    expect(result.current.loadingInitialState).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should set hasLiked and hasSaved if data is returned', async () => {
    // We mock two calls, first for 'likes', second for 'saves'
    // This is simple since single() just needs to return some data to make the condition truthy
    (supabase.from as jest.Mock).mockImplementation((table) => {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: { user_id: userId }, error: null }),
            })),
          })),
        })),
      };
    });

    const { result } = renderHook(() => useDiarySocial({ diaryId, userId, initialCounters }));

    await waitFor(() => {
      expect(result.current.loadingInitialState).toBe(false);
    });

    expect(result.current.hasLiked).toBe(true);
    expect(result.current.hasSaved).toBe(true);
  });

  it('should handle errors gracefully during initial fetch and set loadingInitialState to false', async () => {
    // Simulate Supabase throwing an error during the initial fetch
    (supabase.from as jest.Mock).mockImplementation(() => {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockRejectedValue(new Error('Network error')),
            })),
          })),
        })),
      };
    });

    const { result } = renderHook(() => useDiarySocial({ diaryId, userId, initialCounters }));

    // Verify it starts as loading
    expect(result.current.loadingInitialState).toBe(true);

    // Wait for the async fetchInitialState to finish
    await waitFor(() => {
      expect(result.current.loadingInitialState).toBe(false);
    });

    // Check that hasLiked and hasSaved remain their default falsy values when an error occurs
    expect(result.current.hasLiked).toBe(false);
    expect(result.current.hasSaved).toBe(false);
  });
});
