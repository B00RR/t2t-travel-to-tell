# T2T Travel to Tell — Analisi Completa del Progetto

> **Data:** 26 Marzo 2026  
> **Directory:** `/home/b00r/.openclaw/workspace/t2t-project/t2t-app/`  
> **Versione:** 1.0.0

---

## 1. Stack Tecnico

| Layer | Tecnologia | Versione |
|---|---|---|
| **Framework** | Expo SDK 54 (New Architecture) | ~54.0.33 |
| **Language** | TypeScript | ~5.9.2 |
| **React** | React 19 + React Native | 19.1.0 / 0.81.5 |
| **Routing** | Expo Router v6 (file-based) | ~6.0.23 |
| **Navigation** | React Navigation v7 (bottom-tabs + native) | ^7.4.0 / ^7.1.8 |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Storage) | ^2.99.2 |
| **Maps** | react-native-maps (Google Maps) | 1.20.1 |
| **3D Globe** | @react-three/fiber + Three.js | ^9.5.0 / ^0.183.2 |
| **Animation** | react-native-reanimated + react-native-worklets | ~4.1.1 / 0.5.1 |
| **Gestures** | react-native-gesture-handler | ~2.28.0 |
| **i18n** | i18next + react-i18next + expo-localization | ^25.8.18 / ^16.5.8 / ~17.0.8 |
| **Image Handling** | expo-image, expo-image-picker, expo-image-manipulator | multiple |
| **Video** | expo-video + expo-video-thumbnails | ~3.0.16 / ~10.0.8 |
| **Location** | expo-location | ~19.0.8 |
| **Storage** | expo-secure-store (token storage) | ~15.0.8 |
| **Validation** | validator.js | ^13.15.26 |
| **Linting** | ESLint 9 + expo config | ^9.25.0 |
| **Testing** | Jest 29 + @testing-library/react-native 13 + jest-expo | ^29.7.0 / ^13.3.3 |

### Variabili d'Ambiente (`.env.example`)
```
EXPO_PUBLIC_SUPABASE_URL          # URL Supabase project
EXPO_PUBLIC_SUPABASE_ANON_KEY     # Supabase anon key
EXPO_PUBLIC_PEXELS_API_KEY        # Pexels API per stock photos
GOOGLE_MAPS_API_KEY               # Google Maps (iOS/Android)
```

### Configurazione Notabile (`app.config.js`)
- **Scheme:** `t2tapp` (deep linking)
- **Owner:** `b00r`
- **New Architecture:** abilitata (`newArchEnabled: true`)
- **React Compiler:** abilitato (`reactCompiler: true`)
- **Typed Routes:** abilitato (`experiments.typedRoutes: true`)
- **EAS Project ID:** `6e2b1264-ba9e-4185-9b04-57b688492d45`
- **Android Package:** `com.b00rr.t2ttraveltotell`
- **Orientation:** portrait only
- **Splash screen:** bianco con icona centrata, dark mode nero

---

## 2. Struttura delle Route (Expo Router)

```
app/
├── _layout.tsx                    # Root layout — GestureHandler + AuthProvider + auth redirect
├── (auth)/
│   ├── _layout.tsx                # Stack navigator (no headers)
│   ├── login.tsx                  # Login screen (email + password)
│   └── register.tsx               # Registration screen (username + email + password)
└── (app)/
    ├── _layout.tsx                # App Stack (no headers)
    ├── (tabs)/
    │   ├── _layout.tsx            # 5 tabs con MorphingTabBar custom
    │   ├── index.tsx              # HOME — Feed (discover / following tabs)
    │   ├── explore.tsx            # EXPLORE — Browse/search/map mode/trending
    │   ├── create.tsx             # CREATE — Crea nuovo diario
    │   ├── map.tsx                # MAP — Mappe personali (mine) / pubbliche (discover)
    │   ├── profile.tsx            # PROFILE — Profilo, diari, passport, badges
    │   └── planner.tsx            # PLANNER — Trip Plans (nascosto dal tab bar, href: null)
    ├── diary/
    │   ├── [id].tsx               # Dettaglio diario (visualizzazione + social)
    │   ├── add-day.tsx            # Aggiungi giorno al diario (modal)
    │   └── day/
    │       └── [day_id].tsx       # Dettaglio giorno (entries CRUD)
    ├── notifications.tsx          # Lista notifiche
    ├── planner/
    │   ├── [id].tsx               # Dettaglio trip plan
    │   ├── create.tsx             # Creazione trip plan
    │   └── buddies.tsx            # Travel buddies
    ├── profile/
    │   └── [id].tsx               # Profilo pubblico di altri utenti
    └── settings.tsx               # Impostazioni
```

