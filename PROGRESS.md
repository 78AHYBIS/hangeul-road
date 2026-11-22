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

### Phase 5 — Grammar and survival phrases (2026-11-17)

- 16 grammar lessons in the spec's order (은/는 and 이/가 have one lesson each). Each has
  the pattern, a plain explanation, 4 to 6 polite examples with audio, and 6 or 7
  practice questions: choose the particle, fill the blank, put the words in order,
  translate with tiles (with wrong tiles mixed in). Wrong answers show the right
  sentence and a short reason, in amber, never red.
- 13 situation phrase packs (137 phrases): first meeting, dorm, cafeteria and
  restaurants, cafes, convenience store, shopping, bus/subway/taxi, directions, bank and
  phone shop, pharmacy and hospital, professor, classmates, emergencies. Each has a
  dialogue, key phrases with notes, links to its grammar lessons, and a 6-question quiz
  (Korean → meaning, meaning → Korean, and listening when a Korean voice exists).
- Self-introduction builder: name, country, university, exchange student or not,
  major, up to 2 hobbies. It picks the right particles (이에요/예요, 과/와) from the
  batchim, in 해요 or 합니다 style, with audio per line. Saved, and shown at the top of
  the phrasebook.
- Phrasebook: all phrases as large cards, search (English or Korean), filter by
  situation, starred phrases first, and a full-screen "show" mode with big text for
  reading out or showing someone.
- Today: lessons follow the roadmap stage (letters first, then grammar in the core
  weeks, packs and grammar on alternate days in the survival weeks, remaining packs in the
  arrival weeks). A lesson finished today stays on Today, ticked, instead of the next
  lesson popping up; this now also applies to Hangul lessons. Once all letters are solid,
  the drill slot offers practice of the weakest grammar lesson or phrase pack.
- New saved keys `grammar` and `phrases`, included in export / import automatically.
  Schema version stays 1 (new keys need no migration).
- The validator checks grammar practice items (one gap, answer among the options, tiles
  with Hangul, no distractor that is also a right tile) and phrase packs (Hangul and
  meaning on every line, phrase ids unique across all content).
- 232 unit tests in total.

Acceptance:

- [x] At least 15 grammar lessons (16) and 12 phrase packs (13) pass `validate:content`.
      Tests also check polite endings everywhere, except phrases marked casual.
- [x] Grammar and phrases are wired into the daily task generator by roadmap stage
      (unit-tested per stage, and checked in the browser: in week 4 Today offered
      "Grammar: Sentence order"; after the practice it stayed ticked, also after a reload).
- [x] Phrasebook works with no network: checked in Chromium at iPhone 13 size with the
      network switched off (137 phrases, search, starred filter, show mode, grammar and
      pack pages; no failed requests). Honest limit: all content is in the app bundle,
      so it works offline once the app is open. Opening the app cold in airplane mode
      needs the service worker from Phase 8.

### Phase 6 — Culture and daily life (2026-11-17)

- 55 culture cards in 12 topics: the 11 from the spec (respect and hierarchy, dining,
  university life, dorm and waste sorting, getting around, money and shopping, social life
  and drinking, holidays and seasons, food, communication style, safety and health) plus
  Ulsan and UNIST. Each card has a summary, 2 short paragraphs, "what to do", "what to
  avoid", Korean words with audio, and a "this varies" note where practice differs.
- Ulsan and UNIST section at the top of the Korea tab (7 cards): the city, UNIST and
  Eonyang, the airport to Ulsan (Incheon via Seoul Station or a direct bus; Gimhae by bus;
  Gimpo flights), KTX Ulsan Station to campus, places in Ulsan, day trips to Busan and
  Gyeongju. Every card cites official sources in its footer, with a check date.
- A 4-question quiz per topic (48 questions), each answer with a short reason, in amber
  and teal like the other quizzes. Scores are saved; answers count for the streak.
- Today: the culture slot shows one card a day, one topic after another (Ulsan, safety,
  transport, dorm, money and food first in the arrival weeks). A card read today stays on
  Today, ticked; ticking the task on Today marks the card read. When every card of a topic
  is read, its quiz comes next. Once everything is done, the card read longest ago returns
  as "Read again".
