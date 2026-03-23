import { Platform } from 'react-native';

/**
 * Travel to Tell — "Terra" Design System
 * Style: Warm, organic, light-first travel aesthetic
 *
 * Primary:   #D4654A (Terracotta — warmth, earth, adventure)
 * Secondary: #1B4B66 (Ocean blue — depth, trust, exploration)
 * Accent:    #E8A84C (Golden amber — sunlight, discovery)
 * Success:   #5A9E6F (Sage green — nature, growth)
 */

export const Palette = {
  // Core brand
  terracotta:    '#D4654A',
  terracottaDim: '#B8503A',
  ocean:         '#1B4B66',
  oceanLight:    '#2A6B8F',
  amber:         '#E8A84C',
  amberDim:      '#C48E3E',
  sage:          '#5A9E6F',
  sageDim:       '#4A8A5E',

  // Backgrounds — light
  cream:         '#FBF8F4',
  sand:          '#F3EDE4',
  sandLight:     '#F8F4EE',
  white:         '#FFFFFF',

  // Backgrounds — dark
  charcoal:      '#1A1A1A',
  slate:         '#252525',
  slateMid:      '#2E2E2E',
  slateLight:    '#3A3A3A',

  // Text — light theme
  inkPrimary:    '#1C1C1E',
  inkSecondary:  '#6B6B76',
  inkMuted:      '#A0A0AB',

  // Text — dark theme
  snowPrimary:   '#F5F5F5',
  snowSecondary: '#A0A0AB',
  snowMuted:     '#6B6B76',

  // Borders
  borderLight:   '#E8E2D9',
  borderDark:    '#3A3A3A',

  // Semantic
  error:         '#D94848',
  like:          '#E85D75',
  warning:       '#E8A84C',
  success:       '#5A9E6F',
  info:          '#5A9AC5',

  // Overlays
  overlayLight:  'rgba(28,28,30,0.3)',
  overlayMid:    'rgba(28,28,30,0.55)',
  overlayHeavy:  'rgba(28,28,30,0.8)',

  // ── Backward-compatible aliases ──
  // Map old STRATA names → Terra values so existing components keep working
  bgPrimary:     '#FBF8F4',   // cream
  bgSurface:     '#FFFFFF',   // white
  bgElevated:    '#F8F4EE',   // sandLight
  bgSubtle:      '#F3EDE4',   // sand
  border:        '#E8E2D9',   // borderLight
  textPrimary:   '#1C1C1E',   // inkPrimary
  textSecondary: '#6B6B76',   // inkSecondary
  textMuted:     '#A0A0AB',   // inkMuted
  teal:          '#D4654A',   // terracotta (primary accent)
  tealDim:       '#B8503A',   // terracottaDim
  orange:        '#E8A84C',   // amber
  red:           '#D94848',   // error
  gold:          '#E8A84C',   // amber
  gray100:       '#F5F5F5',
  gray300:       '#C0C0C8',
  gray500:       '#8888AA',
  gray700:       '#4A4A5A',
  gray900:       '#1C1C1E',
  navy:          '#1B4B66',   // ocean
  passGold:      '#E8A84C',   // amber
  passStamp:     '#2A6B8F',   // oceanLight

  // Story scrims (for full-screen cards, if still used)
  storyScrimTop:    'rgba(0,0,0,0.35)',
  storyScrimBottom: 'rgba(0,0,0,0.60)',
  storyScrimDeep:   'rgba(0,0,0,0.80)',
} as const;