### Schermate Implementate (21 route totali)
| Screen | File | Funzione |
|---|---|---|
| **Login** | `(auth)/login.tsx` | Email/password login con Supabase Auth |
| **Register** | `(auth)/register.tsx` | Registrazione con username |
| **Home Feed** | `(tabs)/index.tsx` | Feed diari: discover (pubblici) + following (seguiti), pull-to-refresh, comment modal |
| **Explore** | `(tabs)/explore.tsx` | Browse con filtri (sort recent/popular/trending, durata), search debounce, mappa, 3D globe |
| **Create Diary** | `(tabs)/create.tsx` | Form: titolo, descrizione, destinazioni, crea draft |
| **Map** | `(tabs)/map.tsx` | MapView Google Maps con markers, mode mine/discover, fitToCoordinates, geolocation |
| **Profile** | `(tabs)/profile.tsx` | Profilo utente: edit bio/avatar/username, diari miei e salvati, passport card, badges, stats |
| **Planner** | `(tabs)/planner.tsx` | Trip Plans: miei / discover, accesso via navigator (non tab bar) |
| **Diary Detail** | `diary/[id].tsx` | Visualizzazione completa diario con days, social (like/save/comment), share |
| **Add Day** | `diary/add-day.tsx` | Aggiunge giorno al diario (modal) |
| **Day Detail** | `diary/day/[day_id].tsx` | CRUD entries per giorno: testo, tip, location, mood, foto, video |
| **Notifications** | `notifications.tsx` | Lista notifiche real-time (like, comment, follow) |
| **Trip Plan Detail** | `planner/[id].tsx` | Dettaglio piano: stops, checklist, budget |
| **Create Trip Plan** | `planner/create.tsx` | Creazione piano (da zero o da diario) |
| **Buddies** | `planner/buddies.tsx` | Travel buddies |
| **Profile [id]** | `profile/[id].tsx` | Profilo pubblico di altri utenti |
| **Settings** | `settings.tsx` | Impostazioni |

---

## 3. Componenti Esistenti (38 componenti)

### Componenti UI Base
| Component | File | Funzione |
|---|---|---|
| `Button` | `ui/Button.tsx` | Bottone con loading, disabled, accessibility, variants |
| `Input` | `ui/Input.tsx` | Input con label, error message, helperText, accessibility |
| `collapsible` | `ui/collapsible.tsx` | Sezione collapsible |
| `icon-symbol` | `ui/icon-symbol.tsx` / `.ios.tsx` | Icon handling per platform |
| `haptic-tab` | `haptic-tab.tsx` | Tab con haptic feedback |
| `parallax-scroll-view` | `parallax-scroll-view.tsx` | ScrollView con effetto parallasse |
| `themed-text` | `themed-text.tsx` | Text con theming |
| `themed-view` | `themed-view.tsx` | View con theming |
| `external-link` | `external-link.tsx` | Link esterno |
| `hello-wave` | `hello-wave.tsx` | Animazione onda |

