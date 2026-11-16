# Progress

## Done

### Phase 0 — Foundation (2026-11-16)

- Project setup: Vite, React, TypeScript, Tailwind, Router, Zustand, Dexie, Vitest,
  ESLint, Prettier. Scripts: `dev`, `build`, `test`, `lint`, `validate:content`.
- Layout with bottom navigation: Today, Learn, Library, Korea, Me. Placeholder pages.
- Storage layer with schema version 1, migration hook, export / import as JSON.
- Settings on the Me page: theme (system/light/dark), daily goal, romanization toggle,
  speech rate, departure date.
- Departure countdown on Today, read from settings.
- Content folders and a generic `validate:content` script.
- 22 unit tests: date maths, settings persistence, export/import round trip,
  bad-file rejection, content validator.

Acceptance:

- [x] `dev`, `build`, `test`, `lint` all succeed.
- [x] All five sections open on a phone-sized screen (checked in Chromium, iPhone 13 size).
- [x] Settings persist after reload.
- [x] Export then import restores the same state.

## Next

Phase 1 — Hangul mastery (see PROMPT.md).

## Decisions

- **HashRouter** instead of normal URLs: GitHub Pages returns 404 on reloading a
  deep SPA link.
- **Key-value storage** (one IndexedDB table): each feature saves one value under its
  own key, so export/import needs no changes when features are added.
- **Zustand store + manual persistence** (not Zustand's `persist` middleware): keeps
  loading, validation and migration explicit and testable.
- **PWA deferred to Phase 8**, as in the spec. Only the Vite `base` is prepared.
- **Defaults:** daily goal normal, romanization on, theme follows the system,
  speech rate 0.9.
- **Speech rate range** 0.5 to 1.2. The setting is stored only; audio starts in Phase 1.

## Known issues

- No GitHub repository exists yet (`78AHYBIS/hangeul-road`), so nothing is pushed.
- The bottom nav has no desktop layout yet (it is centred, max 576px wide). Fine for
  now; revisit in Phase 8.
- Bundle is one 370 kB JS file (118 kB gzipped). Code-splitting is planned for Phase 8.

## Korean items needing review

None yet (no Korean content in Phase 0).

## Links to check

None yet.
