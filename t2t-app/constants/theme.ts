import { Platform } from 'react-native';

/**
 * Travel to Tell — "Authentic Explorer" Design System
 * Aesthetic: Digital Moleskine, Earthy, Organic, High-Contrast
 */

export const Palette = {
  // Brand
  terracotta:     '#C85A42', // Warm, grounded primary
  terracottaDim:  '#A64832',
  forest:         '#2D4A3E', // Forest green secondary
  forestLight:    '#3B6051',
  sand:           '#EAE4D9', // Paper-like background
  sandLight:      '#F4F0EA',
  amber:          '#D99632', // Highlight

  // Neutrals - Light
  ink:            '#1F1E1D', // Deep charcoal for primary text
  inkMuted:       '#5A5855',
  inkFaint:       '#8C8883',
  paper:          '#FAFAFA', // Purest light background
  
  // Neutrals - Dark
  charcoal:       '#161615',
  slate:          '#242322',
  snow:           '#F0EBE1', // Off-white for dark mode text
  snowMuted:      '#A8A49D',
  
  // Semantic
  error:          '#C84242',
  success:        '#42C87A',
  warning:        '#D99632',
  info:           '#42A1C8',
  
  // System
  borderLight:    '#D6D2CB',
  borderDark:     '#3D3A38',
  overlayLight:   'rgba(31, 30, 29, 0.4)',
  overlayDark:    'rgba(0, 0, 0, 0.7)',

  // Legacy mappings for older components
  teal:          '#C85A42', // mapped to terracotta
  tealDim:       '#A64832', // mapped to terracottaDim
  orange:        '#D99632', // mapped to amber
  red:           '#C84242', // mapped to error
  gold:          '#D99632', // mapped to amber
  gray100:       '#F0EBE1',
  gray300:       '#D6D2CB',
  gray500:       '#8C8883',
  gray700:       '#3D3A38',
  gray900:       '#161615',
  navy:          '#2D4A3E', // mapped to forest
  passGold:      '#D99632', // amber
  passStamp:     '#3B6051', // forestLight
  
  storyScrimTop:    'rgba(0,0,0,0.35)',
  storyScrimBottom: 'rgba(0,0,0,0.60)',
  storyScrimDeep:   'rgba(0,0,0,0.80)',

  // Legacy Semantic
  bgPrimary:     '#F4F0EA',
  bgSurface:     '#FAFAFA',
  bgElevated:    '#F4F0EA',
  bgSubtle:      '#EAE4D9',
  border:        '#D6D2CB',
  textPrimary:   '#1F1E1D',
  textSecondary: '#5A5855',
  textMuted:     '#8C8883',
  tintWarm:      '#D99632',
  overlayMid:    'rgba(0,0,0,0.5)',
} as const;

export const Colors = {
  light: {
    background: Palette.sandLight,
    surface: Palette.paper,
    surfaceElevated: '#FFFFFF',
    border: Palette.borderLight,
    text: Palette.ink,
    textSecondary: Palette.inkMuted,
    textFaint: Palette.inkFaint,
    tint: Palette.terracotta,
    tintSecondary: Palette.forest,
    tintWarm: Palette.amber,
    icon: Palette.inkMuted,
    tabIconDefault: Palette.inkFaint,
    tabIconSelected: Palette.terracotta,
    error: Palette.error,
    success: Palette.success,
    overlay: Palette.overlayLight,
  },
  dark: {
    background: Palette.charcoal,
    surface: Palette.slate,
    surfaceElevated: '#2E2D2B',
    border: Palette.borderDark,
    text: Palette.snow,
    textSecondary: Palette.snowMuted,
    textFaint: '#7A7670',
    tint: Palette.terracotta, // Reusing terracotta for punchy contrast
    tintSecondary: Palette.forestLight,
    icon: Palette.snowMuted,
    tabIconDefault: '#7A7670',
    tabIconSelected: Palette.terracotta,
    error: '#E06C6C',
    success: '#6CE09D',
    overlay: Palette.overlayDark,
  }
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
} as const;

export const Radius = {
  xs:   4,
  sm:   8, // Strict 8dp cadence
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const Fonts = Platform.select({
  ios: {
    serif: 'Georgia',
    sans: 'System',
    mono: 'Courier',
  },
  android: {
    serif: 'serif',
    sans: 'sans-serif',
    mono: 'monospace',
  },
  default: {
    serif: 'Georgia, serif',
    sans: 'system-ui, sans-serif',
    mono: 'monospace',
  }
});

export const Typography = {
  // Serif for evocative headings
  display:  { fontFamily: Fonts.serif, fontSize: 32, fontWeight: '700' as const, lineHeight: 40, letterSpacing: -0.5 },
  h1:       { fontFamily: Fonts.serif, fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.2 },
  h2:       { fontFamily: Fonts.serif, fontSize: 18, fontWeight: '600' as const, lineHeight: 26, letterSpacing: 0 },
  
  // Sans-serif for optimal readability in body/UI elements
  title:    { fontFamily: Fonts.sans, fontSize: 16, fontWeight: '600' as const, lineHeight: 24, letterSpacing: 0 },
  body: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm:   { fontFamily: Fonts.sans, fontSize: 14, fontWeight: '400' as const, lineHeight: 20, letterSpacing: 0 },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: '#8C8883',
  },
  micro:    { fontFamily: Fonts.sans, fontSize: 10, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 0.5 },

  // Legacy
  h3: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.1,
  },
} as const;

export const Shadows = {
  // Organic, subtle paper-like shadows
  card: Platform.select({
    ios: {
      shadowColor: '#1F1E1D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    default: {
      elevation: 3,
    },
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#1F1E1D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
    },
    default: {
      elevation: 6,
    },
  }),
  tabBar: Platform.select({
    ios: {
      shadowColor: '#1F1E1D',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    default: {
      elevation: 6,
    },
  }),
  glow: (color: string) => Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    default: {
      elevation: 4,
    },
  }),
} as const;

export const Glass = {
  bg:           'rgba(250,250,250,0.88)',
  bgDark:       'rgba(22,22,21,0.82)',
  bgLight:      'rgba(250,250,250,0.12)',
  bgTint:       'rgba(200,90,66,0.08)',
  bgTeal:       'rgba(200,90,66,0.10)',
  border:       'rgba(0,0,0,0.06)',
  borderDark:   'rgba(250,250,250,0.1)',
  borderTeal:   'rgba(200,90,66,0.25)',
  storyBg:      'rgba(0,0,0,0.45)',
  storyBgLight: 'rgba(250,250,250,0.85)',
  storyBorder:  'rgba(250,250,250,0.15)',
} as const;

export const Glow = {
  teal: {
    shadowColor: Palette.terracotta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  orange: {
    shadowColor: Palette.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  dark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

export const Motion = {
  spring: {
    normal:  { friction: 8,  tension: 120, useNativeDriver: true },
    snappy:  { friction: 6,  tension: 200, useNativeDriver: true },
    bouncy:  { friction: 4,  tension: 150, useNativeDriver: true },
    morph:   { friction: 10, tension: 100, useNativeDriver: true },
  },
  duration: {
    fast: 150,
    normal: 300,
    slow: 450,
  }
} as const;

