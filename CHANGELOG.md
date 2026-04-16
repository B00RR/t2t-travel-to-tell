# Changelog

All notable changes to T2T — Travel to Tell will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Chronological travel timeline view on public profile (tab "Timeline").
- Profile data export to JSON and CSV via share sheet (`settings` → "Esporta dati").
- Map locations export to KML and GPX formats from the map screen (share sheet).
- Public `CHANGELOG.md` and `ROADMAP.md` at repo root.

## [1.0.0] — MVP

### Added
- Auth: email/password sign-in & sign-up, password reset, Google OAuth social login,
  account deletion, change password.
- Diary: create/edit/delete diaries, diary days and day entries (text, photo, video,
  location, mood), publish / visibility controls (public/private/friends),
  co-editing with collaborators via Supabase Realtime and `diary_presence`.
- Social: likes, threaded comments (up to 3 levels), edit/delete comments, follows,
  saved diaries, share with deep linking.
- Discovery: full-text search (`search_diaries` RPC), advanced filters (budget range,
  trip type, season), clustering on public map, pagination for public map locations.
- Trip Planner: create/edit plans, collaborators (`trip_plan_collaborators`),
  per-day itinerary entries.
- Travel Buddies: `match_travel_buddies` RPC with destination / style / activity scoring.
- Gamification: 9 achievement badges with persistence (`user_badges`), auto-award
  trigger, push notifications for awarded badges.
- Notifications: push notification registration via `expo-notifications`,
  server-side `send-push` Edge Function.
- Offline support: AsyncStorage queue, retry with backoff (max 3),
  `OfflineBanner` UI, sync manager on reconnect.
- Media: image compression (`expo-image-manipulator`), image lightbox gallery,
  video playback via `expo-video`.
- i18n: Italian and English translations across the app.
- Design system: "Terra Evolved" tokens (Playfair Display, DM Sans, Caveat),
  light/dark/system theme preference.
- Security: RLS policies on all tables, Edge Function `api-proxy` with allowlisted
  upstream hosts, `expo-secure-store` for sensitive local storage.

### Fixed
- TypeScript strict-mode regressions (~94 errors) after `Palette` → `useAppTheme()`
  refactor.

[Unreleased]: https://github.com/B00RR/t2t-travel-to-tell/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/B00RR/t2t-travel-to-tell/releases/tag/v1.0.0
