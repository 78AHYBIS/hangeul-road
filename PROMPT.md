# Hangeul Road — Claude Code Build Prompt

A personal Korean-learning app for my UNIST exchange (Ulsan, South Korea, Spring 2027).

## How to use this file

1. Create an empty folder (for example `hangeul-road`), put this file inside it as `PROMPT.md`, and open Claude Code there.
2. Paste the **Kickoff message** below. Claude Code will read this file and do Phase 0 only.
3. For every later phase, start a fresh Claude Code session and paste the **Phase message** below with the phase number changed.
4. Test each phase by hand before moving on. Do not run two phases in one session.

**Kickoff message**

```
Read PROMPT.md fully. Then do Phase 0 only. Before writing code, tell me your plan in a short list and ask me anything that is unclear. Stop when the Phase 0 acceptance checklist passes.
```

**Phase message (reuse for phases 1 to 8)**

```
Read PROMPT.md, CLAUDE.md and PROGRESS.md. Do Phase N only. Show me a short plan first, then build it. Run the checks, update PROGRESS.md, and stop when the Phase N acceptance checklist passes.
```

---

## 1. Who this is for and why

I am Aidar, a second-year Information Systems student from Kazakhstan. I fly to Korea on **25 February 2027** for an exchange semester at **UNIST in Ulsan** (semester 1 March to 18 June 2027). I am starting Korean from zero, and I have roughly 14 weeks.

I already use Duolingo and I will keep using it, but it is not enough for me because:

- it moves past the alphabet too fast, and I want to read Hangul with real confidence;
- its vocabulary is not the vocabulary I will need in a dorm, a cafeteria, a bank or a bus;
- it explains almost nothing about Korean culture and daily life;
- it does not point me to good outside courses and channels.

So I want **one app** that is my home base: it teaches the alphabet properly, drills useful vocabulary, gives me a short list of tasks every day, keeps all my outside courses and channels in one library, teaches me how life in Korea works, and tells me which apps I will need there.

**Realistic target by 25 February 2027** (design the content around this, not around fluency):

- read and write Hangul without romanization, including sound-change rules;
- know about 600 to 800 high-use words;
- handle survival situations politely: greetings, self-introduction, ordering, shopping, directions, transport, dorm and campus talk;
- understand basic etiquette so I do not offend anyone;
- have every essential Korean app installed and understood before I land.

I speak English, Russian and Kazakh. The app interface is in **English**.

## 2. Product principles

These matter as much as the features.

1. **Consistency over perfection.** A normal day is 20 to 30 minutes. There is also a 5-minute "minimum day" that still counts.
2. **No guilt.** A missed day never shows shame messages, lost progress or red warnings. The app says where to restart and nothing more.
3. **Few tasks, high impact.** At most 5 tasks a day. Never pile missed tasks onto the next day.
4. **Hangul first.** Romanization is shown only in the first Hangul lessons, then hidden by default with a toggle.
5. **Real-life Korean.** Prefer words and phrases an exchange student uses in week one over textbook lists.
6. **Polite speech by default.** Teach the 해요 / 합니다 style first. Casual speech is marked clearly as casual.
7. **Offline and private.** Everything works without internet after the first load. No account, no server, no tracking.
8. **Phone first.** I will mostly use it on my phone, so design for a narrow screen and make it installable.

## 3. Tech stack and architecture

Use this unless you have a strong reason to change it, and if you do, ask me first.

- **React + TypeScript + Vite**, single-page app, React Router.
- **Tailwind CSS** for styling. Clean, calm, modern look. Light and dark mode.
- **State and storage:** Zustand (or React context) with persistence in **IndexedDB** through a small wrapper (Dexie is fine). No backend.
- **PWA:** installable, offline cache for the app shell and all content.
- **Audio:** browser Web Speech API with a `ko-KR` voice for pronunciation. Detect when no Korean voice exists and show a clear fallback message instead of failing silently.
- **Tests:** Vitest for logic (spaced repetition, daily task generator, streak rules). ESLint + Prettier.
- **Deploy:** GitHub Pages under my account `78AHYBIS`, through a GitHub Actions workflow.

**Content is data, not code.** All learning content lives in typed JSON or TS files under `src/content/` (`hangul/`, `vocab/`, `grammar/`, `phrases/`, `culture/`, `resources/`, `korea-apps/`). Each has a schema, and a `npm run validate:content` script checks every file (required fields, unique ids, no empty Korean text, no broken internal references). I must be able to add a word or a resource by editing one file.

