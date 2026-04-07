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
  passStamp: string;
  passStampText: string;

  // Alpha helpers
  tealAlpha10: string;
  tealAlpha15: string;
  tealAlpha25: string;
  tealAlpha50: string;
  orangeAlpha10: string;

  // Overlays
  overlay: string;
  storyScrimTop: string;
  storyScrimBottom: string;
  storyScrimDeep: string;

  // Text on colored buttons / overlays
  buttonText: string;
  overlayText: string;

  // Secondary accent
  ocean: string;
  sage: string;

  // Scheme
  scheme: 'light' | 'dark';
  isDark: boolean;
}

const light: AppTheme = {
  bg:          Palette.sandLight,
  bgSurface:   Palette.paper,
  bgElevated:  Palette.paper,
  bgSubtle:    Palette.sand,

  border:      Palette.borderLight,
  borderLight: '#F0EBE2',

  textPrimary:   Palette.ink,
  textSecondary: Palette.inkMuted,
  textMuted:     '#7A7470', // Darkened from Palette.inkFaint (#9E9690) for WCAG AA 4.5:1 contrast on bg

  teal:    Palette.terracotta,
  tealDim: Palette.terracottaDim,
  orange:  Palette.amber,
  red:     Palette.error,

  navy:     Palette.forest,
  passGold: Palette.amber,
  passStamp: Palette.paper,
  passStampText: Palette.ink,

  tealAlpha10:   'rgba(200,90,66,0.10)',
  tealAlpha15:   'rgba(200,90,66,0.15)',
  tealAlpha25:   'rgba(200,90,66,0.25)',
  tealAlpha50:   'rgba(200,90,66,0.50)',
  orangeAlpha10: 'rgba(217,150,50,0.10)',

  overlay: Palette.overlayLight,
  storyScrimTop:    Palette.storyScrimTop,
  storyScrimBottom: Palette.storyScrimBottom,
  storyScrimDeep:   Palette.storyScrimDeep,

  buttonText: '#fff',
  overlayText: '#fff',

  ocean: Palette.info,
  sage:  Palette.success,

  scheme: 'light',
  isDark: false,
};

const dark: AppTheme = {
  bg:          Palette.charcoal,
  bgSurface:   Palette.slate,
  bgElevated:  '#2E2D2B',
  bgSubtle:    '#3D3A38',

  border:      Palette.borderDark,
  borderLight: '#333333',

  textPrimary:   Palette.snow,
  textSecondary: Palette.snowMuted,
  textMuted:     '#7A7670',

  teal:    '#E07A62',
  tealDim: '#C06850',
  orange:  Palette.warning,
  red:     '#E86060',

  navy:     Palette.forestLight,
  passGold: Palette.amber,
  passStamp: '#403D3B',
  passStampText: '#F4EEE0',

  tealAlpha10:   'rgba(224,122,98,0.10)',
  tealAlpha15:   'rgba(224,122,98,0.15)',
  tealAlpha25:   'rgba(224,122,98,0.25)',
  tealAlpha50:   'rgba(224,122,98,0.50)',
  orangeAlpha10: 'rgba(232,168,76,0.10)',

  overlay: Palette.overlayDark,
  storyScrimTop:    Palette.storyScrimTop, 
  storyScrimBottom: Palette.storyScrimBottom,
  storyScrimDeep:   Palette.storyScrimDeep,

  buttonText: '#fff',
  overlayText: '#fff',

  ocean: Palette.info,
  sage:  Palette.success,

  scheme: 'dark',
  isDark: true,
};

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme() ?? 'light';
  return scheme === 'dark' ? dark : light;
}
