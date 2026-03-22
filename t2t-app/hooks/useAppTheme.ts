import { useColorScheme } from '@/hooks/use-color-scheme';
import { Palette } from '@/constants/theme';

/**
 * Semantic design tokens — adapts to system light/dark mode.
 * Use this hook in every component instead of importing Palette directly.
 */
export interface AppTheme {
  // Backgrounds
  bg: string;           // main screen background
  bgSurface: string;    // card / list item background
  bgElevated: string;   // modal, bottom-sheet, elevated surfaces
  bgSubtle: string;     // subtle section backgrounds, input fills

  // Borders
  border: string;
  borderLight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Accents (same in both themes, slight lightness adjustment)
  teal: string;
  tealDim: string;
  orange: string;
  red: string;

  // Passport & premium
  navy: string;
  passGold: string;

  // Teal alpha helpers (for backgrounds, borders)
  tealAlpha10: string;   // rgba teal 10%
  tealAlpha15: string;   // rgba teal 15%
  tealAlpha25: string;   // rgba teal 25% (borders)
  tealAlpha50: string;   // rgba teal 50% (cover badge border)
  orangeAlpha10: string;

  // Overlays
  overlay: string;

  // Scheme
  scheme: 'light' | 'dark';
  isDark: boolean;
}

const dark: AppTheme = {
  bg:          Palette.bgPrimary,
  bgSurface:   Palette.bgSurface,
  bgElevated:  Palette.bgElevated,
  bgSubtle:    Palette.bgSubtle,

  border:      Palette.border,
  borderLight: Palette.borderLight,

  textPrimary:   Palette.textPrimary,
  textSecondary: Palette.textSecondary,
  textMuted:     Palette.textMuted,

  teal:    Palette.teal,
  tealDim: Palette.tealDim,
  orange:  Palette.orange,
  red:     Palette.red,

  navy:     Palette.navy,
  passGold: Palette.passGold,

  tealAlpha10:   'rgba(0,201,167,0.10)',
  tealAlpha15:   'rgba(0,201,167,0.15)',
  tealAlpha25:   'rgba(0,201,167,0.25)',
  tealAlpha50:   'rgba(0,201,167,0.50)',
  orangeAlpha10: 'rgba(249,115,22,0.10)',

  overlay: 'rgba(0,0,0,0.70)',

  scheme: 'dark',
  isDark: true,
};

const light: AppTheme = {
  bg:          '#F6F6FC',
  bgSurface:   '#FFFFFF',
  bgElevated:  '#EEEEF8',
  bgSubtle:    '#E6E6F4',

  border:      '#DDDDF0',
  borderLight: '#EAEAF8',

  textPrimary:   '#0A0A14',
  textSecondary: '#555570',
  textMuted:     '#9999B8',

  teal:    '#00A88A',   // slightly darker for legibility on white
  tealDim: '#008870',
  orange:  '#E86A0A',   // slightly darker for contrast on white
  red:     '#E83050',

  navy:     '#0A1628',
  passGold: '#B8903C',   // slightly warmer on light bg

  tealAlpha10:   'rgba(0,168,138,0.10)',
  tealAlpha15:   'rgba(0,168,138,0.15)',
  tealAlpha25:   'rgba(0,168,138,0.25)',
  tealAlpha50:   'rgba(0,168,138,0.50)',
  orangeAlpha10: 'rgba(232,106,10,0.10)',

  overlay: 'rgba(0,0,0,0.50)',

  scheme: 'light',
  isDark: false,
};

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme() ?? 'dark';
  return scheme === 'dark' ? dark : light;
}
