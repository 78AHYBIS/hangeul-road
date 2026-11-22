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

`npm run preview` serves the production build (with the service worker). Icons and iPhone
splash screens are drawn by `NODE_PATH=$(npm root -g) node scripts/make-icons.mjs` (needs
Playwright; run it only after changing the icon design).

## Deploy

`.github/workflows/deploy.yml` runs lint, tests, content validation and the build on every
push to `main`, then publishes `dist/` to GitHub Pages:
https://78ahybis.github.io/hangeul-road/ (repository setting: Pages → Source: GitHub Actions).

## Structure

```
src/
  app/          App.tsx (lazy routes, first-launch gate), Layout.tsx (bottom nav, skip link,
                update bar), nav.ts, useTheme.ts, useSettingsEffects.ts (text size, voice),
                pwa.ts (service worker, install prompt), reminders.ts (daily reminder)
  features/     one folder per section: daily, learn, hangul, vocab, grammar, phrases, library,
                culture, korea-guide, settings, onboarding, search
  content/      learning data only (JSON), one folder per content type
  lib/          date.ts, hangul.ts (compose/decompose, romanize, keyboard),
                hangulProgress.ts (letter stats), speech.ts, storage/,
                srs.ts (spaced repetition), numbers.ts (Korean number readings),
                vocabProgress.ts, activity.ts (daily log), streak.ts, roadmap.ts,
                libraryProgress.ts (resource status, active courses, units),
                particles.ts (은/는, 이/가, 이에요/예요… by batchim), selfIntro.ts,
                grammarProgress.ts, phraseProgress.ts, cultureProgress.ts,
                koreaGuideProgress.ts (arrival-checklist ticks),
                mixedText.ts (Korean runs in mixed strings),
                ground.ts (on-the-ground mode, semester days, last-backup text),
                reminder.ts (when a reminder is due)
  components/   shared UI (Page, Card, LinkRow, MixedText), Form.tsx (Field, Segmented),
                ui.ts (button classes, choiceClass)
scripts/        validate-content.ts (+ its test), sw-plugin.ts + service-worker.js (offline),
                make-icons.mjs
public/         manifest.webmanifest, icon.svg, icons/ (PNG icons, iPhone splash screens)
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
  `speak()` uses the voice picked in Me (`setPreferredVoice`, kept in sync by
  `useSettingsEffects`), falling back to the first Korean voice (`pickVoice`).
- **Korean text:** mark it `lang="ko"`; `index.css` then keeps words whole when wrapping.
  For strings that mix English and Korean (explanations, notes, titles), render
  `<MixedText text=… />` (`src/components/MixedText.tsx`, splitting in `src/lib/mixedText.ts`),
  which marks only the Korean runs. `Page` and `LinkRow` already do this for titles.
- **Romanization:** render it with `<Romanization text=… />`, which obeys the setting.
  Exception: single-letter sound labels (`g / k`) in letter lessons and letter drills,
  because there they are the answer.
- **Pages load lazily:** every page in `App.tsx` is a `React.lazy` import, so a new page
  gets a `lazy(() => import(...).then((m) => ({ default: m.Name })))` line there. The
  service worker caches every chunk, so lazy pages still open offline.
- **Main tabs** pass `searchable` to `Page`, which shows the search button.
- **Accessibility:** small grey text on `bg-stone-100` must be `text-stone-600` (500 fails
  contrast); never `text-stone-400` for text on white. Keyboard focus shows a ring from
  `index.css` (base layer). Phase 8 checked every page with axe-core, light and dark.
- **Text size:** a setting that changes the root font size, so size things in rem
  (Tailwind's default), not px.
- Do not put model names or AI attribution text in code comments.

## Offline (PWA)

- `scripts/sw-plugin.ts` (a Vite plugin) writes `dist/sw.js` at build time: the list of every
  built and public file (except iPhone splash screens) plus a content hash as the version.
  The worker code is `scripts/service-worker.js`.
- Cache first for everything; navigations get the cached `index.html` (HashRouter).
- A new version installs in the background and waits; `Layout` shows "A new version of the
  app is ready" with Reload (`applyUpdate()` in `src/app/pwa.ts`). Only that tap may reload
  the page, never the first install.
- Only the production build registers the worker; `npm run dev` has none.
- Daily reminder: no server, so the in-app timer shows it while the app is open, and the
  worker's `periodicsync` handler (Chrome on Android, installed) shows it otherwise. The page
  sends the worker its settings with a `REMINDER` message.

## Storage

- IndexedDB database `hangeul-road`, one table `kv` (`key` -> `value`), wrapped by
  `src/lib/storage/db.ts`. Nothing else imports Dexie.
- Each feature owns one key, listed in `STORAGE_KEYS` in `schema.ts`
  (`settings`, `hangul`, `vocab`, `activity`, `library`, `grammar`, `phrases`, `culture`,
  `koreaGuide`). A new feature adds a key, a type, a `sanitize…` function,
  and state + actions in `store.ts`.
- `SCHEMA_VERSION` (now 1) describes the shape of saved data. When a saved shape
  changes: bump it and add a step to `migrate()` in `schema.ts`. It runs at startup
  (`ensureCurrentSchema`) and on import (`parseBackup`).
- Settings (Phase 8 fields): `voiceURI` ('' = first Korean voice), `textSize`, `reminderOn`,
  `reminderTime` (HH:MM), `lastBackupOn` (set by `recordBackup` on export or share),
  `onboarded`, `groundMode` (auto / on / off), `semesterEnd`. Settings saved before
  `onboarded` existed count as onboarded (`wasSavedBeforeOnboarding`), also in old backups.
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
- `rules.json` (7): `id`, `title`, `summary`, `explanation[]`,
  `examples[]` of `{ korean, pronounced, meaning }`. Batchim plus six sound-change rules.
- `reading-words.json`: `id` (`read-001`), `korean`, `romanization` (Revised
  Romanization, lowercase), `meaning`, `category` (loanword, place, brand, sign, food).
- `strokes.ts`: stroke order as SVG paths on a 100 x 100 grid, in writing order.
- Saved progress (`hangul` key): `{ letters: { [letter]: { seen, correct, recent[] } },
readingSpeed[], lessonsDone[] }`. See `src/lib/hangulProgress.ts`.

### vocab/

- `decks.json` (17): `id` (`deck-food`), `title`, `description`. Order = study order.
  A deck holds 30 to 50 words (tested); start a new deck file when one is full.
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
  `optional` (TOPIK), `core` (in the Library's "Start here" list; keep it to about six) and
  `note` (caveats, honest comparisons). The Library shows Start here (active courses, `core`,
  anything with a status, own resources; `splitStartHere()`) and the rest under "More
  resources"; any search or filter shows one flat list. The validator checks the
  allowed values (`RESOURCE_ENUMS`, keep in sync with `index.ts`).
- `path.json` (5): recommended path, one step per roadmap stage: `id`, `stage`, `title`,
  `text`, `refs` (resource ids, checked by the validator).
- Only add a resource after verifying it by web search; otherwise list it under
  "Links to check" in `PROGRESS.md`. **Never change a resource id** (saved state uses it).
- Saved progress (`library` key): `{ items: { [id]: { status, notes, units[] } }, active[],
custom[] }`. At most 2 active courses. A unit is `{ id: 'u1', title, doneOn }`.
  User-added resources have ids starting `custom-` and are shown as "added by you".

### grammar/

- `lessons.json` (21, in study order): `id` (`grammar-NN-<slug>`), `title`, `summary`,
  `pattern`, `explanation[]`, `examples[]` (4 to 6, `{ korean, meaning, note? }`, polite
  endings), `practice[]` (6 or more). Practice types:
  - `particle` / `blank`: `korean` with exactly one `___`, `options[]`, `answer`, `meaning`,
    optional `why`.
  - `order`: `tiles[]` in the correct order (the app shuffles), `meaning`, optional
    `accept[]` (other correct word orders, as full sentences).
  - `translate`: `meaning`, `tiles[]`, `distractors[]` (wrong tiles), optional `accept[]`.
- Saved progress (`grammar` key): `{ done[], results: { [lessonId]: { correct, total, date } } }`.
- **Never change a lesson id** (saved progress and today's ticks use it).
  The `NN` in an id is only a label: lessons added later continue the numbering
  (17, 18…) and are placed in the file where they belong in the study order.

### phrases/

- `packs.json` (14, in study order): `id` (`phrases-<slug>`), `title`, `situation`,
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
- `cards.json` (56, grouped by topic): `id` (`culture-<slug>`), `topic`, `title`, `summary`,
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
- Optional `refs` on a card link to the Korea apps guide (app or how-to ids); `CardPage`
  shows them as "In the Korea apps guide". Use this whenever text says "see the apps guide".

### korea-apps/

Types, category and value lists live in `src/content/korea-apps/index.ts`; the validator's
`APP_ENUMS` must stay in sync. Logic (Today checklist, ref links, search) is in
`features/korea-guide/guide.ts`, display labels in `labels.ts`.

- `apps.json` (30): `id` (`app-<slug>`), `name`, optional `korean`, `category` (maps,
  translation, messaging, transport, food, shopping, money, student, travel, safety),
  `what`, `why` (why locals use it instead of the global app), `english` (yes, partial, no,
  unconfirmed), `koreanNumber` and `arc` (no, some, yes, unconfirmed), `foreignCards` (yes,
  some, no, none = no payments, unconfirmed), `setup` (before, arrival, arc), `access`
  (details; say so when sources disagree), optional `disputed: true`, `stores` (`ios` as
  `https://apps.apple.com/app/id<n>`, `android` as `https://play.google.com/store/apps/details?id=<pkg>`;
  at least one; a missing Android link is shown as a Play search), optional `web`,
  `sources[]`, `lastVerified`, optional `refs`.