### Componenti Feature
| Component | Funzione |
|---|---|
| `FeedDiaryCard` | Card diario nel feed home |
| `ExploreDiaryCard` | Card diario nella sezione explore |
| `ProfileDiaryCard` | Card diario nel profilo |
| `EntryCard` | Card per singola entry (text/tip/mood/photo/video/location) |
| `DayChapter` | Capitolo giornaliero con entries ordinate |
| `CommentsModal` | Modal per commenti su un diario |
| `CommentItem` | Singolo commento |
| `MoodPickerModal` | Picker per mood (10 emoji) |
| `AddEntryForm` | Form per aggiungere entry (text/tip/location) |
| `EditEntryModal` | Modal per editare entry |
| `ProfileHeader` | Header profilo con avatar, bio, stats |
| `PassportCard` | "Passport" digitale con badge/stamps |
| `BadgesSection` | Sezione badge/achievement |
| `TravelStats` | Statistiche di viaggio |
| `JourneyMap` | Mappa del percorso di viaggio |
| `JourneyProgressBar` | Progress bar del viaggio |
| `InteractiveGlobe` | Globo 3D interattivo (Three.js) |
| `WanderlustMap` | Mappa per explore |
| `MapDiaryCarousel` | Carosello diari sulla mappa |
| `DiaryMapCover` | Copertura mappa per diario |
| `CompassRandomizer` | Bussola randomizzatrice |
| `KenBurnsImage` | Effetto Ken Burns su immagini |
| `ImmersiveStoryCard` | Card stile story immersivo |
| `StoryProgressBar` | Progress bar per stories |
| `AnimatedHeartOverlay` | Overlay animato cuore per like |
| `SocialActionBar` | Barra azioni social (like, comment, share, save) |
| `PeopleToFollow` | Suggerimenti "persone da seguire" |
| `TripPlanCard` | Card trip plan |
| `TripPlanStopItem` | Item singolo stop nel trip plan |
| `BudgetSection` | Sezione budget nel trip plan |
| `ChecklistSection` | Sezione checklist |
| `CoverImagePicker` | Picker per immagine di copertina |
| `RichTextInput` | Input con formattazione base (bold, italic, quote) |
| `RichTextRenderer` | Renderer per contenuto formattato |
| `Skeleton` | Skeleton loading placeholders |
| `VideoEntryCard` | Card per entry video |
| `MorphingTabBar` | Tab bar custom animata (5 tabs) |

---

## 4. Custom Hooks (17 hooks)

| Hook | Funzione |
|---|---|
| `useAuth` | Context provider per sessione Supabase Auth (session, user, loading) |
| `useAppTheme` | Hook per tema light/dark con design tokens Terra |
| `useDayEntries` | CRUD completo per entries di un giorno (fetch, add, update, delete, move, sort, signed URLs) |
| `useComments` | CRUD commenti con join profiles |
| `useDiarySocial` | Toggle like/save con optimistic update + haptic feedback + rollback |
| `useFollow` | Toggle follow/unfollow con optimistic update |
| `useMediaUpload` | Upload foto/video: compressione, thumbnail, Supabase Storage, auto-cover |
| `useUserProfile` | Fetch/update profilo, upload avatar, check username uniqueness |
| `useMapLocations` | Fetch locations utente via RPC Supabase |
| `usePublicMapLocations` | Fetch locations pubbliche (diari pubblici, 3 query cascade) |
| `useClusteredLocations` | Clustering grid-based per locations mappa (5° grid cell) |
| `useTripPlans` | Fetch trip plans utente e pubblici |
| `useCreateTripPlan` | Creazione piano: manuale, da diario, clone (via RPC) |
| `useTripPlanDetail` | CRUD completo per trip plan (stops, checklist, budget) |
| `useNotifications` | Notifiche real-time con Supabase Realtime, mark read |
| `useStockImages` | Ricerca stock photos via Pexels API |
| `useColorScheme` / `useThemeColor` | Color scheme da sistema (wrapper nativo) |

---

## 5. Database Schema (Supabase)

### Tabelle Identificate dal Codice

#### `profiles`
- `id` (UUID, FK to auth.users)
- `username` (string, unique)
- `display_name` (string)
- `avatar_url` (string)
- `bio` (string)
- `preferred_language` (string)
- `travel_style` (string)
- `stats` (JSON)
- `created_at` (timestamp)

#### `diaries`
- `id` (UUID)
- `author_id` (FK → profiles)
- `title`, `description`
- `cover_image_url`
- `visibility` (public/private)
- `start_date`, `end_date`
- `status` (draft/published)
- `destinations` (string[])
- `tags` (string[])
- `budget_summary` (JSON)
- `like_count`, `comment_count`, `save_count`, `view_count` (denormalized counters)
- `created_at`