export const Colors = {
  light: {
    background:      Palette.cream,
    surface:         Palette.white,
    surfaceElevated: Palette.sandLight,
    border:          Palette.borderLight,
    text:            Palette.inkPrimary,
    textSecondary:   Palette.inkSecondary,
    textMuted:       Palette.inkMuted,
    tint:            Palette.terracotta,
    tintSecondary:   Palette.ocean,
    tintWarm:        Palette.amber,
    icon:            Palette.inkSecondary,
    tabIconDefault:  Palette.inkMuted,
    tabIconSelected: Palette.terracotta,
    like:            Palette.like,
    error:           Palette.error,
    success:         Palette.sage,
    overlay:         Palette.overlayMid,
    card:            Palette.white,
    cardBorder:      Palette.borderLight,
  },
  dark: {
    background:      Palette.charcoal,
    surface:         Palette.slate,
    surfaceElevated: Palette.slateMid,
    border:          Palette.borderDark,
    text:            Palette.snowPrimary,
    textSecondary:   Palette.snowSecondary,
    textMuted:       Palette.snowMuted,
    tint:            '#E07A62',  // Lighter terracotta for dark
    tintSecondary:   '#4A9BC5', // Lighter ocean for dark
    tintWarm:        Palette.amber,
    icon:            Palette.snowSecondary,
    tabIconDefault:  Palette.snowMuted,
    tabIconSelected: '#E07A62',
    like:            Palette.like,
    error:           '#E86060',
    success:         '#6BB57E',
    overlay:         'rgba(0,0,0,0.6)',
    card:            Palette.slate,
    cardBorder:      Palette.borderDark,
  },
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const Radius = {
  xs:   6,
  sm:   10,
  md:   16,
  lg:   22,
  xl:   30,
  full: 9999,
} as const;

export const Typography = {
  /** Display — hero titles */
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 38 },
  /** H1 — screen titles */
  h1:      { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 32 },
  /** H2 — section headings */
  h2:      { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 26 },
  /** H3 — card titles */
  h3:      { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 22 },
  /** Body */
  body:    { fontSize: 15, fontWeight: '400' as const, letterSpacing: 0,    lineHeight: 22 },
  /** Body semibold */
  bodyBold:{ fontSize: 15, fontWeight: '600' as const, letterSpacing: 0,    lineHeight: 22 },
  /** Caption */
  caption: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0,    lineHeight: 18 },
  /** Label — buttons, tabs */
  label:   { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3,  lineHeight: 16 },
  /** Micro — tiny labels, badges */
  micro:   { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.4,  lineHeight: 14 },
} as const;

export const Shadows = {
  /** Soft card shadow */
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    default: {
      elevation: 3,
    },
  }),
  /** Medium elevation */
  elevated: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    default: {
      elevation: 6,
    },
  }),
  /** Tab bar shadow */
  tabBar: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    default: {
      elevation: 8,
    },
  }),
  /** Button press glow */
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

/** Glass overlays — used sparingly for overlays on images */
export const Glass = {
  bg:           'rgba(255,255,255,0.88)',
  bgDark:       'rgba(26,26,26,0.82)',
  bgLight:      'rgba(255,255,255,0.12)',
  bgTint:       'rgba(212,101,74,0.08)',
  bgTeal:       'rgba(212,101,74,0.10)',
  border:       'rgba(0,0,0,0.06)',
  borderDark:   'rgba(255,255,255,0.1)',
  borderTeal:   'rgba(212,101,74,0.25)',
  storyBg:      'rgba(0,0,0,0.45)',
  storyBgLight: 'rgba(255,255,255,0.85)',
  storyBorder:  'rgba(255,255,255,0.15)',
} as const;

/** Glow shadows keyed by color — used minimally */
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

/** Motion presets for Animated.spring / Animated.timing */
export const Motion = {
  spring: {
    normal:  { friction: 8,  tension: 120, useNativeDriver: true },
    snappy:  { friction: 6,  tension: 200, useNativeDriver: true },
    bouncy:  { friction: 4,  tension: 150, useNativeDriver: true },
    morph:   { friction: 10, tension: 100, useNativeDriver: true },
  },
  duration: {
    instant:  80,
    fast:    150,
    normal:  280,
    slow:    420,
    kenBurns: 15000,
    typewriter: 40,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
