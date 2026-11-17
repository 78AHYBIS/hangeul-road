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

### Phase 2 — Vocabulary with spaced repetition (2026-11-16)

- SRS engine (`src/lib/srs.ts`), SM-2 style, with Again / Hard / Good / Easy.
- 697 words in 15 themed decks, each with part of speech, a polite example
  sentence, a translation and, where useful, a note.
- Review session with rotating card types: Korean to meaning, meaning to Korean,
  listening (only when a Korean voice exists) and typing (can be switched off in Me).
- Daily limits by goal: 5 / 10 / 15 new words, at most 20 / 50 / 100 reviews.
- Deck browser, search over all words, "learn this deck next", and a My words deck.
- Number trainer: Sino-Korean, native Korean, prices, clock times, phone numbers.
- 122 unit tests in total.

Acceptance:

- [x] 697 words pass `validate:content`. No word is marked `needsReview`, and none
      are hidden.
- [x] SRS tests cover scheduling, lapses and the review cap (a missed week of 300 due
      cards gives 50 reviews and no new words).
- [x] One-handed review: every action is a single tap on a large button in the lower
      half of a phone screen. Checked at iPhone 13 size.

### Phase 3 — Daily tasks, roadmap and progress (2026-11-16)

- Today page: at most 5 tasks built each day from the roadmap, the review queue and
  Hangul progress, with a Go button per task and three day sizes.
- Roadmap generated from start date and departure date (2 + 4 + 4 + 4 weeks now).
- Forgiving streak: a minimum day counts, one free rest day per week, and a
  "welcome back" lighter day after 3 or more missed days.
- Weekly review: days studied, new words, accuracy, weakest items, one focus.
- Progress page: words by stage, study calendar, time studied, reading speed.
- A quiet level and points line at the bottom of Progress. No penalties anywhere.
- Start date setting in Me.
- 155 unit tests in total.

Acceptance:

- [x] Task generator and streak rules are unit-tested, including missed days and a
      late start.
- [x] A new day never carries over unfinished tasks (tested, and checked in the
      browser across simulated days).
- [x] Today is useful on day 1 and day 100 (both tested). Honest limit: the lesson
      slot only knows Hangul lessons and the number trainer until Phases 5 and 6 add
      grammar, phrases and culture cards; the hooks for them are in place.

### Phase 4 — Resource library (2026-11-17)

- 37 resources, each checked by web search on 2026-11-17: courses, YouTube channels,
  websites, apps, a podcast, a book, dictionaries, tutors and exchange apps, TOPIK, and
  official UNIST, Ulsan and Korea sites. Each has an honest description, why it helps,
  level, cost, skills and `lastVerified`. Prices and caveats are in a "Good to know" note.
- Library page: search, filters (type, skill, level, cost, my status), active courses at
  the top, and a recommended path showing the current roadmap stage (all 5 on tap).
- Resource page: open the link, my status (not started / in progress / finished /
  dropped), notes saved as you type, "Make active course" (at most 2), and units:
  add one, add a numbered run ("Lesson 5" onwards) or paste a list; tick them off.
- Today: the next unit of an active course replaces the Duolingo task. Ticking it on
  Today ticks the unit (and counts for the streak). Two active courses take turns daily.
  An active course with no units shows "Continue …" with a link to add them.
- Add your own resource (name, link, type, cost, skills, description); marked
  "added by you, not checked".
- New saved key `library`, included in export / import automatically. Schema version
  stays 1 (a new key needs no migration; missing data falls back to empty).
- The validator checks resource types, skills, levels, costs, https links,
  `lastVerified`, path stages and references.
- 186 unit tests in total.

Acceptance:

- [x] At least 30 resources, every one verified by web search during this phase (37).
      Honest limit: the session's network blocked opening the sites directly, so
      verification is from search results (official domains, current listings, recent
      articles), not from loading each page. YouTube handles were confirmed through
      listing sites, not YouTube itself. Tap each link once on your phone.