- New saved key `culture` (`{ read: { cardId: date }, results }`), included in export /
  import automatically. Schema version stays 1.
- The validator checks culture cards (topic exists, do / avoid / words, https sources) and
  topic quizzes (3+ questions, answer among the options). A card that cites sources or
  mentions a year or a phone number must have `lastVerified`; Ulsan cards must cite a source.
- 250 unit tests in total.

Facts checked by web search on 2026-11-17 (search results only; the session could not
open the sites themselves, as in Phase 4):

- 2027 holidays: Seollal 6 to 8 February plus a substitute day on 9 February; semester
  holidays 1 March, 1 May (Labour Day, a public holiday since 2026), 5 May, 13 May
  (Buddha's Birthday), 6 June; Chuseok 14 to 16 September.
- Emergency and help numbers 112, 119, 1330 (travel helpline), 1345 (immigration).
- Transport: the direct KTX from Incheon Airport ended in 2018; AREX + KTX via Seoul
  Station; direct Incheon Airport to Ulsan buses (about 5 hours); Gimhae to Ulsan
  limousine (about 1 hour); Gimpo to Ulsan flights; KTX Ulsan Station to UNIST
  (10 to 15 minutes by taxi, bus 337 named in UNIST directions); Donghae Line from
  Taehwagang to Busan Bujeon (about 76 minutes).
- UNIST address (50 UNIST-gil, Eonyang-eup, Ulju-gun); Bangudae petroglyphs inscribed as
  UNESCO World Heritage in July 2025.

Acceptance:

- [x] At least 40 culture cards across all topics (55, at least 3 per topic; tested).
- [x] Time-sensitive facts carry a `lastVerified` date (17 cards). The validator enforces
      it for any card with sources, a year or a phone number, and a test lists the
      holiday, emergency and transport cards.
- [x] The Ulsan/UNIST section exists and cites official sources in the card footers
      (UNIST, UNIST International Affairs, Ulsan city, Ulsan tourism, Korail, VISITKOREA,
      Busan city). Checked in Chromium at iPhone 13 size: Today offered "Korea life: Age
      and seniority"; reading it ticked the task, still ticked after a reload; unticking and
      ticking on Today works; the Ulsan quiz saved its score; no console errors, no
      sideways scrolling.

### Content update (2026-11-22)

A review of the beginner content against a typical first-level course: what it covers that
the app did not, and where the two disagree (no disagreements on rules were found).

- Vocabulary: 48 new words (697 → 745). Family words (엄마, 아빠, 남동생, 여동생, 형제) in
  People; country names in Places (now "Places and countries"); 체육관, 운동장, 방학, 연필,
  시계, 칠판 in Campus. A new 16th deck, "Home, family and free time" (30 words): kitchen and
  room things, daily routine (세수하다, 이를 닦다, 머리를 감다), grandparents, pets, hobbies,
  잘하다 / 못하다, 귀엽다. Existing decks were full (50 words), and these words are less
  urgent in week one, so the new deck comes last; "Learn this deck next" moves it forward.
- Grammar: 5 new lessons (16 → 21), placed in study order: 도 (also), 하고 / (이)나 (and,
  with, or), ㅂ verbs and 어때요, -고 있어요 (doing now), -아야 / 어야 돼요 (have to). The
  negative lesson now also teaches -지 않아요. Ids continue at grammar-17; no id changed.
- Hangul: a seventh rule lesson, ㄷ and ㅌ before 이 (같이 → 가치, 해돋이 → 해도지).
- Number trainer: a Dates mode (삼월 이일), with 유월 and 시월 coming up more often.
- Phrases: a 14th pack, "Small talk: family, likes and weather" (12 phrases).
- Culture: a "Korean names" card in Respect and hierarchy (family name first, names after
  marriage, 아 / 야 between friends), and a fifth question in that topic's quiz.
- One fix: the 칠판 example now uses the honorific 쓰셨어요 for a professor.
- Left out on purpose: children's words (playground, toys), school-age culture, and casual
  speech (반말) as a grammar topic, which belongs in a later, clearly marked lesson.
- 252 unit tests in total. Checked in Chromium at iPhone 13 size: the new lessons, deck,
  rule, pack, card and Dates mode open with no console errors and no sideways scrolling.

### Phase 7 — Korea apps and arrival guide (2026-11-22)

- **Apps directory** (Korea tab → Korea apps): 30 apps in 10 categories: Naver Map,
  KakaoMap, Papago, Naver Dictionary, KakaoTalk, Kakao T, K.Ride, KakaoMetro, Subway Korea,
  KORAIL+, Express Bus T-money, T-money GO, Baemin, Coupang Eats, Yogiyo, Shuttle, CatchTable
  Global, Coupang, Karrot, Naver (Plus Store), Toss, KakaoBank, Hana EZ, WOWPASS, Kakao Pay,
  Everytime, UNIST mPortal, VISITKOREA, Emergency Ready App, E-Gen. Each has what it does, why
  locals use it, English, Korean number, ARC, foreign cards, when to set it up, a details
  note, store links, sources and `lastVerified`. 12 apps are marked "Sources disagree".
  Search, a category filter and a "Works before you fly" filter.
- **Three checklists** (12 + 10 + 9 items) with saved ticks: Before I fly, First week,
  After I get my ARC. Items link to the apps, answers and culture cards they mention.
- **Today:** in the last 21 days before departure a checklist card appears below the plan
  (outside the 5 tasks): the first 3 open items with tick boxes. After departure it shows
  First week, then After ARC, for up to 90 days.
- **How do I…** (10 answers): the airport to Ulsan, a bus, a taxi, food delivery, a parcel,
  second-hand things, a pharmacy, paying without a Korean card, a Korean phone number, the
  Residence Card.
- **Words in Korean apps:** 58 buttons and labels in 5 groups, each linked to a vocabulary
  word. 26 were already in decks; 32 new words are in a 17th deck, "Words in Korean apps"
  (745 → 777 words), with a "Learn this deck next" button.
- The culture cards on delivery, cards and cash, and emergency alerts now link to the
  guide ("In the Korea apps guide"). Two cards were updated with 2026 facts: Baemin and
  Shuttle work for foreigners; alerts carry English keywords since 2025.
- New saved key `koreaGuide`, included in export / import automatically. Schema version
  stays 1.
- The validator checks app values, store link formats, sources, `lastVerified`, unique
  checklist item ids, refs inside checklist items, how-to steps and glossary links.
- 282 unit tests in total.

Facts checked by web search on 2026-11-22 (search results only; the session could not
open sites or the app stores directly, as in earlier phases):

- Naver passport verification for foreigners (4 June 2026): bookings, orders and payments
  in Naver Map without a Korean number. Baemin in English, Chinese and Japanese (February
  2026), foreign Apple Pay (May 2026). KORAIL+ replaced Korail Talk (3 August 2026) and
  took over SRT booking (September 2026). Express bus online booking with foreign cards from
  August 2026; T-money's app still Korean cards only. Toss full English and passport sign-up.
  KakaoBank accounts for foreign residents (October 2026). Ulsan cashless city buses: pilot
  from 31 October 2026, all routes planned January to March 2027.
- Store links: App Store ids and Google Play package names were taken from search results
  (store listings, app trackers). 13 apps have a confirmed Google Play link; for the other
  17 the app opens a Google Play search instead of guessing a package name.

Acceptance:

- [x] At least 25 apps, each verified during this phase (30, all with `lastVerified`
      2026-11-22 and at least one source).
- [x] Every app has the phone-number/ARC field filled in or marked "unconfirmed" (tested).
      Unconfirmed values: Korean number for Kakao T, KORAIL+, Express Bus, CatchTable,
      Hana EZ, Everytime; ARC for Kakao T, KORAIL+, Express Bus, Coupang Eats, KakaoBank,
      Hana EZ, Everytime.
- [x] Checklists persist and appear on the Today page in the last 3 weeks before departure
      (unit-tested for 22 / 21 / 1 / 0 / -89 / -90 days; checked in Chromium at iPhone 13
      size: no card with the departure 3 months away; with the departure set 10 days ahead
      the "Before I fly" card appears, and a tick survives a reload on Today and on the
      checklists page). All new screens were opened at iPhone 13 size in light mode (one app page also in
      dark mode), with no console errors and no sideways scrolling.

### Phase 8 — Polish, offline and deploy (2026-11-22)

- **Installable and offline.** A service worker generated at build time
  (`scripts/sw-plugin.ts` + `scripts/service-worker.js`, no Workbox) caches every file of the
  build on the first visit and serves it from the cache, so the app opens cold in airplane
  mode. Web app manifest, PNG icons (normal and maskable), an Apple touch icon, and splash
  screens for ten iPhone sizes (Android draws its own from the manifest). A new version waits
  and shows "A new version of the app is ready · Reload". "Install the app" in Me uses the
  browser's install prompt (Chrome, Edge, Samsung Internet) or shows the three Safari steps on
  iPhone.
- **First launch:** start date, departure date, daily goal and level ("Starting from zero" /
  "I can read Hangul", which marks the five letter lessons done). "Skip and use the
  defaults" is there too. Anyone with saved settings or activity (and any older backup)
  skips it.
- **Daily reminder** (Me): on/off, a time, a Test button, and a note that says what this
  browser can do. Without a server: an in-app timer while the app is open, plus Periodic
  Background Sync in the service worker where Chrome allows it (installed app on Android).
  Shown at most once a day, only if nothing was studied yet.
- **Accessibility:** text size setting (Small / Normal / Large / Larger; scales the whole
  app), a keyboard focus ring, a "Skip to content" link, contrast fixes (grey labels on grey
  tiles, faint text in the phrasebook, done items), and the phrasebook card's name now matches
  its visible text. The "Typing cards" switch, mentioned in Phase 2 but missing from Me, was
  added.
- **Performance:** every page is a lazy chunk (`React.lazy`), content splits by section
  (vocab, culture, grammar, phrases, apps). The main bundle went from 956 kB (274 kB gzip) to
  409 kB (130 kB gzip), which is React, React Router and Dexie.
- **Global search** (search button on the five main tabs): words (incl. My words), phrases,
  grammar lessons, culture cards, Korea apps, "How do I…" answers and resources. Whole-name
  matches rank first; every search word must match. The query stays in the URL, so Back
  returns to the results.
- **On-the-ground mode** (Me: Auto / On / Off; Auto switches on on the departure day): Today
  shows "Day N" in Korea and the days of the semester left (semester end editable, default 18
  June 2027) instead of the countdown, with Phrasebook, Apps guide and Reviews (with the due
  count) at the top, and the arrival checklist above the plan.
- **Feedback from Aidar:**
  1. _Korean voice picker_ in Me: every Korean voice on the device, a Test button for each
     (안녕하세요. 저는 한국어를 배우고 있어요.), "Online voice: needs internet" where it applies,
     and how to download a better voice on iPhone and Android. Saved as `voiceURI`; a missing
     voice falls back to the first Korean one.
  2. _Share backup_ in Me (Web Share API with the JSON file: Drive, Files, Telegram, email),
     falling back to a download where files cannot be shared. "Last backup: 12 days ago",
     calm, no warning. The date travels inside the backup.
  3. _Start here_ in the Library: How to Study Korean, GO! Billy Korean (YouTube), Naver
     Dictionary, Papago, HelloTalk, Duolingo (marked `core: true`, checked by the validator),
     plus active courses, anything with a status and own resources. The other resources sit
     under a collapsed "More resources"; search and filters still cover all 37.
     GO! Billy was chosen over TTMIK: both YouTube channels are free, but Billy's is a
     numbered beginner course (about 100 lessons) that works as an active course on Today,
     while TTMIK's structured course is paid (about $7 to $13 a month, prices checked on
     2026-11-22 by web search) and its channel is short standalone videos.