#### `diary_days`
- `id` (UUID)
- `diary_id` (FK → diaries)
- `day_number`
- `title`
- `date`

#### `day_entries`
- `id` (UUID)
- `day_id` (FK → diary_days)
- `type` (text/media/tip/location/mood/photo/video)
- `content` (text/emoji/url)
- `metadata` (JSON — discriminato per tipo)
- `sort_order`

#### `comments`
- `id` (UUID)
- `user_id` (FK → profiles)
- `diary_id` (FK → diaries)
- `content`
- `parent_id` (nullable, self-ref per threaded)
- `created_at`

#### `likes`
- `user_id` (FK → profiles)
- `diary_id` (FK → diaries)
- `created_at`

#### `saves`
- `user_id` (FK → profiles)
- `diary_id` (FK → diaries)
- `created_at`

#### `follows`
- `follower_id` (FK → profiles)
- `following_id` (FK → profiles)
- `created_at`

#### `notifications`
- `id` (UUID)
- `user_id` (FK → profiles)
- `actor_id` (FK → profiles)
- `type` (like/comment/follow)
- `target_id`
- `is_read` (boolean)
- `created_at`

#### `trip_plans`
- `id` (UUID)
- `author_id` (FK → profiles)
- `source_diary_id` (nullable FK → diaries)
- `title`, `description`, `cover_image_url`
- `destinations` (string[])
- `start_date`, `end_date`
- `visibility` (public/private/friends)
- `budget_estimate` (JSON)
- `clone_count`
- `created_at`, `updated_at`

#### `trip_plan_stops`
- `id` (UUID)
- `trip_plan_id` (FK → trip_plans)
- `day_number`, `title`, `location_name`, `notes`
- `sort_order`
- `created_at`

#### `trip_plan_checklist_items`
- `id` (UUID)
- `trip_plan_id` (FK → trip_plans)
- `category` (documents/gear/accommodation/transport/general)
- `label`
- `is_checked` (boolean)
- `sort_order`

#### `diary_locations`
- Salvate via RPC `insert_diary_location`
- Campi: `diary_id`, `day_id`, `name`, `lat`, `lng`

### RPC Functions (identificate dal codice)
- `get_user_map_locations(p_user_id)` — locations per utente
- `insert_diary_location(p_diary_id, p_day_id, p_name, p_lat, p_lng)` — inserimento location
- `clone_trip_plan(source_plan_id, new_author_id)` — clona un trip plan

### Storage Buckets
- `diary-media` — foto e video dei diari
- `avatars` — avatar utente

---

## 6. Stile Grafico (Design System "Terra — Authentic Explorer")

### Palette Colori
| Nome | Hex | Uso |
|---|---|---|
| **terracotta** | `#C85A42` | Colore primario (warm, grounded) |
| **terracottaDim** | `#A64832` | Primario scurito |
| **forest** | `#2D4A3E` | Secondario (forest green) |
| **forestLight** | `#3B6051` | Forest chiaro |
| **sand** | `#EAE4D9` | Sfondo paper-like |
| **sandLight** | `#F4F0EA` | Sfondo chiaro |
| **amber** | `#D99632` | Highlight/accent |
| **ink** | `#1F1E1D` | Testo primario |
| **inkMuted** | `#5A5855` | Testo secondario |
| **inkFaint** | `#8C8883` | Testo mutato |
| **paper** | `#FAFAFA` | Sfondo superficie |
| **charcoal** | `#161615` | Dark mode background |
| **slate** | `#242322` | Dark mode surface |
| **snow** | `#F0EBE1` | Dark mode text |
| **error** | `#C84242` | Errore |
| **success** | `#42C87A` | Successo |
| **warning** | `#D99632` | Warning |
| **info** | `#42A1C8` | Info |

### Typography
| Style | Font | Size | Weight | Note |
|---|---|---|---|---|
| `display` | Serif (Georgia) | 32 | 700 | Titoli evocativi |
| `h1` | Serif | 24 | 700 | Heading principale |
| `h2` | Serif | 18 | 600 | Heading secondario |
| `title` | Sans (System) | 16 | 600 | Titoli UI |
| `body` | Serif | 16 | — | Testo corpo |
| `bodySm` | Sans | 14 | 400 | Testo piccolo |
| `label` | Sans | 14 | 600 | Labels |
| `caption` | Sans | 12 | — | Didascalie |
| `micro` | Sans | 10 | 600 | Micro testo |

