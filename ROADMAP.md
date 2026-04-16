# T2T — Public Roadmap

This document lists work planned beyond the MVP. It is updated as items land in
`CHANGELOG.md`. Tracker: [B00RR/t2t-travel-to-tell#97](https://github.com/B00RR/t2t-travel-to-tell/issues/97).

Legend: `[ ]` planned — `[~]` in progress — `[x]` shipped (moved to CHANGELOG).

## Auth & Account

- [ ] Apple Sign-In (iOS)
- [ ] Two-factor / MFA (TOTP)
- [ ] Session management & device list

## Social

- [ ] Direct messaging (1-to-1 and group)
- [ ] Mentions & notifications for replies
- [ ] Reactions beyond "like"

## Discovery

- [ ] 3D Globe: wire up real diary/location data (currently partial / mock)
- [ ] Verify `search_diaries` RPC coverage (index on tags, mood, country)

## Maps

- [ ] Heatmap mode for dense regions
- [ ] Turn-by-turn navigation (via Edge Function proxy)
- [x] Export to KML / GPX

## Trip Planner

- [ ] Advanced dynamic cost estimation (flights + hotels + activities)
- [ ] Flight / hotel UI integration with saved planner entries

## Media

- [ ] Advanced video player (scrubbing, quality selection)
- [ ] Photo filters (brightness, contrast, sepia, …)

## Profile

- [x] Chronological travel timeline
- [x] Data export (CSV / JSON)

## Platform

- [ ] Public API docs for RPC functions
- [ ] Admin dashboard / moderation tooling
- [ ] Analytics dashboard (aggregated, privacy-preserving)

---

**Process**: items marked `[x]` in this file have corresponding entries in
`CHANGELOG.md` under `[Unreleased]` or a released version. When a release is
cut, the `[x]` rows here may be removed.
