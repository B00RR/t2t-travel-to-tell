import { Platform } from 'react-native';

/**
 * Travel to Tell — "Terra Evolved" Design System
 * Aesthetic: Digital Moleskine, Earthy, Organic, Premium
 * 
 * Fonts: Playfair Display (serif), DM Sans (sans), Caveat (handwritten)
 */

// ============================================================
// PALETTE
// ============================================================

export const Palette = {
  // Brand — Terracotta
  terracotta:       '#C85A42', // Primary
  terracottaDeep:   '#8B3A28', // Primary pressed/hover
  terracottaDim:    '#A64832', // Primary muted
  terracottaGlow:   'rgba(200,90,66,0.25)', // Glow effect

  // Brand — Forest
  forest:           '#2D4A3E', // Secondary
  forestDeep:       '#1A2D25', // Secondary pressed
  forestLight:      '#3B6051', // Secondary light

  // Brand — Golden Hour
  goldenHour:       '#D4A853', // Badge, achievement, special
  goldenHourGlow:   'rgba(212,168,83,0.30)', // Badge glow
  amber:            '#D99632', // Highlight (legacy)

  // Background & Surface — Light
  bg:               '#FAF6F0', // Main background (warm paper)
  bgWarm:           '#F5EDE3', // Warmer background
  sand:             '#EAE4D9', // Subtle background
  sandLight:        '#F4F0EA', // Light sand
  paper:            '#FFFFFF', // Pure surface

  // Background & Surface — Dark
  charcoal:         '#141210', // Main dark background (warm black)
  slate:            '#201D1A', // Dark surface
  slateElevated:    '#2A2623', // Dark elevated surface

  // Text — Light
  ink:              '#1A1714', // Primary text (warmer)
  inkMuted:         '#6B6560', // Secondary text
  inkFaint:         '#9E9690', // Faint text

  // Text — Dark
  snow:             '#F0EBE1', // Primary dark text (warm ivory)
  snowMuted:        '#A8A098', // Secondary dark text

  // Semantic
  error:            '#C84242',
  success:          '#42C87A',
  warning:          '#D99632',
  info:             '#42A1C8',

  // Borders
  borderLight:      'rgba(26,23,20,0.08)',
  borderWarm:       'rgba(200,90,66,0.15)',
  borderStrong:     'rgba(26,23,20,0.15)',
  borderDark:       'rgba(240,235,225,0.08)',
  borderDarkWarm:   'rgba(224,122,92,0.20)',

  // Overlays
  overlayLight:     'rgba(26,23,20,0.40)',
  overlayDark:      'rgba(0,0,0,0.70)',

  // Legacy mappings (do not remove — used by older components)
  teal:             '#C85A42',
  tealDim:          '#A64832',
  orange:           '#D99632',
  red:              '#C84242',
  gold:             '#D4A853',
  gray100:          '#F0EBE1',
  gray300:          '#D6D2CB',
  gray500:          '#8C8883',
  gray700:          '#3D3A38',
  gray900:          '#161615',
  navy:             '#2D4A3E',
  passGold:         '#D4A853',
  passStamp:        '#3B6051',

  storyScrimTop:    'rgba(0,0,0,0.35)',
  storyScrimBottom: 'rgba(0,0,0,0.60)',
  storyScrimDeep:   'rgba(0,0,0,0.80)',

  // Legacy Semantic (for older components)
  bgPrimary:        '#F4F0EA',
  bgSurface:        '#FAFAFA',
  bgElevated:       '#F4F0EA',
  bgSubtle:         '#EAE4D9',
  border:           '#D6D2CB',
  textPrimary:      '#1A1714',
  textSecondary:    '#6B6560',
  textMuted:        '#9E9690',
  tintWarm:         '#D99632',
  overlayMid:       'rgba(0,0,0,0.5)',
} as const;

// ============================================================
// COLORS (Light & Dark)
// ============================================================

export const Colors = {
  light: {
    background: Palette.bg,
    backgroundWarm: Palette.bgWarm,
    surface: Palette.paper,
    surfaceElevated: '#FFFFFF',
    surfaceGlass: 'rgba(250,246,240,0.85)',
    surfaceTinted: 'rgba(200,90,66,0.06)',
    border: Palette.borderLight,
    borderWarm: Palette.borderWarm,
    text: Palette.ink,
    textSecondary: Palette.inkMuted,
    textFaint: Palette.inkFaint,
    tint: Palette.terracotta,
    tintDeep: Palette.terracottaDeep,
    tintSecondary: Palette.forest,
    tintWarm: Palette.amber,
    goldenHour: Palette.goldenHour,
    icon: Palette.inkMuted,
    tabIconDefault: Palette.inkFaint,
    tabIconSelected: Palette.terracotta,
    error: Palette.error,
    success: Palette.success,
    overlay: Palette.overlayLight,
  },
  dark: {
    background: Palette.charcoal,
    backgroundWarm: Palette.charcoal,
    surface: Palette.slate,
    surfaceElevated: Palette.slateElevated,
    surfaceGlass: 'rgba(20,18,16,0.85)',
    surfaceTinted: 'rgba(224,122,92,0.08)',
    border: Palette.borderDark,
    borderWarm: Palette.borderDarkWarm,
    text: Palette.snow,
    textSecondary: Palette.snowMuted,
    textFaint: '#7A7670',
    tint: '#E07A5C', // Terracotta luminosa per dark
    tintDeep: Palette.terracotta,
    tintSecondary: Palette.forestLight,
    tintWarm: Palette.goldenHour,
    goldenHour: '#E8C46A',
    icon: Palette.snowMuted,
    tabIconDefault: '#7A7670',
    tabIconSelected: '#E07A5C',
    error: '#E06C6C',
    success: '#6CE09D',
    overlay: Palette.overlayDark,
  }
};