**Approccio:** Serif per heading evocativi/testi narrativi (stile "diario"), sans-serif per UI/labels. Sistema dual-font con fallback platform.

### Spacing
Scala: 4 / 8 / 16 / 24 / 32 / 48 / 64

### Border Radius
Scala: 4 / 8 / 12 / 16 / 24 / 9999 (full)

### Shadows
3 livelli: `card` (subtle), `elevated` (media), `tabBar` (bottom), + `glow(color)` dinamico

### Glass Effect
Vari stili per overlay semi-trasparenti (`bg`, `bgDark`, `bgTint`, `border`, `storyBg`)

### Motion
Spring presets: `normal`, `snappy`, `bouncy`, `morph`  
Durations: 150ms (fast), 300ms (normal), 450ms (slow)

### Legacy Mappings
Il sistema ha legacy aliases (teal → terracotta, navy → forest, orange → amber) che sono stati parzialmente usati nei vecchi componenti.

---

## 7. Internationalization

- **Lingue supportate:** Inglese (`en`) + Italiano (`it`)
- **Library:** i18next + react-i18next
- **Auto-detect:** da `expo-localization` (lingua device)
- **Persistenza:** `preferred_language` nel profilo utente (sync in profile.tsx)
- **Pattern:** tutti i componenti usano `useTranslation()` con chiavi dotted (es. `common.error`, `day.new_text`)

---

## 8. Funzionalità Implementate vs Mancanti

### ✅ Implementate
1. **Auth:** Login + registrazione email/password via Supabase
2. **Diary CRUD:** Creazione diario (draft), visualizzazione, feed pubblico
3. **Day management:** Aggiunta giorni al diario
4. **Day Entries CRUD:** Testo, tip, location (con geocoding), mood (10 emoji), foto (con compressione), video (con thumbnail)
5. **Media upload:** Compressione immagini (max 1920px, 0.7 quality), upload Supabase Storage, auto-cover image
6. **Social:** Like, save, commenti (threaded), follow/unfollow
7. **Feed:** Home feed discover + following, explore con filtri (sort, durata, search debounce)
8. **Map:** Google Maps con markers, mode mine/discover, geolocation, fitToCoordinates
9. **3D Globe:** InteractiveGlobe con Three.js per explore
10. **Trip Plans:** CRUD completo, stops, checklist, budget, clone from diary, clone from public
11. **Notifications:** Real-time con Supabase Realtime (like, comment, follow)
12. **Profile:** Edit bio/avatar/username, diari salvati, passport card, badges, travel stats
13. **i18n:** Italiano + Inglese con auto-detect
14. **Theme:** Light/dark mode con design system completo
15. **Tab Bar:** Custom MorphingTabBar animata con haptic feedback
16. **Accessibility:** Button e Input con accessibility states corretti

### ⚠️ Parziali / Limitate
1. **Search:** Solo debounce su titolo diari in explore, no full-text search
2. **Comments:** CRUD base, manca edit commenti, nested threading limitato
3. **Budget:** Schema JSON definito, UI BudgetSection esiste ma logica avanzata non verificata
4. **Badges:** Componente esiste, logica achievement probabilmente mockata
5. **Travel buddies:** Schermata esiste ma funzionalità potenzialmente basica
6. **Rich text:** RichTextInput/RichTextRenderer esistono (bold, italic, quote) ma funzionalità limitata

