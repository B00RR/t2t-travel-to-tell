# 🎨 T2T — Rinascita Grafica: "Terra Evolved"

**Concept:** Prendere il design system "Terra — Authentic Explorer" ed elevarlo a un'esperienza premium unica. Mantenere l'anima warm/earthy/organic ma renderla visivamente mozzafiato.

**Ispirazione:**
- **Polarsteps** — per le mappe animate e il diario di viaggio
- **Day One** — per la qualità della tipografia e l'esperienza di scrittura
- **Apple Journal** — per il glass/blur e le animazioni fluide
- **Roamy** — per il feed card e l'esplorazione
- **VSCO** — per la cura fotografica e il minimalismo premium
- **Monument Valley** — per le forme organiche e i colori earthy

---

## 1. TIPOGRAFIA — Da system a premium

### Attuale
- Serif: Georgia (system) — fredda, impersonale
- Sans: System — generica

### Nuova
| Token | Font | Weight | Uso |
|-------|------|--------|-----|
| `font.serif` | **Playfair Display** | 400/600/700 | Headlines evocativi, titoli diario |
| `font.sans` | **DM Sans** | 400/500/600/700 | UI, labels, body |
| `font.handwritten` | **Caveat** | 400/600 | Annotazioni, note personali, callouts |

**Perché:** Playfair ha le grazie eleganti di un diario cartaceo. DM Sans è geometrica e moderna. Caveat dà il tocco "scritto a mano" che rende l'app personale.

**Installazione:**
```bash
npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/dm-sans @expo-google-fonts/caveat expo-font
```

### Scala tipografica aggiornata
```typescript
Typography = {
  display:    { font: Playfair_700Bold, size: 36, line: 44, spacing: -0.8 },
  h1:         { font: Playfair_700Bold, size: 28, line: 36, spacing: -0.3 },
  h2:         { font: Playfair_600SemiBold, size: 22, line: 30, spacing: 0 },
  h3:         { font: Playfair_600SemiBold, size: 18, line: 26, spacing: 0 },
  title:      { font: DM_Sans_600SemiBold, size: 16, line: 24, spacing: 0.1 },
  body:       { font: DM_Sans_400Regular, size: 16, line: 24, spacing: 0 },
  bodySerif:  { font: Playfair_400Regular, size: 16, line: 26, spacing: 0 },
  bodySm:     { font: DM_Sans_400Regular, size: 14, line: 20, spacing: 0 },
  label:      { font: DM_Sans_600SemiBold, size: 14, line: 18, spacing: 0.2 },
  caption:    { font: DM_Sans_400Regular, size: 12, line: 16, spacing: 0.3 },
  micro:      { font: DM_Sans_600SemiBold, size: 10, line: 14, spacing: 1.0 },
  handwritten:{ font: Caveat_400Regular, size: 18, line: 24, spacing: 0 },
  handwrittenLg: { font: Caveat_600SemiBold, size: 24, line: 30, spacing: 0 },
}
```

---

## 2. PALETTE — Da Terra a "Terra Evolved"

### Principi
- Mantenere terracotta come primary ma arricchirla con gradienti
- Aggiungere texture organiche (noise, grain)
- Introdurre un accent "golden hour" per momenti speciali
- Dark mode: non invertito, ridisegnato con profondità

### Nuova palette completa

#### Brand
| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `terracotta` | `#C85A42` | `#E07A5C` | Primary action, tab selected |
| `terracottaDeep` | `#8B3A28` | `#C85A42` | Primary hover/pressed |
| `terracottaGlow` | `rgba(200,90,66,0.25)` | `rgba(224,122,92,0.35)` | Glow effects |
| `forest` | `#2D4A3E` | `#3B6B52` | Secondary |
| `forestDeep` | `#1A2D25` | `#2D4A3E` | Secondary hover |
| `goldenHour` | `#D4A853` | `#E8C46A` | Badge, achievement, special moments |
| `goldenHourGlow` | `rgba(212,168,83,0.30)` | `rgba(232,196,106,0.40)` | Badge glow |