// ============================================================
// SPACING
// ============================================================

export const Spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const;

// ============================================================
// RADIUS
// ============================================================

export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

// ============================================================
// FONTS (Google Fonts — loaded in _layout.tsx)
// ============================================================

export const Fonts = {
  serif: 'PlayfairDisplay_400Regular',
  serifSemiBold: 'PlayfairDisplay_600SemiBold',
  serifBold: 'PlayfairDisplay_700Bold',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
  handwritten: 'Caveat_400Regular',
  handwrittenBold: 'Caveat_600SemiBold',
} as const;

// ============================================================
// TYPOGRAPHY
// ============================================================

export const Typography = {
  // Serif — evocative headings
  display:      { fontFamily: Fonts.serifBold, fontSize: 36, fontWeight: '700' as const, lineHeight: 44, letterSpacing: -0.8 },
  h1:           { fontFamily: Fonts.serifBold, fontSize: 28, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.3 },
  h2:           { fontFamily: Fonts.serifSemiBold, fontSize: 22, fontWeight: '600' as const, lineHeight: 30, letterSpacing: 0 },
  h3:           { fontFamily: Fonts.serifSemiBold, fontSize: 18, fontWeight: '600' as const, lineHeight: 26, letterSpacing: 0 },

  // Sans — UI elements
  title:        { fontFamily: Fonts.sansSemiBold, fontSize: 16, fontWeight: '600' as const, lineHeight: 24, letterSpacing: 0.1 },
  body:         { fontFamily: Fonts.sans, fontSize: 16, fontWeight: '400' as const, lineHeight: 24, letterSpacing: 0 },
  bodySerif:    { fontFamily: Fonts.serif, fontSize: 16, fontWeight: '400' as const, lineHeight: 26, letterSpacing: 0 },
  bodySm:       { fontFamily: Fonts.sans, fontSize: 14, fontWeight: '400' as const, lineHeight: 20, letterSpacing: 0 },
  label:        { fontFamily: Fonts.sansSemiBold, fontSize: 14, fontWeight: '600' as const, lineHeight: 18, letterSpacing: 0.2 },
  caption:      { fontFamily: Fonts.sans, fontSize: 12, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0.3 },
  micro:        { fontFamily: Fonts.sansSemiBold, fontSize: 10, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 1.0 },

  // Handwritten — personal touches
  handwritten:    { fontFamily: Fonts.handwritten, fontSize: 18, lineHeight: 24, letterSpacing: 0 },
  handwrittenLg:  { fontFamily: Fonts.handwrittenBold, fontSize: 24, lineHeight: 30, letterSpacing: 0 },
} as const;

// ============================================================
// SHADOWS
// ============================================================

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#1A1714',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    default: { elevation: 3 },
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#1A1714',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.10,
      shadowRadius: 20,
    },
    default: { elevation: 6 },
  }),
  tabBar: Platform.select({
    ios: {
      shadowColor: '#1A1714',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    default: { elevation: 6 },
  }),
  glow: (color: string) => Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.30,
      shadowRadius: 12,
    },
    default: { elevation: 6 },
  }),
} as const;

// ============================================================
// GLASS
// ============================================================

export const Glass = {
  bg:           'rgba(250,246,240,0.88)',
  bgDark:       'rgba(20,18,16,0.82)',
  bgLight:      'rgba(250,246,240,0.12)',
  bgTint:       'rgba(200,90,66,0.08)',
  bgTeal:       'rgba(200,90,66,0.10)',
  border:       'rgba(26,23,20,0.06)',
  borderDark:   'rgba(240,235,225,0.10)',
  borderTeal:   'rgba(200,90,66,0.25)',
  storyBg:      'rgba(0,0,0,0.45)',
  storyBgLight: 'rgba(250,246,240,0.85)',
  storyBorder:  'rgba(240,235,225,0.15)',
} as const;

// ============================================================
// GLOW
// ============================================================

export const Glow = {
  terracotta: {
    shadowColor: Palette.terracotta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  golden: {
    shadowColor: Palette.goldenHour,
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
  // Legacy
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
} as const;

// ============================================================
// MOTION
// ============================================================

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