### ❌ Mancanti
1. **Push notifications** (solo realtime in-app, no expo-notifications)
2. **Offline support / caching** (nessun offline-first, no TanStack Query, no persisted cache)
3. **Edit diary** (modifica titolo/descrizione/visibility dopo creazione)
4. **Delete diary** (distruttiva, non visibile nel codice analizzato)
5. **Image gallery / lightbox** (visualizzazione foto fullscreen)
6. **Video player avanzato** (solo VideoView base)
7. **Share / deep linking** (Share API usata, ma schema deep link gestito parzialmente)
8. **Dark mode toggle** (solo automatico da sistema)
9. **Error boundary avanzato** (solo ErrorBoundary base di Expo)
10. **Analytics / tracking** (nessuna integrazione)
11. **Rate limiting / spam protection** (nessun client-side check)
12. **MFA / 2FA** (solo email/password)
13. **Social login** (no Google/Apple sign-in)

---

## 9. Problemi e Errori Noti

### Errori TypeScript (94 righe in `ts_errors.txt`)

#### Errore CRITICO: Incompatibilità Palette Legacy vs Nuovo Design System
**~60 errori** causati da componenti che usano proprietà legacy della `Palette` (es. `bgPrimary`, `bgSurface`, `bgElevated`, `textPrimary`, `textSecondary`, `textMuted`, `border`, `overlayMid`) invece delle nuove proprietà del `Colors` object. Il `Palette` ha mantenuto le chiavi legacy come mapping ma i componenti importano `Palette` direttamente invece di usare `useAppTheme()`.

**File colpiti:**
- `app/(app)/(tabs)/map.tsx` — ~15 errori (`bgPrimary`, `textSecondary`, `bgElevated`, `border`, `textPrimary`, `overlayMid`)
- `app/(app)/(tabs)/planner.tsx` — ~12 errori (stesso pattern)
- `app/(app)/diary/[id].tsx` — ~5 errori
- `components/DayChapter.tsx` — ~5 errori
- `components/EntryCard.tsx` — ~7 errori
- `components/ProfileHeader.tsx` — ~15 errori
- `components/FeedDiaryCard.tsx` — 1 errore
- `components/ImmersiveStoryCard.tsx` — 1 errore

**Root cause:** Questi componenti importano `Palette` e accedono a chiavi come `Palette.bgPrimary` che in realtà esistono in `Palette` come legacy mapping, ma TypeScript li vede come non esistenti perché le chiavi sono definite nel body ma forse il type inference non le include o l'import usa un subset destrutturato.

#### `Typography.h3` non esiste (3 errori)
- `app/(app)/(tabs)/index.tsx:351`
- `app/(app)/(tabs)/profile.tsx:736`
- `components/FeedDiaryCard.tsx:194`

La proprietà `h3` esiste nel type `Typography` ma TypeScript non la riconosce — possibile errore di `as const` narrowing.

#### `Colors.light.tintWarm` non esiste (1 errore)
- `components/InteractiveGlobe.tsx:65` — usa `colors.tintWarm` che non esiste nell'object `Colors.light`

#### `CommentsModal` non importato (1 errore)
- `app/(app)/(tabs)/index.tsx:248` — riferimento a `CommentsModal` che non viene importato nel file (ma il componente esiste)

#### `EntryCardProps` mancante props (1 errore)
- `components/DayChapter.tsx:137` — `onPress` e `onLongPress` mancanti nelle props

#### `Skeleton.tsx` — `theme` non esiste su `AppTheme` (2 errori)
- `components/Skeleton.tsx:13,44` — accede a `theme.theme` che non è una proprietà di `AppTheme`

#### `KenBurnsImage.tsx` — Type mismatch (1 errore)
- Errore di compatibilità tra `ViewStyle` e animated style type in Reanimated

#### `three` module declaration missing (1 errore)
- `components/InteractiveGlobe.tsx:4` — `@types/three` è installato ma la dichiarazione non viene trovata (path issue: `C:/Users/loren/...` suggerisce path Windows)

### Problemi Architetturali

1. **No data layer / state management:** Tutto è fetch diretto da componenti/screens. Non c'è TanStack Query, Redux, Zustand, o altro state manager. Ogni screen fa le proprie query Supabase in `useCallback`/`useEffect`.

2. **Duplicazione query:** Query simili sono fatte in più punti (es. feed fetch in home + explore, profile fetch in multiple screens).

3. **No caching:** Ogni navigazione ri-fetch tutto. Pull-to-refresh è l'unico refresh mechanism.

