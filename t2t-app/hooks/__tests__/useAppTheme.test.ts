import { renderHook } from '@testing-library/react-native';
import { useAppTheme } from '../useAppTheme';
import { useColorScheme } from '../use-color-scheme';
import { Palette } from '@/constants/theme';

// Mock useColorScheme
jest.mock('../use-color-scheme', () => ({
  useColorScheme: jest.fn(),
}));

describe('useAppTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('RESTITUISCE il tema Light quando lo schema è "light"', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    
    const { result } = renderHook(() => useAppTheme());
    
    expect(result.current.scheme).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(result.current.bg).toBe(Palette.sandLight);
    expect(result.current.textPrimary).toBe(Palette.ink);
    // Verifica contrasto migliorato
    expect(result.current.textMuted).toBe('#7A7470');
  });

  it('RESTITUISCE il tema Dark quando lo schema è "dark"', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    
    const { result } = renderHook(() => useAppTheme());
    
    expect(result.current.scheme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(result.current.bg).toBe(Palette.charcoal);
    expect(result.current.textPrimary).toBe(Palette.snow);
  });

  it('RESTITUISCE il tema Light come fallback quando lo schema è null', () => {
    (useColorScheme as jest.Mock).mockReturnValue(null);
    
    const { result } = renderHook(() => useAppTheme());
    
    expect(result.current.scheme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('CONTIENE i token di brand corretti', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const { result } = renderHook(() => useAppTheme());
    
    expect(result.current.teal).toBe(Palette.terracotta);
    expect(result.current.orange).toBe(Palette.amber);
    expect(result.current.red).toBe(Palette.error);
  });

  it('CONTIENE i nuovi token Passport', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const { result } = renderHook(() => useAppTheme());
    
    expect(result.current.passStamp).toBeDefined();
    expect(result.current.passStampText).toBeDefined();
  });
});
