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

### Phase 1 — Hangul mastery (2026-11-16)

- Five letter lessons (40 letters) with sound notes for English and Russian speakers,
  memory hints, look-alikes, audio and step-by-step stroke order.
- Six rule lessons: batchim, seven final sounds, linking, nasalization, tensing,
  aspiration with ㅎ.
- Syllable block builder.
- Drills: letter to sound, sound to letter, look-alike pairs, read the syllable,
  read the word. Each records accuracy per letter; weak letters come up more often.
- Timed reading (30 s) with a speed history chart.
- Real-world reading list: 88 words (loanwords, places, brands, signs, food).
- Typing practice on the two-set keyboard: on-screen keys and physical keyboard.
- Progress map: new / learning / solid per letter.
- Audio through the Web Speech API, with a visible notice when no Korean voice exists.
- 49 unit tests in total.

Acceptance:

- [x] All 40 letters covered (14 + 5 + 10 + 11, checked by a test against Unicode).
- [x] Every drill works by tap at phone size and records accuracy per letter.
- [x] Audio: the missing-voice fallback was checked. **Real audio playback was not
      tested**, because the test browser has no Korean voice. Check it on your phone.
- [x] Romanization toggle works in drills, the builder and the reading list.
      Single-letter sound labels (`g / k`) always show, because they are the answer.

## Next

Phase 2 — Vocabulary with spaced repetition (see PROMPT.md).

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

- **Drills use letters from finished lessons** (all letters until 4 are available).
- **Read-aloud drills are self-graded** ("Got it" / "Missed it"); speech recognition
  is on the "later" list.
- **Typing is checked key by key** against the target word instead of using the
  device keyboard, so it works on a phone without a Korean keyboard installed.
- **Stroke order** is drawn from simple line data in `strokes.ts`, not a font.
- **A letter is solid** after 6+ recent answers with 85% correct (last 10 count).

## Known issues

- Audio depends on the device having a Korean voice. Some browser voices need an
  internet connection, so audio may not work offline on every device.
- The timed reading drill trusts taps; it cannot hear whether an item was read.
- The bottom nav has no desktop layout yet (it is centred, max 576px wide). Fine for
  now; revisit in Phase 8.
- Bundle is one 370 kB JS file (118 kB gzipped). Code-splitting is planned for Phase 8.

## Korean items needing review

No items are marked `needsReview`. Worth a native speaker's glance anyway:

- Sound descriptions and Russian comparisons in `letters.json` (approximations by nature).
- Stroke order follows the standard school order (e.g. ㅂ 4 strokes, ㅌ 3, ㅈ 2).
  Some teachers and fonts differ slightly.

## Links to check

None yet.
