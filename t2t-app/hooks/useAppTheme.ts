import { useColorScheme } from '@/hooks/use-color-scheme';
import { Palette } from '@/constants/theme';

/**
 * Terra design tokens — adapts to system light/dark mode.
 * Use this hook in every component instead of importing Palette directly.
 */
export interface AppTheme {
  // Backgrounds
  bg: string;
  bgSurface: string;
  bgElevated: string;
  bgSubtle: string;

  // Borders
  border: string;
  borderLight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Brand accents
  teal: string;       // primary (terracotta)
  tealDim: string;    // primary dimmed
  orange: string;     // warm accent (amber)
  red: string;        // error / like

  // Passport & premium
  navy: string;
  passGold: string;

  // Alpha helpers
  tealAlpha10: string;
  tealAlpha15: string;
  tealAlpha25: string;
  tealAlpha50: string;
  orangeAlpha10: string;

  // Overlays
  overlay: string;

  // Secondary accent
  ocean: string;
  sage: string;

  // Scheme
  scheme: 'light' | 'dark';
  isDark: boolean;
}

const light: AppTheme = {
  bg:          Palette.cream,
  bgSurface:   Palette.white,
  bgElevated:  Palette.sandLight,
  bgSubtle:    Palette.sand,

  border:      Palette.borderLight,
  borderLight: '#F0EBE2',

  textPrimary:   Palette.inkPrimary,
  textSecondary: Palette.inkSecondary,
  textMuted:     Palette.inkMuted,

  teal:    Palette.terracotta,
  tealDim: Palette.terracottaDim,
  orange:  Palette.amber,
  red:     Palette.error,

  navy:     Palette.ocean,
  passGold: Palette.amber,

  tealAlpha10:   'rgba(212,101,74,0.10)',
  tealAlpha15:   'rgba(212,101,74,0.15)',
  tealAlpha25:   'rgba(212,101,74,0.25)',
  tealAlpha50:   'rgba(212,101,74,0.50)',
  orangeAlpha10: 'rgba(232,168,76,0.10)',

  overlay: 'rgba(28,28,30,0.50)',

  ocean: Palette.ocean,
  sage:  Palette.sage,

  scheme: 'light',
  isDark: false,
};

const dark: AppTheme = {
  bg:          Palette.charcoal,
  bgSurface:   Palette.slate,
  bgElevated:  Palette.slateMid,
  bgSubtle:    Palette.slateLight,

  border:      Palette.borderDark,
  borderLight: '#333333',

  textPrimary:   Palette.snowPrimary,
  textSecondary: Palette.snowSecondary,
  textMuted:     Palette.snowMuted,

  teal:    '#E07A62',
  tealDim: '#C06850',
  orange:  Palette.amber,
  red:     '#E86060',

  navy:     '#2A6B8F',
  passGold: Palette.amber,

  tealAlpha10:   'rgba(224,122,98,0.10)',
  tealAlpha15:   'rgba(224,122,98,0.15)',
  tealAlpha25:   'rgba(224,122,98,0.25)',
  tealAlpha50:   'rgba(224,122,98,0.50)',
  orangeAlpha10: 'rgba(232,168,76,0.10)',

  overlay: 'rgba(0,0,0,0.65)',

  ocean: '#4A9BC5',
  sage:  '#6BB57E',

  scheme: 'dark',
  isDark: true,
};

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme() ?? 'light';
  return scheme === 'dark' ? dark : light;
}