4. **Legacy color mapping fragile:** I commenti nel theme dicono "Legacy mappings for older components" ma molti componenti recenti usano ancora `Palette.xxx` invece di `useAppTheme()`.

5. **Map.tsx usa `Palette` diretto** invece di `useAppTheme()` — non supporta dark mode correttamente.

6. **Hardcoded strings:** Alcune stringhe non sono tradotte (es. "Start documenting your next adventure" in create.tsx, "Share your journeys with the world" in login/register).

7. **i18n inconsistente:** Alcuni Alert usano chiavi i18n, altri usano stringhe hardcoded italiane (es. `useComments.ts` ha "Elimina", "Vuoi eliminare questo commento?", "Impossibile pubblicare il commento").

---

## 10. Stato dei Test

### Configurazione Jest
- Preset: `jest-expo`
- Setup: `@testing-library/jest-native/extend-expect` + `jest/setupI18n.js`
- Module alias: `@/` → `<rootDir>/`

### Test Files (11 total)

#### Hooks (6 test files)
| Test | Coverage |
|---|---|
| `useComments.test.ts` | addComment empty guard, Supabase call prevention |
| `useDayEntries.test.ts` | init defaults, fetch entries, signed URL resolution, error handling, add entry, storage error |
| `useDiarySocial.test.ts` | initial state, skip if no userId, set hasLiked/hasSaved, error graceful handling, toggleLike rollback |
| `useFollow.test.ts` | init, check follow status, error handling, auth required, self-follow guard, follow/unfollow optimistic, error rollback |
| `useMediaUpload.test.ts` | image compression, video thumbnail, dual upload, extension fallback (.php→.mp4), thumbnail failure, upload error alert |
| `useUserProfile.test.ts` | fetch profile, error handling, update profile, update error, avatar upload error, username uniqueness |

#### Components (5 test files)
| Test | Coverage |
|---|---|
| `AddEntryForm.test.tsx` | render text/tip/location, onChangeText, onSave, onCancel, disabled empty, saving state |
| `EntryCard.test.tsx` | render text/tip/mood/video, onPress callback |
| `MoodPickerModal.test.tsx` | render visible, onSelect callback, onClose callback |
| `Button.spec.tsx` | render title, loading state, disabled state, onPress, no fire when disabled/loading |
| `Input.spec.tsx` | render label/input, error vs helperText, onChangeText, onFocus/onBlur |

#### Components Non Testati (30+ componenti)
Nessun test per: FeedDiaryCard, ExploreDiaryCard, ProfileDiaryCard, DayChapter, CommentsModal, ProfileHeader, PassportCard, MorphingTabBar, InteractiveGlobe, WanderlustMap, KenBurnsImage, SocialActionBar, TripPlanCard, BudgetSection, ChecklistSection, RichTextInput, Skeleton, AnimatedHeartOverlay, StoryProgressBar, ImmersiveStoryCard, CoverImagePicker, CommentItem, EditEntryModal, RichTextRenderer, JourneyMap, JourneyProgressBar, BadgesSection, TravelStats, CompassRandomizer, MapDiaryCarousel, DiaryMapCover, PeopleToFollow, TripPlanStopItem, VideoEntryCard

#### Schermate Non Testate
Nessun test per alcuna screen (login, register, home, explore, create, map, profile, diary detail, day detail, planner, notifications, settings).

### Copertura Test Stimata
- **Hooks:** ~6/17 testati (35%)
- **Componenti UI:** ~5/38 testati (13%)
- **Screens:** 0/16 testati (0%)
- **Integrazione/E2E:** 0

---

## 11. Punti di Forza

1. **Design system completo e coerente:** Palette "Terra — Authentic Explorer" ben pensata, typography serif/sans strategica, spacing/radius/shadows/motion tutti definiti. Design evocativo e differenziante per un'app di travel diary.

2. **Type safety forte:** Discriminated unions per DayEntry (text/tip/photo/video/mood/location con metadata tipizzati), type definitions per tutte le entità DB, typed routes di Expo.

3. **Social features robuste:** Optimistic updates con rollback su errore (like, save, follow), haptic feedback, denormalized counters nel DB.

