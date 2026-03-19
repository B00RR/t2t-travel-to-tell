import { renderHook, act } from '@testing-library/react-native';
import { useDayEntries } from '../useDayEntries';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('useDayEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useDayEntries('day-1'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.saving).toBe(false);
    expect(result.current.dayInfo).toBeNull();
    expect(result.current.entries).toEqual([]);
  });

  it('fetches entries correctly', async () => {
    const mockEntries = [
      { id: '1', type: 'text', content: 'test', sort_order: 1 },
    ];
    
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockEntries, error: null })
        })
      })
    });
    
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const { result } = renderHook(() => useDayEntries('day-1'));

    await act(async () => {
      await result.current.fetchEntries();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.entries).toEqual(mockEntries);
  });

  it('resolves photo storagePath to signed urls during fetch', async () => {
    const mockEntries = [
      { id: '1', type: 'photo', content: null, metadata: { storagePath: 'test.jpg' }, sort_order: 1 },
    ];
    
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockEntries, error: null })
        })
      })
    });
    
    const mockStorageFrom = jest.fn().mockReturnValue({
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://mock.url' }, error: null })
    });
    
    (supabase.from as jest.Mock).mockImplementation(mockFrom);
    (supabase.storage.from as jest.Mock).mockImplementation(mockStorageFrom);

    const { result } = renderHook(() => useDayEntries('day-1'));

    await act(async () => {
      await result.current.fetchEntries();
    });

    expect(result.current.entries[0].content).toBe('https://mock.url');
  });

  it('adds an entry and refreshes data', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    
    // For the insert call
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'day_entries') {
        return {
          insert: mockInsert,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        };
      }
    });

    const { result } = renderHook(() => useDayEntries('day-1'));

    let success;
    await act(async () => {
      success = await result.current.addEntry('text', 'New test entry');
    });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      day_id: 'day-1',
      type: 'text',
      content: 'New test entry',
    }));
    expect(success).toBe(true);
  });
});
