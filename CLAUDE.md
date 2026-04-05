# T2T - Travel to Tell

## Project Overview

React Native (Expo SDK 54) + TypeScript social travel diary app.
Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime).
Design System: "Terra Evolved" (Playfair Display, DM Sans, Caveat).

## Quick Commands

```bash
cd t2t-app && npm start          # Expo dev server
cd t2t-app && npm test           # Jest tests
cd t2t-app && npm run lint       # ESLint
cd t2t-app && npx tsc --noEmit   # TypeScript check
npx supabase functions serve     # Local Edge Functions
```

## Architecture

### File Organization

| Directory | Purpose |
|-----------|---------|
| `t2t-app/app/` | Screens (Expo Router file-based routing) |
| `t2t-app/components/` | Reusable UI components |
| `t2t-app/hooks/` | Business logic (custom React hooks) |
| `t2t-app/services/` | External API integrations (all proxied via Edge Functions) |
| `t2t-app/types/` | TypeScript interfaces and types |
| `t2t-app/utils/` | Utility functions (validation, sanitization) |
| `t2t-app/i18n/` | Translations (EN/IT) |
| `t2t-app/constants/` | Theme tokens, design system |
| `t2t-app/lib/` | Supabase client initialization |
| `supabase/functions/` | Edge Functions (API proxy, server-side logic) |
| `supabase/migrations/` | PostgreSQL migrations with RLS policies |

### Code Conventions

- **TypeScript**: Strict mode. No `any` without explicit justification.
- **Components**: Functional components + hooks only. No class components.
- **Naming**: PascalCase (components), camelCase (hooks/utils/vars), UPPER_SNAKE (constants).
- **Exports**: Named exports preferred. Default export only for screen files.
- **State**: React hooks + Supabase Realtime. No external state library.
- **Styling**: `StyleSheet.create()` with theme tokens from `constants/theme.ts`.
- **Testing**: Jest + @testing-library/react-native. Files: `*.spec.tsx` or `*.test.tsx`.

## Security Rules (MANDATORY)

1. **NEVER** expose API keys client-side. Use `EXPO_PUBLIC_` ONLY for non-secret config (Supabase URL, anon key).
2. **ALL** external API calls MUST go through Supabase Edge Functions (`api-proxy`).
3. **NEVER** display raw database/API errors to users. Use i18n error keys. Log internally with `console.error`.
4. **ALL** database tables MUST have RLS enabled with proper policies.
5. Storage uploads MUST be scoped to user's folder: `{user_id}/...`.
6. **ALWAYS** validate/sanitize user input before database writes. Use `utils/inputValidator.ts`.
7. **NEVER** log sensitive data (tokens, passwords, API keys).
8. Use `expo-secure-store` for ALL sensitive local storage (tokens, session).
9. Edge Functions MUST validate path parameters against allowlists (SSRF prevention).
10. Edge Functions MUST verify authentication via Supabase Auth header.
11. **NEVER** use `SECURITY DEFINER` on RPC functions unless there is a documented reason. Prefer `SECURITY INVOKER`.
12. CORS must use explicit origin allowlists, never `Access-Control-Allow-Origin: *`.

### Security Learnings

See `.jules/sentinel.md` for documented vulnerability patterns and prevention strategies.

## Performance Rules

- **FlatList**: ALWAYS use `useCallback` for `renderItem`. Extract items as `React.memo` components. See `.jules/bolt.md`.
- **Images**: Compress before upload via `expo-image-manipulator` (70% JPEG, max 1920px).
- **Queries**: Use `.select()` with specific columns, never `select('*')`.
- **Maps**: Use clustering for >20 markers (`useClusteredLocations`).
- **Animations**: Use `react-native-reanimated` worklets, never legacy `Animated` API.
- **Lists**: Never use `ScrollView` for lists with >20 items. Use `FlatList` with `getItemLayout`.

## Accessibility Rules

- ALL icon-only buttons MUST have `accessibilityLabel` and `accessibilityRole="button"`.
- Dynamic states must update `accessibilityLabel` (e.g., "Like" vs "Unlike"). See `.Jules/palette.md`.
- Color contrast must meet WCAG AA (4.5:1 for text).
- Touch targets minimum 44x44 points.

## i18n Rules

- ALL user-facing strings MUST use i18n keys: `t('key')`.
- **NEVER** hardcode strings in components (neither English nor Italian).
- Add both EN and IT translations for every new key in `i18n/translations/`.
- Error messages MUST use i18n keys, not raw error strings.

## Git Conventions

- **Commit format**: `type(scope): description`
  - Types: `feat`, `fix`, `refactor`, `ci`, `docs`, `test`, `chore`
  - Scope: optional. Example: `feat(diary): add mood picker`
- **Branch format**: `feature/name`, `fix/name`, `refactor/name`
- PR required for `main` branch.
- CI must pass (lint + tsc) before merge.

## Database Conventions

- Tables: `snake_case` plural (`diary_days`, `day_entries`).
- Columns: `snake_case` (`created_at`, `author_id`).
- UUIDs for all primary keys (`gen_random_uuid()`).
- Timestamps: `timestamptz` with `default now()`.
- Foreign keys: always `ON DELETE CASCADE`.
- New tables: ALWAYS create RLS policies in the same migration.
- Migrations: sequential timestamp prefix (`YYYYMMDDHHMMSS_description.sql`).
- RPC functions: prefer `SECURITY INVOKER`. Document any `SECURITY DEFINER` usage.

## Design System ("Terra Evolved")

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| terracotta | #C85A42 | #E07A5C | Primary action |
| forest | #2D4A3E | #3B6B52 | Secondary |
| goldenHour | #D4A853 | #E8C46A | Badges, accents |
| bg | #FAF6F0 | #141210 | Background |
| surface | #FFFFFF | #201D1A | Card surface |
| text | #1A1714 | #F0EBE1 | Body text |

- **Fonts**: Playfair Display (headings), DM Sans (body), Caveat (annotations).
- **Spacing**: 4px grid — xs:4, sm:8, md:16, lg:24, xl:32.
- **Border radius**: sm:8, md:12, lg:16, xl:24.
- **ALWAYS** use `useAppTheme()` for colors. **NEVER** hardcode hex values in components.

## Environment Variables

### Client-side (safe to expose)
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (RLS handles security)

### Build-time (via EAS secrets)
- `GOOGLE_MAPS_API_KEY` — Google Maps (restricted by app signature)

### Server-side only (Supabase Edge Function secrets)
- `RAPIDAPI_KEY` — RapidAPI (Booking, Tripadvisor, AeroDataBox)
- `PEXELS_API_KEY` — Pexels stock images
- `AMADEUS_API_KEY`, `AMADEUS_API_SECRET` — Amadeus flights/hotels

## Anti-Patterns (DO NOT)

- Do NOT use `EXPO_PUBLIC_` for any secret/API key.
- Do NOT use `Access-Control-Allow-Origin: *` in Edge Functions.
- Do NOT interpolate user input into SQL patterns without escaping wildcards.
- Do NOT hardcode colors — use theme system via `useAppTheme()`.
- Do NOT hardcode strings — use i18n via `useTranslation()`.
- Do NOT use `.single()` without handling the null case.
- Do NOT use `any` in component props or state types.
- Do NOT pass raw `error.message` to `Alert.alert()` or user-facing UI.
- Do NOT use inline functions in `FlatList.renderItem` — use `useCallback` + `React.memo`.
