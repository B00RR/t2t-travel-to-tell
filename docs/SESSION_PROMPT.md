# T2T - Travel to Tell: Session Prompt Guide

Use this prompt at the start of any development session to give full context to AI assistants or new team members.

---

## Project Context

**T2T (Travel to Tell)** is a vertical social network for travelers built as a mobile app. Users create interactive travel diaries with rich content (text, photos, videos, tips, moods, locations), discover other travelers' stories, plan trips, and engage socially (follow, like, comment, save).

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo SDK 54, TypeScript |
| Routing | Expo Router v6 (file-based, typed routes) |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Storage + Edge Functions + Realtime) |
| Maps | react-native-maps (Google Maps) |
| 3D | @react-three/fiber + Three.js (interactive globe) |
| Animations | react-native-reanimated + gesture-handler |
| i18n | i18next + react-i18next (EN/IT) |
| Testing | Jest 29 + @testing-library/react-native |
| CI/CD | GitHub Actions + EAS Build |

### Design System: "Terra Evolved"

- **Fonts**: Playfair Display (headings), DM Sans (body), Caveat (handwritten annotations)
- **Primary**: terracotta (#C85A42 / #E07A5C dark)
- **Secondary**: forest (#2D4A3E / #3B6B52 dark)
- **Accent**: goldenHour (#D4A853 / #E8C46A dark)
- **Always** use `useAppTheme()` for colors. Never hardcode hex values.

---

## Critical File Map

### App Screens (`t2t-app/app/`)
| File | Description |
|------|-------------|
| `_layout.tsx` | Root layout: GestureHandler + AuthProvider + font loading |
| `(auth)/login.tsx` | Email/password login |
| `(auth)/register.tsx` | User registration with username |
| `(app)/(tabs)/home/index.tsx` | Feed (discover/following mode) |
| `(app)/(tabs)/explore/index.tsx` | Browse diaries with filters |
| `(app)/(tabs)/explore/map.tsx` | World map (mine/discover) |
| `(app)/(tabs)/explore/planner.tsx` | Trip plan list |
| `(app)/(tabs)/profile/index.tsx` | User profile + stats + badges |
| `(app)/(tabs)/create.tsx` | Create new diary |
| `(app)/diary/[id].tsx` | Diary detail + social layer |
| `(app)/diary/day/[day_id].tsx` | Day entries CRUD |
| `(app)/planner/[id].tsx` | Trip plan detail |
| `(app)/settings.tsx` | User settings |

### Business Logic (`t2t-app/hooks/`)
| Hook | Purpose |
|------|---------|
| `useAuth.tsx` | Auth context (session, user, loading) |
| `useDayEntries.ts` | Diary day entries CRUD + media signing |
| `useDiarySocial.ts` | Like, save, follow operations |
| `useComments.ts` | Comment CRUD with threading |
| `useMediaUpload.ts` | Image/video upload with compression |
| `useMapLocations.ts` | Personal map data |
| `usePublicMapLocations.ts` | Community map data |
| `useClusteredLocations.ts` | Map marker clustering |
| `useFlightSearch.ts` | Flight search (via Edge Function) |
| `useHotelSearch.ts` | Hotel search (via Edge Function) |
| `useTripPlans.ts` | Trip plan listing |
| `useNotifications.ts` | Notification handling |
| `useAppTheme.ts` | Theme provider (light/dark) |

### Services (`t2t-app/services/`)
| File | Description |
|------|-------------|
| `rapidapi.ts` | RapidAPI via Edge Function proxy (Booking, Tripadvisor, AeroDataBox) |

### Backend (`supabase/`)
| File | Description |
|------|-------------|
| `functions/api-proxy/index.ts` | Edge Function: API proxy with rate limiting, SSRF protection, CORS |
| `migrations/20260318*_setup_schema.sql` | Core schema: profiles, diaries, days, entries, social tables, RLS |
| `migrations/20260319*_search_diaries_rpc.sql` | Full-text diary search RPC |
| `migrations/20260320*_get_map_locations_rpc.sql` | Map location fetching RPC |
| `migrations/20260321*_trip_planner.sql` | Trip planner schema + clone RPC |
| `migrations/20260403*_restrict_storage_rls.sql` | Storage visibility restriction |
| `migrations/20260403*_fix_rpc_auth_checks.sql` | RPC auth hardening |
| `migrations/20260403*_add_db_constraints.sql` | Audit logging + constraints |

### Config
| File | Description |
|------|-------------|
| `CLAUDE.md` | Development rules and security guidelines (READ THIS FIRST) |
| `t2t-app/constants/theme.ts` | Design system tokens |
| `t2t-app/lib/supabase.ts` | Supabase client with SecureStore |
| `t2t-app/utils/inputValidator.ts` | Input validation (comments, bio, username, display name) |
| `t2t-app/utils/querySanitizer.ts` | PostgREST query sanitization |

---

## Code Patterns to Follow

### Creating a New Hook
```typescript
// hooks/useMyFeature.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useMyFeature() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<MyType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('my_table')
      .select('id, title, created_at')  // specific columns, never *
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[useMyFeature] fetch error:', error);
      Alert.alert(t('common.error'), t('my_feature.fetch_failed'));
    } else {
      setData(data ?? []);
    }
    setLoading(false);
  }, [user, t]);

  return { data, loading, fetchData };
}
```

### Creating a New Component
```typescript
// components/MyComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography } from '@/constants/theme';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export function MyComponent({ title, onPress }: MyComponentProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  title: {
    ...Typography.heading3,
  },
});
```

### Using FlatList Correctly
```typescript
// Extract item component with React.memo
const DiaryItem = React.memo(({ item }: { item: Diary }) => (
  <ProfileDiaryCard item={item} />
));

// In parent component:
const renderItem = useCallback(
  ({ item }: { item: Diary }) => <DiaryItem item={item} />,
  []
);

<FlatList
  data={diaries}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>
```

### Calling External APIs (via Edge Function proxy)
```typescript
// NEVER call external APIs directly from client code
// ALWAYS use the Edge Function proxy
const { data, error } = await supabase.functions.invoke('api-proxy', {
  body: {
    api: 'booking',           // registered API name
    path: '/v1/hotels/search', // validated path
    params: { dest_id: '123', checkin_date: '2026-01-01' },
  },
});
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why | Do Instead |
|-------------|-----|------------|
| `EXPO_PUBLIC_MY_SECRET_KEY` | Bundled into app, extractable | Use Edge Function secrets |
| `Alert.alert('Error', error.message)` | Leaks internal details | `Alert.alert(t('common.error'), t('feature.error_key'))` |
| `supabase.from('table').select('*')` | Over-fetches data | `.select('id, title, created_at')` |
| `style={{ color: '#C85A42' }}` | Breaks dark mode | `{ color: theme.terracotta }` |
| `<Text>Hello World</Text>` | Not translatable | `<Text>{t('greeting')}</Text>` |
| `renderItem={({ item }) => <Card />}` | Re-renders all items | `useCallback` + `React.memo` |
| `SECURITY DEFINER` on RPC | Bypasses RLS silently | `SECURITY INVOKER` (default) |
| `Access-Control-Allow-Origin: *` | Any origin can call | Explicit origin allowlist |

---

## Pre-Commit Checklist

Before committing any changes, verify:

```bash
# 1. TypeScript — no type errors
cd t2t-app && npx tsc --noEmit

# 2. Lint — no ESLint violations
npm run lint

# 3. Tests — all passing
npm test

# 4. Security — no exposed secrets
grep -r "EXPO_PUBLIC_.*KEY\|EXPO_PUBLIC_.*SECRET" --include="*.ts" --include="*.tsx" .
# Should return ONLY Supabase URL and anon key references

# 5. i18n — no hardcoded strings in new/modified components
# Manually verify all user-facing text uses t('key')

# 6. Theme — no hardcoded colors in new/modified components
# Manually verify all colors use useAppTheme() values
```

---

## New Feature Template

When adding a new feature, create these files:

1. **Type**: `types/myFeature.ts` — TypeScript interfaces
2. **Hook**: `hooks/useMyFeature.ts` — Business logic + Supabase queries
3. **Component**: `components/MyFeatureCard.tsx` — Presentational component
4. **Screen**: `app/(app)/my-feature/index.tsx` — Screen with layout
5. **Translations**: Add keys to both `i18n/translations/en.json` AND `it.json`
6. **Test**: `components/__tests__/MyFeatureCard.test.tsx` — Component tests
7. **Migration** (if DB changes): `supabase/migrations/YYYYMMDDHHMMSS_my_feature.sql` with RLS

---

## OWASP Mobile Top 10 Applied to T2T

| # | Risk | T2T Status | Notes |
|---|------|-----------|-------|
| M1 | Improper Credential Usage | Mitigated | SecureStore for tokens, Edge Functions for API keys |
| M2 | Inadequate Supply Chain Security | OK | npm audit, lockfile, EAS managed builds |
| M3 | Insecure Authentication/Authorization | Mitigated | Supabase Auth + RLS on all tables |
| M4 | Insufficient Input/Output Validation | Partially | inputValidator.ts + querySanitizer.ts implemented, needs broader adoption |
| M5 | Insecure Communication | OK | HTTPS enforced (Supabase), no plain HTTP |
| M6 | Inadequate Privacy Controls | Needs work | GDPR account deletion not yet implemented |
| M7 | Insufficient Binary Protections | Needs work | No obfuscation, no root/jailbreak detection |
| M8 | Security Misconfiguration | Partially | CORS fixed, some RPC still uses SECURITY DEFINER |
| M9 | Insecure Data Storage | OK | expo-secure-store for sensitive data |
| M10 | Insufficient Cryptography | OK | Supabase handles encryption, bcrypt for passwords |

---

## Database Schema (Quick Reference)

```
profiles ──< diaries ──< diary_days ──< day_entries ──< entry_media
    |            |            |
    |            └──< diary_locations
    |            └──< likes
    |            └──< comments
    |            └──< saves
    └──< follows
    └──< trip_plans ──< trip_plan_stops
                    └──< trip_plan_checklist_items
```

All tables have RLS enabled. All foreign keys cascade on delete.