#### Background & Surface
| Token | Light | Dark |
|-------|-------|------|
| `bg` | `#FAF6F0` | `#141210` |
| `bgWarm` | `#F5EDE3` | `#1C1916` |
| `surface` | `#FFFFFF` | `#201D1A` |
| `surfaceElevated` | `#FFFFFF` | `#2A2623` |
| `surfaceGlass` | `rgba(250,246,240,0.85)` | `rgba(20,18,16,0.85)` |
| `surfaceTinted` | `rgba(200,90,66,0.06)` | `rgba(224,122,92,0.08)` |

#### Text
| Token | Light | Dark |
|-------|-------|------|
| `text` | `#1A1714` | `#F0EBE1` |
| `textSecondary` | `#6B6560` | `#A8A098` |
| `textFaint` | `#9E9690` | `#7A7470` |
| `textInverse` | `#FAF6F0` | `#1A1714` |
| `textAccent` | `#C85A42` | `#E07A5C` |

#### Borders
| Token | Light | Dark |
|-------|-------|------|
| `border` | `rgba(26,23,20,0.08)` | `rgba(240,235,225,0.08)` |
| `borderWarm` | `rgba(200,90,66,0.15)` | `rgba(224,122,92,0.20)` |
| `borderStrong` | `rgba(26,23,20,0.15)` | `rgba(240,235,225,0.15)` |

---

## 3. ANIMAZIONI — Microinteractions everywhere

### 3.1 Feed Cards
```typescript
// Staggered entry — ogni card appare con delay progressivo
entering={FadeInUp.delay(index * 80).duration(400).easing(Easing.out(Easing.ease))}

// Like animation — cuore che "esplode"
const heartScale = useSharedValue(1);
const onLike = () => {
  heartScale.value = withSequence(
    withSpring(1.4, { damping: 4, stiffness: 300 }),
    withSpring(1, { damping: 8, stiffness: 200 })
  );
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

// Swipe to save — card si sposta a destra con icona bookmark
const swipeX = useSharedValue(0);
const panGesture = Gesture.Pan()
  .onUpdate((e) => { swipeX.value = Math.max(0, e.translationX); })
  .onEnd(() => { swipeX.value = withSpring(0); });
```

### 3.2 Tab Bar — Morphing premium
- Icone che "respirano" (leggero scale pulse quando attive)
- Indicatore sotto la tab attiva: linea terracotta con glow
- Transizione crossfade tra icone outline/fill
- Haptic su ogni tap

### 3.3 Parallax Scroll
```typescript
// Header che collassa su scroll
const scrollY = useSharedValue(0);
const headerStyle = useAnimatedStyle(() => ({
  opacity: interpolate(scrollY.value, [0, 150], [1, 0], Extrapolation.CLAMP),
  transform: [{ scale: interpolate(scrollY.value, [0, 150], [1, 0.9], Extrapolation.CLAMP) }],
}));
```

### 3.4 Page Transitions
- Push: slide da destra con shadow progressivo
- Modal: slide up con spring physics
- Tab switch: crossfade leggero (200ms)
- Back: slide a destra + fade

### 3.5 Skeleton Loading
```typescript
// Shimmer con colori Terra
<Skeleton 
  colors={['#EAE4D9', '#F4F0EA', '#EAE4D9']}
  duration={1500}
/>
```

### 3.6 Pull to Refresh
- Indicatore custom: cerchio terracotta che "gira" con spring
- Progress bar circolare invece del classico spinner

---

## 4. GESTURE MAP

### Home Feed
| Gesture | Azione | Feedback |
|---------|--------|----------|
| Scroll verticale | Naviga feed | Header collapse (parallax) |
| Pull down | Refresh | Custom spring indicator |
| Swipe right su card | Salva diario | Bookmark icon slide + haptic |
| Swipe left su card | Like | Heart pop + haptic |
| Tap card | Dettaglio diario | Push transition |
| Long press card | Context menu (Share, Save, Report) | Haptic heavy |
| Double tap card | Like rapido | Heart burst animation |

