# Hangeul Road

Personal Korean-learning PWA. The full spec is `PROMPT.md`; status is `PROGRESS.md`.
Work one phase per session. Read both files before starting.

## Stack

React 19 + TypeScript (strict) + Vite, Tailwind CSS v4, React Router (HashRouter),
Zustand for state, Dexie (IndexedDB) for persistence, Vitest, ESLint + Prettier.
No backend, no accounts, no tracking.

## Commands

| Command                    | What it does                               |
| -------------------------- | ------------------------------------------ |
| `npm run dev`              | Dev server                                 |
| `npm run build`            | Type-check (`tsc -b`) and production build |
| `npm test`                 | Unit tests (Vitest, runs once)             |
| `npm run lint`             | ESLint and Prettier check                  |
| `npm run format`           | Auto-format with Prettier                  |
| `npm run validate:content` | Check all files under `src/content/`       |

Before finishing a phase, run: lint, test, validate:content, build.

## Structure

```
src/
  app/          App.tsx (routes), Layout.tsx (bottom nav), nav.ts, useTheme.ts
  features/     one folder per section: daily, learn, library, korea-guide, settings
  content/      learning data only (JSON), one folder per content type
  lib/          date.ts, storage/ (schema, db, store, backup)
  components/   shared UI (Page, Card, ComingSoon)
scripts/        validate-content.ts (+ its test)
```

## Conventions

- **Routing:** HashRouter (`/#/learn`), because GitHub Pages cannot serve SPA deep links.
  Vite `base` is `./`, so the build works under any path.
- **Dark mode:** a `dark` class on `<html>`, set by `src/app/useTheme.ts`. Use Tailwind
  `dark:` variants. A small inline script in `index.html` applies the last theme before
  React loads.
- **Tailwind:** never pass a second background/text colour through `className` to a
  component that already sets one (the classes conflict). Add a prop, like `Card tone`.
- **Dates:** local calendar days as `YYYY-MM-DD` strings; use helpers in `src/lib/date.ts`.
- **Tests:** logic lives in `src/lib` and is unit-tested next to the file (`*.test.ts`).
  Tests run in Node with `fake-indexeddb` (see `src/test-setup.ts`).
- **UI text:** English, calm, no guilt or shame messages (see PROMPT.md section 2).
- **Touch targets:** at least 40px high.
- Do not put model names or AI attribution text in code comments.

## Storage

- IndexedDB database `hangeul-road`, one table `kv` (`key` -> `value`), wrapped by
  `src/lib/storage/db.ts`. Nothing else imports Dexie.
- Each feature owns one key, listed in `STORAGE_KEYS` in `schema.ts`
  (currently only `settings`). A new feature adds a key, a type, a `sanitize…` function,
  and state + actions in `store.ts`.
- `SCHEMA_VERSION` (now 1) describes the shape of saved data. When a saved shape
  changes: bump it and add a step to `migrate()` in `schema.ts`. It runs at startup
  (`ensureCurrentSchema`) and on import (`parseBackup`).
- Backup file: `{ app: "hangeul-road", schemaVersion, exportedAt, data: { key: value } }`.
  Export and import cover **every** key automatically. Import validates first and
  replaces everything in one transaction; a bad file changes nothing.
- All data read from storage or a file goes through a `sanitize…` function, so bad
  data falls back to defaults instead of crashing.

## Content schemas

Content is data: JSON files under `src/content/<type>/`, where type is one of
`hangul`, `vocab`, `grammar`, `phrases`, `culture`, `resources`, `korea-apps`.

Rules every item follows now (checked by `npm run validate:content`):

- each file is a JSON array of objects
- `id`: required, non-empty, unique across all content (use a prefix, e.g. `vocab-…`)
- `korean`: when present, non-empty and contains Hangul
- `needsReview: true`: allowed; listed in the validator output and in `PROGRESS.md`
- `lastVerified`: when present, `YYYY-MM-DD`
- `refs`: optional array of other item ids; each must exist

Per-type schemas (TypeScript types + extra validator rules) are added by the phase
that introduces the type. Document them here when added.

## Korean and link accuracy (from PROMPT.md, critical)

- Only standard Korean you are sure about; otherwise leave out or mark `needsReview`.
- Never invent links. Verify with web search and store `lastVerified`.