4. **Media pipeline curata:** Compressione immagini intelligente (resize proporzionale + compress), video thumbnail extraction, signed URLs per storage, upload concorrente.

5. **i18n integrato dall'inizio:** Due lingue con auto-detect e persistenza preferenza utente.

6. **Tab bar custom:** MorphingTabBar con animazione spring, haptic, notification badge.

7. **Trip Plans completi:** CRUD completo con stops, checklist (5 categorie), budget, clone da diario, default checklist.

8. **Real-time notifications:** Supabase Realtime con postgres_changes subscription.

9. **Tests esistenti per hook critici:** useDayEntries, useMediaUpload, useDiarySocial hanno test ragionevolmente completi.

10. **Expo best practices:** New architecture, react compiler, typed routes, secure store per token, proper splash screen handling.

---

## 12. Debolezze e Rischi

1. **🔴 ~94 errori TypeScript:** La build è tecnicamente rotta se si usa strict mode. Il pattern più comune è `Palette.xxx` vs nuovo `Colors.xxx` — un refactoring incompleto del design system.

2. **🔴 No state management:** Tutto fetch diretto, no cache, no optimistic updates standardizzate (solo manuali nei singoli hook). Navigazione = re-fetch completo.

3. **🟡 Molti hardcoded strings:** Nonostante i18n, diverse stringhe sono hardcoded in italiano o inglese.

4. **🟡 Test coverage bassissima:** 11 test files per un'app con 21 schermate e 38+ componenti. Zero test per screens, ~13% componenti testati.

5. **🟡 Alcuni componenti usano `Palette` diretto** (no dark mode support): map.tsx, planner.tsx, diary/[id].tsx.

6. **🟡 `CommentsModal` non importato in index.tsx** — funzionalità commenti dal feed potrebbe essere broken.

7. **🟡 Supabase schema non migrato** — non c'è directory `supabase/migrations/`. Lo schema è definito solo nei types TypeScript. Rischio di drift tra types e DB reale.

8. **🟡 Hook `usePublicMapLocations`** fa 3 query in cascade (diaries → diary_days → day_entries) senza paginazione (limit 200 diaries, 1000 days, 2000 entries). Potrebbe essere lento con molti dati.

9. **🟡 Path Windows nei TypeScript errors** (`C:/Users/loren/OneDrive/...`) — suggerisce che il progetto è sviluppato su Windows ma l'analisi è fatta in un ambiente Linux/WSL.

10. **🟡 Skeleton component** usa `theme.theme` che non esiste nel type `AppTheme`.

11. **🟡 Nessun error handling globale** — solo `ErrorBoundary` base di Expo. Crash non catturati potrebbero essere silenti.

12. **🟡 Nessun analytics** — nessun tracking di crash, errori, o usage.

---

## 13. Riepilogo Strutturale

```
t2t-app/
├── app/                    # 21 file — Expo Router screens
├── components/             # 38 file (44 con test/spec)
│   └── ui/                 # 5 file — componenti base
├── hooks/                  # 17 file + 6 test
├── lib/                    # 1 file (supabase.ts)
├── types/                  # 4 file
├── constants/              # 1 file (theme.ts)
├── i18n/                   # 1 file + 2 translations
└── assets/                 # images
```

**Totale righe TypeScript stimate:** ~8,000-10,000 LOC

---

## 14. Raccomandazioni Prioritarie

1. **Fix TypeScript errors** — Refactor per usare `useAppTheme()` ovunque invece di `Palette` diretto. Eliminare ~60 errori legacy.
2. **State management** — Integrare TanStack Query per caching, dedup, optimistic updates standardizzate.
3. **Migrations Supabase** — Creare `supabase/migrations/` con schema verificabile e versionabile.
4. **Aumentare test coverage** — Almeno screens auth (login/register), diary CRUD, trip plan CRUD.
5. **Completa i18n** — Passare tutte le hardcoded strings alle chiavi di traduzione.
6. **Fix Skeleton.tsx** — `theme.theme` → proprietà corretta di `AppTheme`.
7. **Fix CommentsModal import** — Manca import in `index.tsx`.
8. **Error handling globale** — ErrorBoundary con reporting.
