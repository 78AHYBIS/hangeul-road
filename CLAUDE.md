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
  features/     one folder per section: daily, learn, hangul, vocab, grammar, phrases, library,
                culture, korea-guide, settings
  content/      learning data only (JSON), one folder per content type
  lib/          date.ts, hangul.ts (compose/decompose, romanize, keyboard),
                hangulProgress.ts (letter stats), speech.ts, storage/,
                srs.ts (spaced repetition), numbers.ts (Korean number readings),
                vocabProgress.ts, activity.ts (daily log), streak.ts, roadmap.ts,
                libraryProgress.ts (resource status, active courses, units),
                particles.ts (은/는, 이/가, 이에요/예요… by batchim), selfIntro.ts,
                grammarProgress.ts, phraseProgress.ts, cultureProgress.ts
  components/   shared UI (Page, Card, ComingSoon, LinkRow), ui.ts (button classes, choiceClass)
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
- **Effects:** always use braces in `useEffect(() => { ... })`. Returning a value by
  accident (e.g. `window.scrollTo`, which returns a Promise) crashes React on cleanup.
- **Randomness and `Date.now()`:** only in event handlers or timers, never during render
  (the React lint rules reject it). Drill builders take an `rng` argument for tests.
- **Audio:** only through `SpeakButton` / `speak()` in `src/lib/speech.ts`. Show
  `<VoiceNotice />` on any screen with audio, so a missing Korean voice is explained.
  In list rows use `<SpeakButton compact />` (icon only) so the Korean keeps the width.
- **Korean text:** mark it `lang="ko"`; `index.css` then keeps words whole when wrapping.
- **Romanization:** render it with `<Romanization text=… />`, which obeys the setting.
  Exception: single-letter sound labels (`g / k`) in letter lessons and letter drills,
  because there they are the answer.
- Do not put model names or AI attribution text in code comments.

## Storage

- IndexedDB database `hangeul-road`, one table `kv` (`key` -> `value`), wrapped by
  `src/lib/storage/db.ts`. Nothing else imports Dexie.
- Each feature owns one key, listed in `STORAGE_KEYS` in `schema.ts`
  (`settings`, `hangul`, `vocab`, `activity`, `library`, `grammar`, `phrases`, `culture`). A new feature adds a key, a type, a `sanitize…` function,
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

Required fields per file are listed in `REQUIRED_FIELDS` in `scripts/validate-content.ts`;
add a line there for every new content file. TypeScript types live in
`src/content/<type>/index.ts`.

### hangul/

- `letters.json` (40): `id` (`letter-ㄱ`), `korean`, `group`, `name`, `sound`, `soundEn`,
  `soundRu`, `hint`, `confusedWith` (letters), `speak` (syllable to play).
- `lessons.json` (5): `id`, `group`, `title`, `intro`. One lesson per letter group.
- `rules.json` (6): `id`, `title`, `summary`, `explanation[]`,
  `examples[]` of `{ korean, pronounced, meaning }`. Batchim plus five sound-change rules.
- `reading-words.json`: `id` (`read-001`), `korean`, `romanization` (Revised
  Romanization, lowercase), `meaning`, `category` (loanword, place, brand, sign, food).
- `strokes.ts`: stroke order as SVG paths on a 100 x 100 grid, in writing order.
- Saved progress (`hangul` key): `{ letters: { [letter]: { seen, correct, recent[] } },
readingSpeed[], lessonsDone[] }`. See `src/lib/hangulProgress.ts`.

### vocab/

- `decks.json` (15): `id` (`deck-food`), `title`, `description`. Order = study order.
- `deck-NN-<slug>.json`: words. `id` (`vocab-<slug>-<korean>`), `korean`, `meaning`,
  `pos`, `deck` (deck id), `example` (polite style), `exampleMeaning`, optional `note`.
  New deck files are loaded automatically (`import.meta.glob` in `index.ts`).
- **Never change a word id** once released: saved review progress is keyed by it.
- A word may appear only once across all decks (a test enforces this), and every
  example must end in a polite ending (요 / 니다).
- Saved progress (`vocab` key): `{ cards: { [wordId]: Card }, myWords[], focusDeck }`.
  `Card` is defined in `src/lib/srs.ts`.

### resources/

- `resources.json` (37): `id` (`res-…`), `name`, `type` (course, youtube, website, app,
  podcast, book, dictionary, tutor), `url` (https only), `description`, `why`, `skills[]`
  (hangul, vocabulary, grammar, listening, speaking, culture, topik), `level` (beginner,
  beginner-intermediate, all), `cost` (free, freemium, paid), `lastVerified`, optional
  `optional` (TOPIK) and `note` (caveats, honest comparisons). The validator checks the
  allowed values (`RESOURCE_ENUMS`, keep in sync with `index.ts`).
- `path.json` (5): recommended path, one step per roadmap stage: `id`, `stage`, `title`,
  `text`, `refs` (resource ids, checked by the validator).
- Only add a resource after verifying it by web search; otherwise list it under
  "Links to check" in `PROGRESS.md`. **Never change a resource id** (saved state uses it).
- Saved progress (`library` key): `{ items: { [id]: { status, notes, units[] } }, active[],
custom[] }`. At most 2 active courses. A unit is `{ id: 'u1', title, doneOn }`.
  User-added resources have ids starting `custom-` and are shown as "added by you".

### grammar/