### Explore
| Gesture | Azione | Feedback |
|---------|--------|----------|
| Scroll feed | Naviga risultati | Staggered entry |
| Pinch su mappa | Zoom | — |
| Tap pin mappa | Info diario | Bottom sheet spring |
| Swipe orizzontale filtri | Scorri categorie | Smooth scroll |
| Pull down | Refresh | Custom indicator |

### Diary Detail
| Gesture | Azione | Feedback |
|---------|--------|----------|
| Scroll verticale | Leggi contenuto | Parallax hero |
| Double tap | Like | Heart burst |
| Swipe su foto | Gallery | Swipe carousel |
| Long press entry | Opzioni (Edit, Delete) | Haptic heavy |
| Pull down | Torna indietro | Dismiss gesture |

### Map
| Gesture | Azione | Feedback |
|---------|--------|----------|
| Pan (1 dito) | Muovi mappa | — |
| Pinch (2 dita) | Zoom | — |
| Double tap | Zoom in | — |
| Tap pin | Info bottom sheet | Spring snap |
| Tap cluster | Zoom + espandi | Animation |

---

## 5. ICONE & SIMBOLI

### Strategia
- **iOS:** SF Symbols dove possibile (native, performanti)
- **Android:** Ionicons (già usato) + icone custom SVG per elementi unici
- **Stile:** Line icons (outline) di default, fill quando attive

### Tab Icons
| Tab | Default | Active | Stile |
|-----|---------|--------|-------|
| Home | `home-outline` | `home` | Ionicons |
| Explore | `compass-outline` | `compass` | Ionicons |
| Create | `add-circle-outline` | `add-circle` | Ionicons (accent terracotta) |
| Map | `map-outline` | `map` | Ionicons |
| Profile | `person-outline` | `person` | Ionicons |

### Icone speciali
- **Like:** Cuore con terracotta fill + glow
- **Save:** Bookmark con forest fill
- **Share:** Freccia condividi (outline)
- **Badge:** Custom SVG con golden hour fill + glow
- **Travel:** Aereo, valigia, passaporto — icone custom

---

## 6. COMPONENTI — Redesign

### 6.1 Card (FeedDiaryCard, ExploreDiaryCard)
- **Attuale:** Card piatta con shadow sottile
- **Nuovo:** Card con:
  - Border sottile terracotta (1px)
  - Shadow organico (multi-layer)
  - Cover image con gradient overlay bottom
  - Location tag con icona location + testo
  - Author avatar con border terracotta
  - Social stats (like, comment, save) con icone animate
  - Press scale effect (0.98)

### 6.2 Tab Bar (MorphingTabBar)
- **Attuale:** Tab bar con indicatori
- **Nuovo:** Tab bar premium:
  - Floating design (non attaccata al bordo)
  - Glass background con tinta warm
  - Icone che morphano outline→fill con spring
  - Badge notifiche con golden hour glow
  - Create button: FAB centrale leggermente elevated

### 6.3 Header
- **Attuale:** Header piatto
- **Nuovo:** Header con parallax:
  - Transparente su scroll top → glass su scroll
  - Titolo che scala su scroll
  - Search bar glass con icona search

### 6.4 Profile
- **Attuale:** Profile base
- **Nuovo:** Profile premium:
  - Avatar grande con border terracotta + glow
  - Stats con numeri animati (counter up)
  - Passport card con texture carta
  - Badge grid con golden hour glow su unlocked
  - Diario grid con cover images

### 6.5 Map
- **Attuale:** MapView Google Maps base
- **Nuovo:** Map premium:
  - Custom map style (warm tones)
  - Pin custom con terracotta + glow
  - Cluster animato
  - Bottom sheet con snap points
  - Carosello diari sopra la mappa

### 6.6 Notifications
- **Attuale:** Lista base
- **Nuovo:** Notifiche premium:
  - Card con glass background
  - Avatar + azione + timestamp
  - Swipe to dismiss
  - Unread indicator con glow