- [x] Unverified ideas are listed below under "Links to check", not shown in the app.
- [x] Marking an active course changes what the Today page suggests (unit-tested, and
      checked in the browser at iPhone 13 size: Duolingo → "GO! Billy Korean (YouTube):
      Lesson 1", ticked on Today, still ticked after reload, unit ticked in the Library).

## Next

Phase 5 — Grammar and survival phrases (see PROMPT.md). Grammar and phrase lessons go
into `lessonTask` in `src/features/daily/tasks.ts`.

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
- **Tasks tick themselves where the app can tell** (reviews finished, lesson marked
  done); every task can also be ticked by hand.
- **The roadmap start date** is the first day with activity unless set in Me.
- **Study time is an estimate:** the gap between answers, capped at one minute each.
- **Learning steps are day-based:** a new word rated Good returns tomorrow; Again
  repeats it at the end of the same session.
- **Typing cards use the phone's own Korean keyboard** (a plain text field), unlike
  the Hangul typing drill. They can be switched off in Me.
- **Card type is chosen by review count**, so it rotates predictably and needs no
  extra saved data.
- **A letter is solid** after 6+ recent answers with 85% correct (last 10 count).
- **At most 2 active courses**, and finishing or dropping one removes it from active.
- **Today's course unit stays put for the day:** a unit ticked today keeps showing (as
  done) until tomorrow, instead of the next unit appearing straight away.
- **Recommended path is free first:** paid courses (Coursera, TTMIK, Udemy) are listed
  with an honest note on what the free options already cover.
- **Duolingo stays the default external task** when no course is active.

## Known issues

- Audio depends on the device having a Korean voice. Some browser voices need an
  internet connection, so audio may not work offline on every device.
- The timed reading drill trusts taps; it cannot hear whether an item was read.
- The bottom nav has no desktop layout yet (it is centred, max 576px wide). Fine for
  now; revisit in Phase 8.
- Bundle is one 665 kB JS file (191 kB gzipped); Vite warns about the size. Code-splitting
  is planned for Phase 8.
- Resource prices, free tiers and subscriber counts change often. The app says so on each
  resource page; re-verify the library before relying on a price.
- Links open in a new tab and need internet; the library itself works offline.

## Korean items needing review

No items are marked `needsReview`. I only used common textbook words and simple
polite sentences, but none of it has been checked by a native speaker. Worth a glance:

- All 697 vocabulary example sentences (`src/content/vocab/deck-*.json`).
- Word choices where two forms are common: 현금인출기 (people often say ATM),
  출입국사무소 (the official name has changed over the years), 휴대폰 / 핸드폰.

- Sound descriptions and Russian comparisons in `letters.json` (approximations by nature).
- Stroke order follows the standard school order (e.g. ㅂ 4 strokes, ㅌ 3, ㅈ 2).
  Some teachers and fonts differ slightly.

## Links to check

Not in the app until verified:

- **Korean Grammar in Use: Beginning** (Darakwon book): a well-known grammar book, but I
  found no official publisher page to link, only shops.
- **Easy Korean** (Easy Languages street interviews): sources disagree on whether a
  Korean channel or only a playlist exists.
- **KoreanClass101**: not researched this phase.
- **Naver Dictionary deep link** (`korean.dict.naver.com/koendict`): not confirmed, so
  the app links to `dict.naver.com`.

Details to re-check on the sites themselves:

- **Talk To Me In Korean:** one TTMIK page says the free Basic membership is being
  discontinued; older pages say core lessons are free. Marked paid.
- **Coursera (Yonsei courses):** whether a free audit option exists right now.
- **Nuri King Sejong Institute:** whether live online classes are open to learners in
  Kazakhstan; self-study courses need only a free account.
- **Ulsan Tourism site** (`tour.ulsan.go.kr/tour/eng`): official, but parts look dated.
- **YouTube handles** (TTMIK by channel id, @KoreanUnnie, @seemile, @koreanenglishman,
  @asianboss, GO! Billy's /user/ link): taken from listing sites.