**Suggested structure**

```
src/
  app/            routing, layout, providers
  features/       hangul, vocab, daily, library, grammar, culture, korea-guide, settings
  content/        all learning data + schemas
  lib/            srs, scheduler, storage, speech, date helpers
  components/     shared UI
```

## 4. Rules for you, Claude Code

1. **One phase per session.** Do not start the next phase even if you finish early.
2. **Plan first.** Show me a short plan and wait for my OK before large changes.
3. **Keep two files up to date:** `CLAUDE.md` (stack, commands, conventions, content schemas) and `PROGRESS.md` (what is done, what is next, known issues, decisions made). The next session depends on them.
4. **Korean accuracy is critical.** I cannot check your Korean yet, so wrong content will teach me mistakes.
   - Use only standard, common, textbook-level Korean you are sure about.
   - Every item needs Hangul, meaning, and an example sentence in polite style where it applies.
   - If you are unsure about a word, a spelling or a nuance, leave it out or mark it `"needsReview": true`, and list those items in `PROGRESS.md`.
   - Never invent slang, idioms or cultural "facts".
5. **Never invent links.** For the resource library and the Korea apps guide, verify each item with web search before adding it: it exists, the URL is the official one, and the description is still true. Save a `lastVerified` date on each entry. If you cannot verify something, add it to a "to check" list in `PROGRESS.md` instead of the app.
6. **Explain as you go.** I am learning React and TypeScript. After each phase, give me a short summary of the important design decisions and which files to read to understand them. Keep it brief.
7. **Finish properly.** Before you stop: run lint, tests, content validation and a production build, then walk through the acceptance checklist and tell me honestly which items pass.
8. **Commit after each phase** with a clear message. Do not push or deploy unless the phase says so or I ask.

---

## 5. Build phases

### Phase 0 — Foundation

**Goal:** a working, empty app shell that every later phase plugs into.

Build:

- Project setup with the stack above, scripts for `dev`, `build`, `test`, `lint`, `validate:content`.
- App layout with bottom navigation on mobile: **Today, Learn, Library, Korea, Me**.
- Placeholder pages for each section.
- Storage layer with a versioned schema and **export / import of all progress as a JSON file** (so I never lose data when I switch phones).
- Settings: light/dark mode, daily goal (minimum / normal / intense), show romanization on or off, speech rate.
- Departure countdown on the Today page: days until 25 February 2027 (date editable in settings).
- `CLAUDE.md` and `PROGRESS.md` created.

Acceptance:

- [ ] `npm run dev`, `build`, `test`, `lint` all succeed.
- [ ] All five sections open on a phone-sized screen.
- [ ] Settings persist after reload.
- [ ] Export then import restores the same state.

### Phase 1 — Hangul mastery

**Goal:** I can read any Korean syllable out loud without romanization.

Build:

- **Lessons in small groups:** basic vowels, basic consonants, aspirated consonants, double (tense) consonants, compound vowels, final consonants (batchim).
- For each letter: large display, sound description for an English/Russian speaker, audio, a memory hint, and which letters it gets confused with.
- **Syllable block builder:** combine consonant + vowel (+ batchim) and hear the result, so I understand how blocks are formed.
- **Stroke order** shown step by step (simple animation or numbered strokes).
- **Sound-change rules** as short lessons with examples: linking of batchim to the next syllable, the seven final-consonant sounds, nasalization, tensing, aspiration with ㅎ. Keep to the main rules a beginner meets.
- **Drills:** letter to sound, sound to letter, look-alike pairs (for example ㅓ/ㅗ, ㅐ/ㅔ, ㄱ/ㅋ/ㄲ), read-the-syllable, read-the-word, and a timed reading drill that tracks my speed over time.
- **Real-world reading:** loanwords written in Hangul (coffee, bus, taxi, internet), brand and place names, including 울산 and 유니스트, and typical sign and menu words.
- **Typing practice** on the standard Korean two-set (dubeolsik) keyboard layout, with an on-screen layout map.
- A **Hangul progress map** that shows each letter as new, learning or solid based on my drill accuracy.

Acceptance:

- [ ] All 40 letters (14 basic consonants, 5 double consonants, 10 basic vowels, 11 compound vowels) are covered.
- [ ] Every drill works by tap on mobile and records accuracy per letter.
- [ ] Audio plays, or a clear fallback shows when no Korean voice is available.
- [ ] Romanization toggle works everywhere.

### Phase 2 — Vocabulary with spaced repetition

**Goal:** steady growth to 600 to 800 useful words that stay in memory.

Build:

- **SRS engine** in `src/lib/srs` (an SM-2 style algorithm is fine): new, learning, review and mature states, with Again / Hard / Good / Easy answers. Fully unit-tested.
- **Themed decks**, about 30 to 50 words each, ordered by usefulness for an exchange student:
  1. Greetings and essentials
  2. Numbers: Sino-Korean and native Korean, with counters, time, dates and money
  3. People, family and self-introduction
  4. Campus, classes and dorm
  5. Food, cafeteria, restaurants and cafes
  6. Convenience store, shopping and prices
  7. Transport and directions
  8. Places in a city
  9. Time, days, weather and seasons
  10. Essential verbs
  11. Essential adjectives
  12. Health, pharmacy and emergencies
  13. Bank, phone and documents (ARC, SIM, account)
  14. Tech and IT words
  15. Feelings, hobbies and making friends
- Each word: Hangul, English meaning, part of speech, example sentence in polite style with translation, audio, optional note (formality, common mistake).
- **Card types that rotate:** Korean to meaning, meaning to Korean, listening (audio only), and typing the word in Hangul.
- **Number trainer:** a dedicated drill for both number systems, prices in won, telling time and phone numbers, because numbers are hard and I need them daily.
- Limits: new words per day follow my daily goal setting (for example 5 / 10 / 15); reviews are capped so a missed week never creates a wall of 300 cards.
- Deck browser with search, and a "my words" deck where I add my own words.

Acceptance:

- [ ] At least 600 words pass `validate:content`, with no `needsReview` items hidden from me.
- [ ] SRS tests cover scheduling, lapses and the review cap.
- [ ] I can finish a review session with one hand on a phone.

### Phase 3 — Daily tasks, roadmap and progress

**Goal:** I open the app and know exactly what to do today, in under 30 minutes.

Build:

- **Roadmap** from today to departure, split into weekly stages (for example: weeks 1–2 Hangul, weeks 3–6 core vocabulary and first grammar, weeks 7–10 survival situations, weeks 11–14 review and arrival prep). Generate it from the start date and departure date so it still works if I start late.
- **Today page** with at most 5 tasks, generated each day from the roadmap and my SRS state. Typical day:
  1. SRS reviews
  2. One new lesson (Hangul, vocabulary, grammar or phrases, depending on the stage)
  3. One short drill on my weakest area
  4. One culture or Korea-life card
  5. External task: "Duolingo done" checkbox, or one item from my active course in the Library
- **Three day sizes:** minimum (about 5 minutes: reviews only), normal (20–30 minutes), intense (45+ minutes, optional).
- **Forgiving streak:** a minimum day keeps the streak; I get automatic rest days (for example 1 per week); after a break the app shows "welcome back, here is today's plan" and a lighter first day.
- **Weekly review** screen: days studied, words learned, accuracy, weakest items, and one suggested focus for next week.
- **Progress page:** words by state, Hangul reading speed over time, a study calendar, time studied.
- A light XP or level system is fine if it stays subtle. No hearts, no lives, no punishing mechanics.

Acceptance:

- [ ] The task generator and streak rules have unit tests, including missed days and a late start.
- [ ] A new day never carries over yesterday's unfinished tasks as debt.
- [ ] The Today page is useful on day 1 and on day 100.

### Phase 4 — Resource library

**Goal:** every outside course, channel and tool I use lives in one place, with my progress.

Build:

- Library with **filters** (type: course, YouTube channel, website, app, podcast, book, dictionary, tutor/exchange; skill: Hangul, vocabulary, grammar, listening, speaking, culture, TOPIK; level; free or paid) and search.
- Each resource: name, type, verified link, short honest description, why it is useful for me, level, cost, `lastVerified` date.
- **My status** per resource: not started, in progress, finished, dropped, plus personal notes.
- **Active course tracking:** I mark one or two resources as active; for those I can enter lessons or units and tick them off, and the next unit appears as the external task on the Today page.
- **Recommended path:** a short ordered list telling me what to use at each stage, so I do not try ten resources at once.
- I can add my own resources from the app.