---

## 7. DARK MODE — Redesign completo

### Principi
- Non invertire i colori — ridisegnare
- Background: nero caldo (#141210) non puro
- Surface: grigio caldo (#201D1A)
- Text: avorio (#F0EBE1) non bianco
- Accent: terracotta più luminosa (#E07A5C)
- Glass: tinta warm invece di bianco

### Differenze chiave
| Elemento | Light | Dark |
|----------|-------|------|
| Background | `#FAF6F0` (warm paper) | `#141210` (warm black) |
| Surface | `#FFFFFF` | `#201D1A` (warm charcoal) |
| Glass | `rgba(250,246,240,0.85)` | `rgba(20,18,16,0.85)` |
| Terracotta | `#C85A42` | `#E07A5C` (più luminosa) |
| Border | `rgba(26,23,20,0.08)` | `rgba(240,235,225,0.08)` |
| Shadow | nero sottile | nero profondo |

---

## 8. MICRO-INTERACTIONS SPECIALI

### 8.1 Passport Card Animation
- Quando l'utente apre il passport, le pagine "sfogliano" con animazione
- Ogni badge sbloccato ha un effetto "timbro" che appare con spring

### 8.2 Diary Creation Flow
- Ogni step del wizard ha una transizione fluida
- Il campo di input "cresce" quando l'utente scrive
- Il pulsante "Crea" ha un effetto glow terracotta

### 8.3 Travel Stats Counter
- I numeri nelle stats (paesi, città, giorni) animano con counter-up
- Ogni cifra "ruota" come un odometer

### 8.4 Story Card
- Ken Burns effect sulle foto (zoom lento)
- Progress bar con gradient terracotta→golden
- Swipe up per dettaglio, swipe left per prossima

### 8.5 Mood Picker
- Le emoji "galleggiano" quando selezionate
- Haptic feedback su ogni selezione
- Background si tinta con il colore del mood

### 8.6 Empty States
- Illustrazione animata (es. bussola che gira)
- Testo in font handwritten (Caveat)
- CTA con glow terracotta

---

## 9. FONT LOADING & PERFORMANCE

### Strategia
```typescript
// app/_layout.tsx
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Caveat_400Regular, Caveat_600SemiBold } from '@expo-google-fonts/caveat';

const [fontsLoaded] = useFonts({
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  Caveat_400Regular,
  Caveat_600SemiBold,
});
```

### Splash screen
- Mantenere splash fino a font loaded
- Splash: background warm (#FAF6F0) + logo centrato

---

## 10. PRIORITÀ DI IMPLEMENTAZIONE

### Phase 1 — Foundation (3 giorni)
1. Installare Google Fonts
2. Aggiornare theme.ts con nuova palette
3. Aggiornare Typography con nuovi font
4. Fixare i 94 errori TypeScript (Palette legacy → useAppTheme)

### Phase 2 — Core Components (5 giorni)
5. Redesign Card components (FeedDiaryCard, ExploreDiaryCard, ProfileDiaryCard)
6. Redesign MorphingTabBar (floating, glass, morph animations)
7. Redesign Header (parallax, glass)
8. Aggiungere Skeleton loading premium

### Phase 3 — Animations (4 giorni)
9. Feed staggered entry
10. Like/save animations
11. Parallax scroll
12. Pull-to-refresh custom
13. Page transitions

### Phase 4 — Gestures (3 giorni)
14. Swipe actions su card
15. Long press context menu
16. Double tap to like
17. Gestures su diary detail

### Phase 5 — Screens (5 giorni)
18. Home feed redesign
19. Explore redesign
20. Profile redesign
21. Map redesign
22. Notifications redesign

### Phase 6 — Polish (3 giorni)
23. Dark mode premium
24. Empty states animate
25. Micro-interactions speciali
26. Accessibility audit

**Totale stimato: ~23 giorni**

---

*Piano creato per la rinascita grafica di T2T Travel to Tell*
*Basato sul codice reale: Expo SDK 54 + Supabase + TypeScript*
