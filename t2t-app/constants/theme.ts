import { Platform } from 'react-native';

/**
 * Travel to Tell — Design System
 * Style: Immersive / Cinematic — Adaptive light & dark
 *
 * Primary accent: #00C9A7 (teal — oceano, mappe, esplorazione)
 * Warm accent:    #F97316 (arancio — tramonti, energia, avventura)
 * Passport navy:  #0A1628 (deep navy — passport, premium)
 * Passport gold:  #D4A853 (gold — stamps, premium details)
 */

export const Palette = {
  // Backgrounds
  bgPrimary:   '#09090F',   // Near-black base
  bgSurface:   '#121220',   // Card background
  bgElevated:  '#1A1A2C',   // Modal / elevated surfaces
  bgSubtle:    '#1E1E30',   // Subtle section backgrounds

  // Borders & dividers
  border:      '#252540',
  borderLight: '#1E1E32',

  // Text
  textPrimary:   '#F0F0F8',
  textSecondary: '#8888AA',
  textMuted:     '#50506A',

  // Accents
  teal:    '#00C9A7',   // Primary accent
  tealDim: '#00876E',   // Pressed / dimmed teal
  orange:  '#F97316',   // Warm / warm accent
  red:     '#FF4060',   // Like / error
  gold:    '#F5C842',   // Badge / premium

  // Grays
  gray100: '#F0F0F8',
  gray300: '#AAAABC',
  gray500: '#666680',
  gray700: '#333348',
  gray900: '#0D0D18',

  // Passport & premium
  navy:      '#0A1628',   // Deep passport navy
  passGold:  '#D4A853',   // Passport gold accents
  passStamp: '#1B3A5C',   // Passport stamp blue

  // Semitransparent overlays
  overlayLight: 'rgba(9,9,15,0.5)',
  overlayMid:   'rgba(9,9,15,0.75)',
  overlayHeavy: 'rgba(9,9,15,0.92)',

  // Story scrim gradients (for full-screen immersive cards)
  storyScrimTop:    'rgba(0,0,0,0.45)',
  storyScrimBottom: 'rgba(0,0,0,0.75)',
  storyScrimDeep:   'rgba(0,0,0,0.90)',
} as const;

export const Colors = {
  light: {
    background:    '#F4F4FC',
    surface:       '#FFFFFF',
    surfaceElevated: '#EBEBF8',
    border:        '#E0E0F0',
    text:          '#0A0A14',
    textSecondary: '#666680',
    textMuted:     '#AAAABC',
    tint:          '#00A88A',
    tintWarm:      '#F97316',
    icon:          '#666680',
    tabIconDefault:  '#AAAABC',
    tabIconSelected: '#00A88A',
    like:          '#FF4060',
    error:         '#FF4444',
    success:       '#00C9A7',
    overlay:       'rgba(0,0,0,0.6)',
  },
  dark: {
    background:    Palette.bgPrimary,
    surface:       Palette.bgSurface,
    surfaceElevated: Palette.bgElevated,
    border:        Palette.border,
    text:          Palette.textPrimary,
    textSecondary: Palette.textSecondary,
    textMuted:     Palette.textMuted,
    tint:          Palette.teal,
    tintWarm:      Palette.orange,
    icon:          Palette.textSecondary,
    tabIconDefault:  Palette.textMuted,
    tabIconSelected: Palette.teal,
    like:          Palette.red,
    error:         Palette.red,
    success:       Palette.teal,
    overlay:       Palette.overlayMid,
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
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  full: 9999,
} as const;

export const Typography = {
  /** Display — hero titles */
  display: { fontSize: 36, fontWeight: '900' as const, letterSpacing: -1.5, lineHeight: 42 },
  /** H1 — screen titles */
  h1:      { fontSize: 28, fontWeight: '800' as const, letterSpacing: -1,   lineHeight: 34 },
  /** H2 — section headings */
  h2:      { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 28 },
  /** H3 — card titles */
  h3:      { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 24 },
  /** Body */
  body:    { fontSize: 15, fontWeight: '400' as const, letterSpacing: 0,    lineHeight: 22 },
  /** Body bold */
  bodyBold:{ fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.1, lineHeight: 22 },
  /** Caption */
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0,    lineHeight: 16 },
  /** Label — buttons, tabs */
  label:   { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.2,  lineHeight: 18 },
  /** Micro — tiny labels, badges */
  micro:   { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.4,  lineHeight: 14 },
} as const;

export const Shadows = {
  /** Subtle card shadow — dark mode */
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  /** Accent glow — teal */
  teal: {
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

/** Glassmorphism tokens — frosted glass overlays (adaptive) */
export const Glass = {
  bg:       'rgba(12,12,22,0.72)',
  bgLight:  'rgba(240,240,248,0.10)',
  bgTeal:   'rgba(0,201,167,0.14)',
  border:   'rgba(255,255,255,0.08)',
  borderTeal: 'rgba(0,201,167,0.28)',
  // Story overlay glass — heavier for full-screen text readability
  storyBg:       'rgba(0,0,0,0.55)',
  storyBgLight:  'rgba(255,255,255,0.85)',
  storyBorder:   'rgba(255,255,255,0.12)',
} as const;

/** Glow shadows keyed by color */
export const Glow = {
  teal: {
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  orange: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  dark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 20,
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
    kenBurns: 15000,  // Slow cinematic zoom
    typewriter: 40,   // Per-character delay
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