- **Deploy:** `.github/workflows/deploy.yml` runs lint, tests, validation and the build on
  every push to `main` and publishes to GitHub Pages. README with screenshots, features, stack
  and design decisions; the old phase screenshots in `docs/` were replaced.
- New settings fields (no schema version bump: missing fields fall back to defaults):
  `voiceURI`, `textSize`, `reminderOn`, `reminderTime`, `lastBackupOn`, `onboarded`,
  `groundMode`, `semesterEnd`.
- 312 unit tests in total (search, reminder rules, voice fallback, on-the-ground mode, backup
  text, first-launch rules, Start here split, the `core` validator rule).

Checked in Chromium on the production build, served under `/hangeul-road/` like GitHub Pages:

- iPhone 13 size: setup → Today, all five tabs, search, Library, Me, text size Larger, on-the-
  ground mode; no console errors and no sideways scrolling.
- Offline: after one visit, with the server stopped and the browser offline, a new tab opened
  the app cold, and Korea, Phrasebook, Korea apps, a deck, search, Hangul, Me, Library and a
  reload all worked.
- Chrome reports no installability or manifest errors (`Page.getInstallabilityErrors`).
- Lighthouse 12 on the first screen: accessibility 100, best practices 100, SEO 100,
  performance 82 on a local server without compression or cache headers (GitHub Pages
  compresses). Lighthouse 12 has no PWA category any more, hence the installability check.
