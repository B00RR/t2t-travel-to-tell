import { renderHook, act } from '@testing-library/react-native';
import { useComments } from '../useComments';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({ error: null })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null })),
      })),
    })),
  },
}));

describe('useComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('addComment should return false if content is empty or whitespace without calling Supabase', async () => {
    const { result } = renderHook(() => useComments());

    let returnValue;
    await act(async () => {
      returnValue = await result.current.addComment('diary-1', 'user-1', '   ');
    });

    expect(returnValue).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();

    await act(async () => {
      returnValue = await result.current.addComment('diary-1', 'user-1', '');
    });

    expect(returnValue).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