Seed the library by researching and verifying these, then add other strong ones you find:

- Structured courses and sites: Talk To Me In Korean, How to Study Korean, King Sejong Institute online courses, Yonsei University's "First Step Korean" on Coursera, GO! Billy Korean.
- YouTube: Talk To Me In Korean, GO! Billy Korean, Korean Unnie, Seemile Korean, plus two or three good channels about daily life and culture in Korea.
- Tools: Naver Dictionary, Papago, Anki, Forvo.
- Speaking practice: italki, HelloTalk, Tandem.
- Udemy: search for the two or three best-rated beginner Korean courses, mark them as paid, and say honestly whether a free option covers the same ground.
- TOPIK: the official TOPIK site and one good TOPIK I preparation resource, marked as optional.
- UNIST and Ulsan: official UNIST pages for international or exchange students, and official Ulsan and Korea tourism sites.

Acceptance:

- [ ] At least 30 resources, every one verified by web search during this phase.
- [ ] Unverified ideas are listed in `PROGRESS.md`, not shown in the app.
- [ ] Marking an active course changes what the Today page suggests.

### Phase 5 — Grammar and survival phrases

**Goal:** I can build simple polite sentences and get through common situations.

Build:

- **Grammar lessons**, short and in a fixed order, each with a plain explanation, 4 to 6 examples, and practice:
  sentence order (subject–object–verb); 이에요/예요; topic and subject particles (은/는, 이/가); object particle (을/를); place and time particles (에, 에서); polite present tense (아요/어요); negatives (안, 못); past tense; future and intention; wanting (고 싶어요); polite requests (주세요); asking questions; there is / there is not (있어요/없어요); and, but, because; honorific basics and when to use formal 합니다 style.
- **Practice types:** choose the particle, arrange the words into a sentence, fill the blank, translate a short sentence by picking tiles.
- **Situation phrase packs**, each with a short dialogue, key phrases, audio and a quiz: first meeting and self-introduction; dorm check-in; cafeteria and restaurants; cafes; convenience store; shopping and asking prices; bus, subway and taxi; asking directions; bank and phone shop; pharmacy and hospital; talking to a professor; talking to classmates and making friends; emergencies.
- **Self-introduction builder:** I fill in my details (name, country, university, major, hobbies) and get a correct polite self-introduction I can practise and listen to.
- **Phrasebook mode:** large-text phrase cards that work offline, to show to someone or read out in a real situation.

Acceptance:

- [ ] At least 15 grammar lessons and 12 phrase packs pass content validation.
- [ ] Grammar and phrases are wired into the daily task generator at the right roadmap stages.
- [ ] Phrasebook works with no network.

### Phase 6 — Culture and daily life

**Goal:** I understand how things work in Korea before I arrive.

Build:

- **Short readable cards** (2 to 3 minutes each) grouped by topic, each with "what to do", "what to avoid" and related Korean words:
  - Respect and hierarchy: age, seniors and juniors, titles, bowing, speech levels in real life.
  - Dining etiquette: who starts eating, pouring drinks, chopsticks and spoon, sharing dishes, paying.
  - University life: relationship with professors, group projects, clubs, student festivals, senior–junior culture.
  - Dorm and housing life: rules, quiet hours, laundry, **waste sorting and recycling**.
  - Getting around: transit cards, bus and subway etiquette, intercity buses and trains.
  - Money and shopping: card payments, convenience stores, markets, delivery culture.
  - Social life: making friends, group outings, drinking culture and how to decline politely, cafes and study cafes.
  - Holidays and seasons: Seollal, Chuseok, spring cherry blossom season, national holidays during my semester.
  - Food: common dishes, spice levels, how to ask what is in a dish, typical cafeteria meals.
  - Communication style: indirectness, nunchi, messaging habits.
  - Safety and health: emergency numbers, pharmacies, what to do if I am sick.
- **Ulsan and UNIST section:** the city, the campus area, how to get to Ulsan from the airport I land at, nearby cities worth visiting (Busan, Gyeongju), student-friendly places.
- A quick quiz after each topic, and culture cards feeding the daily task list.

Rules for this phase: keep it factual and practical, avoid stereotypes, and say "this varies" when it does. Verify anything time-sensitive (holiday dates in 2027, transport options, emergency numbers) with web search.

Acceptance:

- [ ] At least 40 culture cards across all topics.
- [ ] Time-sensitive facts carry a `lastVerified` date.
- [ ] The Ulsan/UNIST section exists and cites official sources in the card footers.

### Phase 7 — Korea apps and arrival guide

**Goal:** I know which apps to install, what each is for, and what I can only set up after arriving.

Build:

- **App directory by category.** For each app: what it does, why locals use it instead of the global alternative, whether it has an English interface, **whether it needs a Korean phone number or Alien Registration Card (ARC)**, whether foreign cards work, and store links.
  - Maps and navigation: Naver Map, KakaoMap.
  - Translation and dictionary: Papago, Naver Dictionary.
  - Messaging: KakaoTalk.
  - Transport: Kakao T (taxi), a subway app, KorailTalk for trains, an intercity/express bus app, mobile T-money.
  - Food delivery and restaurants: Baemin, Coupang Eats, Yogiyo, Shuttle, CatchTable.
  - Shopping and marketplaces: Coupang, Karrot (Danggeun) for second-hand, Naver Shopping.
  - Money: a foreigner-friendly bank app, Toss, common mobile payment options.
  - Student life: Everytime, plus any official UNIST apps or portals.
  - Travel and city info: official Visit Korea resources, booking apps for trains, buses and attractions.
  - Safety: the government emergency alert app, and how emergency text alerts work.
- **Three checklists** with tick boxes that save my progress:
  1. *Before I fly:* install and set up what works without a Korean number, download offline translation packs, save key addresses in Korean, sort out eSIM or SIM plans.
  2. *First week:* SIM, transit card, campus registration, finding my way around.
  3. *After I get my ARC:* bank account, identity verification, and the apps that unlock after it.
- **"How do I…" quick answers:** get from the airport to Ulsan, take a bus, call a taxi, order food, send a parcel, buy second-hand items, find a pharmacy, pay without a Korean card.
- **Useful Korean inside apps:** a small glossary of the buttons and words I will see in Korean apps (search, order, pay, confirm, cancel, delivery, address), linked to the vocabulary decks.

Rules for this phase: foreigner access to Korean apps changed a lot during 2026, so verify every "needs Korean number / ARC" claim with current sources and store `lastVerified`. When sources disagree, say so in the entry.

Acceptance:

- [ ] At least 25 apps, each verified during this phase.
- [ ] Every app has the phone-number/ARC field filled in or marked "unconfirmed".
- [ ] Checklists persist and appear on the Today page in the last 3 weeks before departure.

### Phase 8 — Polish, offline and deploy

**Goal:** an app I enjoy opening every day, on my phone, anywhere.

Build:

- Full PWA: install prompt, offline for all content, app icon and splash screen.
- Onboarding on first launch: start date, departure date, daily goal, current level (zero / knows Hangul).
- Optional daily reminder using the Notifications API where the browser supports it, with a clear note where it does not.
- Accessibility pass: text size setting, good contrast, keyboard use on desktop.
- Performance pass: fast first load, lazy-load content by section.
- Global search across words, phrases, culture cards, resources and apps.
- "On-the-ground mode" for after I arrive: Today page switches from countdown to semester mode, with phrasebook, apps guide and reviews at the top.
- Deploy to GitHub Pages with a GitHub Actions workflow, and write a clear `README.md` with screenshots, features and tech stack (I will show this project in my portfolio).

Acceptance:

- [ ] The app installs on a phone and works in airplane mode.
- [ ] Lighthouse PWA and accessibility checks pass with no major issues.
- [ ] The deployed link works, and the README explains the project well.

---

## 6. Ideas for later (do not build unless I ask)

- AI conversation partner for role-playing situations.
- Handwriting recognition for writing practice.
- Pronunciation scoring through speech recognition.
- Import of my own Anki decks.
- A K-drama or song line of the day with a word breakdown.
- Photo journal for my exchange with Korean captions.
- Sync between phone and laptop.

## 7. Definition of done for the whole project

- I can open the app each morning, finish the day's tasks in 20 to 30 minutes, and see steady progress toward 25 February 2027.
- Hangul, vocabulary, grammar, phrases, culture, the resource library and the Korea apps guide all work offline.
- All Korean content passed validation, and anything uncertain is listed for me to check with a native speaker or teacher.
- Every external link was verified, with a date.
- My progress can be exported and restored.