- axe-core (Lighthouse's accessibility engine) on 31 pages, light and dark: no violations.
- Keyboard at desktop size: the setup can be finished by Tab and Enter; Skip to content is the
  first stop; the focus ring is visible.

Acceptance:

- [ ] The app installs on a phone and works in airplane mode. **Checked in Chromium only**
      (installable, cold start offline). Installing on a real phone needs the live link;
      see the phone checklist below.
- [x] Lighthouse PWA and accessibility checks pass with no major issues (accessibility 100;
      installability via Chrome itself, see above; axe-core clean on 31 pages).
- [ ] The deployed link works, and the README explains the project well. README done; the
      link works once GitHub Pages is switched to "GitHub Actions" in the repository settings
      and the workflow has run (see Next).

## Next

All eight phases are built. Left to do by hand:

1. **Turn on GitHub Pages** (once): repository Settings → Pages → Build and deployment →
   Source: **GitHub Actions**. Then Actions → "Deploy to GitHub Pages" → Run workflow (or push
   to `main`). The app is then at https://78ahybis.github.io/hangeul-road/.
2. **Phone checks** (the two unticked acceptance items):
   - Install: iPhone Safari → Share → Add to Home Screen; Android Chrome → Me → Install
     Hangeul Road (or menu → Install app). Check the icon and the splash screen.
   - Airplane mode: open the installed app once online, close it, switch on airplane mode,
     open it again; try Today, a review, the phrasebook and the apps guide.
   - Voice picker: Me → Korean voice → Test each voice; download an Enhanced / Premium
     voice and check that it appears after reopening the app; check audio in airplane mode.
   - Share backup: Me → Share backup → save to Drive / Files; "Last backup: today".
   - Reminder: on Android with the app installed, set a time a few minutes ahead.
3. Have a Korean speaker check the items under "Korean items needing review".
4. Re-check "Links to check" and the Korea apps access rules close to departure.

Ideas for later stay in PROMPT.md section 6 (sync between devices, pronunciation scoring…).

## Decisions

- **HashRouter** instead of normal URLs: GitHub Pages returns 404 on reloading a
  deep SPA link.
- **Key-value storage** (one IndexedDB table): each feature saves one value under its
  own key, so export/import needs no changes when features are added.
- **Zustand store + manual persistence** (not Zustand's `persist` middleware): keeps
  loading, validation and migration explicit and testable.
- **PWA in Phase 8**, as in the spec (see the Phase 8 decisions below).
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
- **No romanization for grammar and phrases:** Hangul first (spec, section 2). The
  syllable romanizer ignores sound changes, so it would be wrong for sentences anyway.
- **Finishing the practice or quiz marks a lesson or pack done**, whatever the score.
  There is no pass mark; a "Mark as done" button exists for skipping practice.
- **Grammar practice keeps the lesson's order** (easier items first); options and tiles
  are shuffled, and tiles never start in the correct order.
- **Word-order exercises accept listed variants only** (`accept`), so sentences with
  freely movable parts were avoided or given their variants.
- **Culture cards are marked read by a button** ("Done reading"), not by opening them, so
  a card opened by accident does not count.
- **One card a day, rotating topics**, so Today varies; the topic quiz is offered once all
  of its cards are read. The Korea tab lets you read ahead freely.
- **Culture words are inline** (`words[]` on each card), not links to vocabulary decks:
  many are phrases or names (울산역, 말 놓으세요) that do not belong in the SRS decks.
- **Sources cite official pages only** (government, UNIST, Korail, tourism boards). Third-
  party guides were used to cross-check, not cited. Details that change (bus numbers, taxi
  fares) are given as "at the last check", with a reminder to check again.
- **The self-introduction needs Hangul** for the 해요 particles; a Latin name falls back
  to 입니다, which fits any word, with a note.

- **Apps guide sits in the Korea tab**, next to culture, not in the Library: apps are
  for living in Korea, the Library is for learning Korean. Papago, Naver Dictionary and
  VISITKOREA link to their Library entries.
- **Access as fixed values plus a note** (`yes / some / no / unconfirmed`): the list can show
  short chips, while the note says what exactly works and where sources disagree.
- **No guessed store links:** a Google Play link is shown only when the package name was
  confirmed; otherwise the button opens a Play search for the app name.
- **Checklist card outside the 5 tasks:** the spec caps daily tasks at 5, and the
  checklist is a few minutes of setup, not study. Ticks do not count for the streak.
- **App words link to existing vocabulary** instead of repeating it: 확인 on a button links
  to 확인하다 in the documents deck. Only missing words went into the new deck.

- **Hand-written service worker** instead of vite-plugin-pwa / Workbox: about 100 lines,
  no extra dependency to keep compatible with Vite 8, and readable for learning. Cache first,
  with one version hash for the whole build.
- **Updates wait for a tap** ("Reload"), so a new version never reloads the page in the
  middle of a review.
- **iPhone splash screens are not cached offline** (1 MB of images that iOS reads only when
  installing).
- **Reminders are honest about limits:** a web app without a push server cannot wake an
  iPhone at a set time; the setting says so and suggests a phone alarm instead.
- **"I can read Hangul" only marks the letter lessons done.** Letter drills still appear until
  letters are solid, which takes a few minutes for someone who reads Hangul, and confirms it.
- **On-the-ground mode can be forced on** before departure, as a preview and for testing.
- **Search keeps the query in the URL** (`#/search?q=…`), so Back returns to the results.

## Known issues

- Audio depends on the device having a Korean voice. Some browser voices need an
  internet connection, so audio may not work offline on every device.
- The timed reading drill trusts taps; it cannot hear whether an item was read.
- On a desktop screen the app stays a centred phone-width column (max 576px). Usable with a
  keyboard; a wider desktop layout was not needed for a phone-first app.
- Reminders: only reliable on Android with the app installed (and even there the browser picks
  the exact time); elsewhere only while the app is open.
- The first visit must be online; offline works from then on. Clearing the browser's site data
  removes both the offline copy and the progress (keep a backup).
- Resource prices, free tiers and subscriber counts change often. The app says so on each
  resource page; re-verify the library before relying on a price.
- Links open in a new tab and need internet; the library itself works offline.
- Korea apps: access rules for foreigners changed many times in 2026 and will keep
  changing. Every app page says so; re-check sign-up yourself before relying on an app, and
  update `apps.json` (with a new `lastVerified`) when something differs.
- Culture facts that change: transport times and fares, bus routes near UNIST, the Labour
  Day substitute-holiday rule, waste rules per building. Re-check close to departure.

## Korean items needing review

No items are marked `needsReview`. I only used common textbook words and simple
polite sentences, but none of it has been checked by a native speaker. Worth a glance:

- All 745 vocabulary example sentences (`src/content/vocab/deck-*.json`).
- Word choices where two forms are common: 현금인출기 (people often say ATM),
  출입국사무소 (the official name has changed over the years), 휴대폰 / 핸드폰.

- Sound descriptions and Russian comparisons in `letters.json` (approximations by nature).
- All grammar lessons and phrase packs (`src/content/grammar/lessons.json`,
  `src/content/phrases/packs.json`): standard textbook forms, but worth a read by a
  teacher. Specific choices to check:
  - 아이다르 as the Hangul spelling of Aidar (dialogues and the builder's placeholder).
  - Spacing: 잘 못해요 (be poor at) vs 못 해요 (cannot do); 도와주세요 written together.
  - 정보시스템 for "Information Systems" in the major list.
  - Natural-sounding but more advanced forms in dialogues (드릴까요, 먹을래요, 해야 돼요,
    -아도 돼요): they are taught as set phrases, not as grammar yet.
  - Emergency numbers 112 (police) and 119 (fire, ambulance), verified 2026-11-17 on
    gov.uk and the New Zealand embassy in Korea. Helplines 1330 and 1345 are covered in
    the Phase 6 culture card.
- Culture cards (`src/content/culture/cards.json`): Korean words and short phrases,
  standard forms. Worth a check: 말 놓으세요, 먼저 가 보겠습니다, 안 맵게 해 주세요,
  유니스트로 가 주세요, 카드 돼요? (colloquial), 팀플 (common student short form),
  and the messaging shortcuts ㅋㅋ / ㅎㅎ / ㅠㅠ (casual, labelled as such).
- Cultural statements are written as general patterns with "this varies" notes; a Korean
  friend or the UNIST buddy can confirm what applies on campus (dorm rules, festivals,
  drinking events, cafeteria payment).
- Added on 2026-11-22, worth a look: 형제 for "siblings" in 형제가 있어요?; 공용 부엌 (signs
  often say 주방); 저는 외동이에요; 요즘 뭐 하고 지내요?; 성함이 어떻게 되세요?; the note that
  해야 돼요 and 해야 해요 mean the same; spacing of 잘하다 / 잘 못하다 / 못 해요.
- Added on 2026-11-22 (Phase 7), worth a look: the 32 words and examples in
  `deck-17-apps.json`, especially 요청사항 written as one word (as apps show it),
  본인인증, 비회원, and the example 요청사항에 '문 앞에 놔 주세요'라고 썼어요. Also the UNIST
  address in the checklist (울산광역시 울주군 언양읍 유니스트길 50), 빈차 (the free-taxi
  light), 반값택배, and the glossary pairs where a button word links to a verb (확인 → 확인하다,
  출발 → 출발하다, 충전 → 충전하다).
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
- **Visit Busan** (`visitbusan.net/en`): official Busan tourism portal per search results,
  but the exact URL was not confirmed, so the Busan card cites `busan.go.kr/eng/tourism`.
- **Gyeongju city tourism site**: not found in search results; the Gyeongju card cites
  VISITKOREA instead.
- **UNIST campus health service and airport pickup**: not confirmed; the cards tell you
  to ask UNIST.
- **Bus routes near UNIST** (337, 327, 807, 304): UNIST pages name different routes.
- **YouTube handles** (TTMIK by channel id, @KoreanUnnie, @seemile, @koreanenglishman,
  @asianboss, GO! Billy's /user/ link): taken from listing sites.

Phase 7, Korea apps guide (not in the app, or in it only as "unconfirmed"):

- **Google Play package names** for K.Ride, KakaoMetro, Subway Korea, Express Bus T-money,
  T-money GO, Shuttle, CatchTable Global, Naver, KakaoBank, Hana EZ, WOWPASS, Kakao Pay,
  Everytime, UNIST mPortal, VISITKOREA, Emergency Ready App and E-Gen: not confirmed, so the
  app opens a Google Play search. The Emergency Ready App's App Store id (826120919) comes
  from a third-party listing that matches its name and features.
- **Kakao T with a foreign number and card:** sources disagree.
- **Baemin sign-up with an overseas number:** most 2026 guides say yes, one says no.
- **Coupang Eats, Yogiyo, CatchTable Global sign-up rules:** sources disagree.
- **KORAIL+ English mode and foreign cards** after the August 2026 change.
- **Express bus booking with foreign cards** (Korea Herald, from August 2026): which app or
  site it applies to.
- **T-money GO "foreigner" login** (claimed by one unofficial guide, March 2026).
- **KakaoBank foreign-resident account:** whether the accepted ID must be the ARC.
- **Everytime verification for exchange students:** not documented anywhere I found.
- **Shuttle delivery in Ulsan:** coverage not confirmed.
- **Naver Plus Store with foreign cards**, and whether passport verification covers shopping.
- **Residence Card fee** (one university page says ₩30,000, cash): left out of the app; ask
  UNIST.
- **Papago offline packs:** confirmed for Korean and English by guides and the store listing;
  the exact list of offline languages varies by source.
- Left out entirely: Klook, Trip.com and other third-party booking apps, KakaoBank's Android
  link, Wise and other remittance apps, Uber (not researched this phase).