- `checklists.json` (3, order before → arrival → arc): `id`, `title`, `when`, `intro`,
  `items[]` (`{ id: 'check-<list>-<slug>', text, refs? }`), `lastVerified`. Item ids are
  unique across all content. **Never change one**: ticks are saved by item id.
- `howto.json` (10): `id` (`howto-<slug>`), `question` (completes "How do I…"), `answer`,
  `steps[]` (2+), optional `refs`, optional `sources[]`, `lastVerified`.
- `glossary.json` (58): `id` (`appword-<korean>`), `korean` (as on screen), `group`
  (account, buttons, ordering, delivery, transport), `word` (a vocabulary word id whose
  Korean starts with `korean`, e.g. 확인 → 확인하다). New app words go in
  `deck-17-apps.json` (`deck-apps`); a word appears only once across all decks.
- Every access claim is verified by web search. Rules for foreigners change fast: what
  cannot be confirmed is `unconfirmed` in the app or listed under "Links to check".
- Saved progress (`koreaGuide` key): `{ checked: { [itemId]: date } }`. Ticking is not a
  study action, so it does not log to today or count for the streak.
- Today: `checklistForToday(progress, daysToDeparture)` shows a checklist card (outside the
  5 tasks) from 21 days before departure ("Before I fly", then a preview of "First week")
  until 90 days after it ("First week", then "After I get my ARC"). Items ticked today stay
  visible (`itemsForToday`).

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