- `lessons.json` (16, in study order): `id` (`grammar-NN-<slug>`), `title`, `summary`,
  `pattern`, `explanation[]`, `examples[]` (4 to 6, `{ korean, meaning, note? }`, polite
  endings), `practice[]` (6 or more). Practice types:
  - `particle` / `blank`: `korean` with exactly one `___`, `options[]`, `answer`, `meaning`,
    optional `why`.
  - `order`: `tiles[]` in the correct order (the app shuffles), `meaning`, optional
    `accept[]` (other correct word orders, as full sentences).
  - `translate`: `meaning`, `tiles[]`, `distractors[]` (wrong tiles), optional `accept[]`.
- Saved progress (`grammar` key): `{ done[], results: { [lessonId]: { correct, total, date } } }`.
- **Never change a lesson id** (saved progress and today's ticks use it).

### phrases/

- `packs.json` (13, in study order): `id` (`phrases-<slug>`), `title`, `situation`,
  `dialogue[]` (`{ speaker, korean, meaning }`, the learner is `"You"`), `phrases[]`
  (`{ id: 'phrase-<pack>-NN', korean, meaning, note?, casual? }`, at least 4), `refs`
  (grammar lesson ids), optional `lastVerified` (for facts like emergency numbers).
- Phrase ids are checked for uniqueness across all content. **Never change one**:
  starred phrases are saved by id. Quizzes are generated from the phrases
  (`features/phrases/quiz.ts`); a meaning with "(you will hear this)" is only asked
  from Korean, never produced.
- Everything polite (요 / 니다 / 니까) unless `casual: true` with a `note` (tested).
- Saved progress (`phrases` key): `{ done[], results{}, starred[], intro }`; `intro` is the
  self-introduction details (`IntroDetails` in `src/lib/selfIntro.ts`).

### culture/

- `topics.json` (12, display order): `id` (`culture-topic-<slug>`), `title`, `korean`,
  `intro`, `quiz[]` (3+ of `{ question, options[], answer, why }`). `culture-topic-ulsan`
  is shown as its own section at the top of the Korea tab.
- `cards.json` (55, grouped by topic): `id` (`culture-<slug>`), `topic`, `title`, `summary`,
  `body[]`, `do[]`, `avoid[]`, `words[]` (`{ korean, meaning }`), optional `varies`
  ("this varies" note), `sources[]` (`{ name, url }`, official https pages only),
  `lastVerified`.
- The validator requires `lastVerified` on a card with sources or with a year or phone
  number in its summary/body, and at least one source on every Ulsan card.
- **Never change a card id** (read state is saved by id). Time-sensitive facts must be
  verified by web search; keep caveats ("check again close to the date") in the text.
- Saved progress (`culture` key): `{ read: { [cardId]: date }, results: { [topicId]: { correct,
total, date } } }`. Reading logs `culture:<cardId>`, a quiz `culture:quiz:<topicId>`.
- Today: `cultureTaskForToday()` in `features/culture/culture.ts` fills `PlanInput.culture`.

## Spaced repetition (src/lib/srs.ts)

- Stages: new (no card), learning, review, mature (interval of 21+ days).
- `review(card, grade, today)` returns the next card. Good from new: 1 day, then
  roughly x2.5 (1, 3, 8, 20, 50). Again: back to learning today, ease -0.2.
- `buildQueue` caps reviews per day by daily goal (20 / 50 / 100) and new words
  (5 / 10 / 15). While the backlog is above the cap, no new words are added.
- All dates are passed in; nothing in `srs.ts` reads the clock.

## Daily plan (src/features/daily)

- `tasks.ts` `buildPlan(input)` returns at most 5 tasks: reviews, lesson, drill,
  culture, external. It is pure; `useToday.ts` gathers the inputs from the store.
- Other features plug in through `PlanInput`: `culture` (today's card or topic quiz; a
  card task has `card`, and ticking it on Today calls `setCardRead`) and
  `external` (Duolingo by default). `external` is filled by `courseTaskForToday()` in
  `libraryProgress.ts`: the first unit of an active course that is not done, or was ticked
  today (so the task stays put for the day). Two active courses take turns by day. Ticking
  a unit task on Today calls `toggleCourseUnit`, which also logs `unit:<id>:<unitId>` in
  today's `tasksDone` so the streak counts it.
- `lessonTask`: letter lessons always first; then by stage (`lessonOrder`): hangul →
  rules, grammar, packs; core → grammar, rules, packs; survival → packs and grammar on
  alternate days; arrival / in Korea → packs, grammar, rules; then the number trainer.
- Finishing a lesson (Hangul, grammar, pack) logs `lesson:<id>` in today's `tasksDone`,
  and the plan keeps that lesson (ticked) for the rest of the day. Re-practising a done
  grammar lesson or pack logs `drill:grammar:<id>` / `drill:quiz:<id>`, which keeps the
  drill in place the same way.
- `drillTask`: weak letters first; once all are solid, the weakest grammar lesson and
  phrase pack (`weakest()` in `grammarProgress.ts`) take two days out of three.
- Nothing is carried over between days. Ticks live in `activity.days[date].tasksDone`.
- Every study action must call a store action that logs to today (`gradeWord`,
  `recordLetters`, `logDrill`), so streak, time and weekly review stay correct.
- Streak: one free rest day per Monday-to-Sunday week; a day counts with one ticked
  task or five answers; 3+ missed days in a row make a "comeback" day (minimum size).
- Roadmap: `buildRoadmap(start, departure)`; 14 weeks give 2 + 4 + 4 + 4.

## Korean and link accuracy (from PROMPT.md, critical)

- Only standard Korean you are sure about; otherwise leave out or mark `needsReview`.
- Never invent links. Verify with web search and store `lastVerified`.
