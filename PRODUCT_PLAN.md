# Mobile Mathematics Trainer — Product and Delivery Plan

Status: Phases 1–4 implemented; Phase 4 was intentionally delivered before Phase 3. The family-pilot phase remains proposed. Reward model revised 1 September 2026 for child-collected rewards and later parent redemption.
Working title: **Mathe-Mission** (final name should be chosen with the child)

## 1. Product decision

Build a German-language, installable single-page web app for a child in the Swiss 2nd primary class. It should run in a phone or tablet browser, work offline after the first visit, and feel like a small game rather than a worksheet.

The first release should be:

- **aligned to the skills and progression of the current _Schweizer Zahlenbuch 2_**, but use independently written questions, visuals, stories, and code;
- **local-first and private**: no account, advertising, tracking, social features, or backend;
- based on a repeatable reward round: **choose a reward → start a mission → solve tasks from its maths category → reach the point goal → collect the reward → begin a fresh round**;
- controlled by a small parent area where a catalogue of rewards, their goals/categories, content unlocks, and accessibility options can be changed;
- child-paced: reaching the goal stops that scored round, but the child can collect the finished reward and choose another mission without a PIN;
- parent-redeemed: each collected reward remains visibly open until an adult redeems that individual item through the PIN gate.

Recommended default: **100 points in “Zahlen bis 100” = 30 minutes of gaming**. A parent can create a list such as “15 minutes reading a comic — 100 points — Zahlen bis 100”. The child chooses one option before each round. Completing the round stores an immutable reward snapshot, resets active progress, and makes another round available immediately; later catalogue changes do not alter already collected items.

## 2. What the research implies

### Curriculum and textbook alignment

The current _Schweizer Zahlenbuch 2_ is for 2nd class and centres arithmetic on the number range to 100. Its official materials also cover shapes, decomposing/completing/halving/doubling, quantities, addition and subtraction, symmetry, an introduction to multiplication, number stories, solids and plans, applied problems, extension, and mini-projects. The workbook includes concrete learning aids such as place-value cards, five/ten strips, a tangram, a number/multiplication angle, and a hundred-dot field.

The older public Blitzrechnen guidance gives a useful skill taxonomy for the 100 range: recognise numbers on a hundred field/table, count, complete to the next ten, count in 2/5/10 steps, complete to 100, split 100, double, do simple addition/subtraction, halve, decompose tens, and work with arrays. The publisher notes that multiplication expectations changed under Lehrplan 21 and its digital practice does not map one-to-one to the book. Therefore the app should treat multiplication in 2nd class as **conceptual arrays, repeated addition, and fair sharing**, disabled until the parent selects that the topic has begun; it should not initially demand memorisation of all multiplication tables.

This is a companion trainer, not a digital copy of the book. Do not scan pages, reproduce exercise wording or artwork, use publisher logos, or imply endorsement. Before a public/commercial launch, confirm naming and marketing claims with an IP/licensing review.

### Learning design

Interactive apps show useful but still mixed evidence for early learning, with the clearest benefits in early mathematics. Gamification can help motivation, but superficial points and public leaderboards can shift attention away from learning or make struggling pupils feel less competent. The app will therefore use:

- an adjustable challenge level so the child usually succeeds with thought;
- informative, kind feedback and visual strategies after mistakes;
- a choice between three equivalent missions to support autonomy;
- personal progress only—no rankings, competition, loot boxes, streak loss, or countdown pressure;
- short, spaced review across days instead of long drill sessions;
- points for resolving a task, while a separate mastery model—not visible status—uses first-try accuracy and hints to schedule review.

The AAP's current child-centred guidance favours designs that support disengagement rather than maximising time on screen. Reaching the goal therefore ends the scored round and requires a deliberate collection and new reward choice. The app never auto-starts the next mission, uses streak pressure, or silently continues awarding points. Families retain control through the parent-defined catalogue and PIN-protected real-world redemption.

## 3. Core user experience

### Child loop

1. **Home:** show the active round, for example “0 / 100 Punkte”, its chosen reward, and one large start/continue button. Link clearly to the reward collection.
2. **Choose reward and mission:** select one parent-defined reward, then one of three visually distinct mission skins. Tasks come from the maths category attached to the reward.
3. **Play:** one task at a time, large touch controls, optional read-aloud button, no persistent timer. The progress path visibly advances by 10 points for every completed task.
4. **Learn from errors:** the first wrong answer gets “Fast—probier noch einmal”; the second reveals a relevant visual aid and a simpler nearby example. The child then resolves the original task.
5. **Finish and collect:** at the goal, show a calm celebration. The child collects an immutable reward snapshot; this advances the round and resets active points and completed-task IDs without a PIN.
6. **Repeat:** the child may choose another catalogue reward immediately. A new round seed produces distinct tasks, even on the same date.
7. **Redeem later:** the reward screen lists open and redeemed items. An adult enters the PIN to redeem one open item, which remains listed with status “Eingelöst”.

### Reward-round lifecycle

There is exactly one **active round** at a time. Calendar dates group attempts and redemption history for the parent view; they do not restrict how many vouchers can be earned.

| State | Entry condition | Child action | Parent action | Stored result |
|---|---|---|---|---|
| Reward choice | No active round | Choose one parent-defined reward | Manage the catalogue | Selected reward ID and its category/goal |
| Active round | Reward and mission skin selected | Start/continue tasks | May manage future reward options | Current points and unique completed-task IDs |
| Reward ready | Active points reach the selected goal | Collect reward; no more scored tasks | No action required | Completed round remains unchanged until collection |
| Collected | Child confirms collection | Choose another reward immediately | May redeem the collected item later | Immutable reward snapshot; round increments and progress resets |
| Redeemed | Adult passes the PIN gate for an open item | View “Eingelöst” status | Confirm real-world redemption | Redemption timestamp added to the collected item |

### Point and reward rules

- Each unique resolved challenge awards **10 points in the active round** exactly once, independent of mistakes. This makes the reward attainable and does not punish learning.
- Default goal: **100 points / 10 completed challenges**, normally 8–12 minutes.
- Each catalogue option has a parent-selectable goal from 50, 60, …, 200 points and one maths category.
- Each reward has configurable text plus optional duration, e.g. “15 Min. Comic lesen”.
- Progress persists through refreshes and offline use. Reopening or using Back cannot duplicate points.
- Reaching the goal locks the active round on the finish screen. Collecting stores the reward label, duration, category, points, date/time, and round number as a snapshot.
- Collection immediately opens a fresh round and never requires a PIN. There is no software-imposed daily collection maximum.
- Real-world redemption is separate and parent-approved. It changes only the selected collected item's status and never resets mission progress.
- Collection and redemption transitions are idempotent: reloading or repeated actions cannot duplicate or lose a reward.
- Challenge identifiers and deterministic generator seeds include the calendar date, round number, and task slot. A same-day restart therefore uses distinct task IDs and a newly varied mission.
- Changing or removing a catalogue reward affects future choices; collected and redeemed items keep the exact snapshot earned at the time.
- Accuracy, speed, and hint use do **not** affect the real-world reward. Response time may be kept locally for task selection but is never presented as pressure.

### Parent area

Protected by a four-digit PIN and visually separate from child play:

- create/remove catalogue rewards with label, optional duration, point goal, and maths category;
- enable/disable content families available to reward categories;
- see current-round points/tasks, collected/open reward counts, and a simple seven-day view of tasks, first-try success, hints, and skills needing review;
- toggle sound/read-aloud, reduced motion, higher contrast, and left-handed number-pad layout;
- use the child reward screen to redeem a specific collected item and retain a clear on-device audit entry;
- export/import an on-device JSON backup and reset data after confirmation.

Do not label a child as “weak” or show red failure statistics. Use parent language such as “needs another look”, “learning”, and “secure”.

## 4. Curriculum map and original game modes

| Zahlenbuch 2 area | App mission / original interaction | Initial scope |
|---|---|---|
| Numbers to 100 | Build a number from tens and ones; reveal/read a hundred field; place/order numbers on a number line | MVP |
| Counting and patterns | Move forward/backward in 1, 2, 5, or 10 steps; find a missing sequence item | MVP |
| Decompose and complete | Split tens in multiple ways; complete to the next ten or to 100 using strips/fields | MVP |
| Addition and subtraction I/II | Add/subtract tens or ones, then cross a ten using a number line, place-value blocks, or split strategy | MVP |
| Double and half | Pair dot groups, mirror sets, or share an even collection into two equal groups | MVP |
| Quantities | Pay exact CHF amounts with clearly symbolic denomination tokens (not reproduced banknotes); read full/half/quarter hours; estimate and compare cm/m lengths | Wave 2 |
| Figures and symmetry | Sort/name shapes, complete a mirror image, compose a target from simple pieces | Wave 2 |
| Multiplication introduction | Build and read rectangular arrays; relate repeated addition; fair sharing with remainders excluded initially | Wave 2, parent unlock |
| Number stories and applied tasks | One-sentence, read-aloud-friendly everyday problems with an interactive model before entering the answer | Wave 2 |
| Solids and plans | Match cubes/cuboids and simple views; follow or complete a small grid route | Wave 3 |
| Extension and mini-projects | Mixed “boss missions” that combine two representations or ask for more than one valid answer | Wave 3 |

Every task is generated from constraints and templates owned by this project. Text should use Swiss Standard German conventions (for example `ss`, not `ß`) and age-appropriate vocabulary. A parent can select a lower reading-load mode.

## 5. Adaptive learning model

Track mastery by **skill and representation**, not only by operation. For example, “complete to 100 using a hundred field” and “complete to 100 symbolically” are related but distinct evidence.

For each skill, store locally:

- attempts, first-try correctness, hint level, and last practised date;
- a small mastery band: `new`, `learning`, `practising`, `secure`, `review`;
- allowed number range and strategy/representation;
- next review date.

Round selection:

- all tasks stay within the maths category of the reward chosen for the current round;
- 65% prefer skills due for spaced review within that category;
- 35% use other available skills from that category;
- no identical challenge within 30 days when the generator has sufficient variety;
- no more than three tasks of the same interaction in a row.

Suggested review intervals after independent success are 1, 3, 7, and 14 days. A mistake or strong hint moves the skill to a nearer review but does not remove points. After two errors, show a concrete model; after success, later revisit a structurally similar task rather than immediately repeating the same numbers.

The algorithm should begin rule-based and explainable. Machine learning would add complexity and child-data concerns without a useful MVP benefit.

## 6. Screen and interaction specification

Although it is a single-page application, use clear internal states/routes without page reloads:

- `/` — child home and active round goal;
- `/rewards` — child reward choice plus open/redeemed collection;
- `/choose` — cosmetic mission-skin choice for the selected reward;
- `/mission` — active task flow;
- `/done` — collection/finish state;
- `/parent` — parent-gated dashboard and settings.

Key layout rules:

- portrait-first from 320 CSS px, with a two-column tablet layout where helpful;
- usable in phone/tablet portrait and landscape, including safe-area insets;
- primary targets at least **48 × 48 CSS px** (above WCAG 2.2's 44 px enhanced target guidance), with generous spacing;
- default child text 20 px or larger and arithmetic prompts substantially larger;
- no reliance on colour, sound, or animation alone; visible focus and full keyboard support for testing/accessibility;
- motion is short and optional; respect `prefers-reduced-motion`;
- no confetti storm, autoplay music, flashing, shame messages, or decorative interruptions during a calculation;
- always provide text alongside optional spoken instructions.

## 7. Technical architecture

Recommended stack for this greenfield workspace:

- **React + TypeScript + Vite** for a compact SPA;
- a small reducer/state-machine approach for the task loop, avoiding a heavy app framework;
- **IndexedDB** for settings, attempts, mastery, round progress, and redemption history;
- a web app manifest and service worker for an installable **PWA** and offline app shell/content;
- locally generated HTML/CSS/SVG visuals—no external image CDN or runtime font dependency;
- **Vitest + Testing Library** for unit/component tests and **Playwright** for phone/tablet end-to-end tests.

Suggested modules:

```text
src/
  app/                 routing, state machine, layout
  child/               home, mission, feedback, finish
  parent/              gate, settings, progress
  curriculum/          skill catalogue and unlock sequence
  exercises/           pure generators, validators, explanations
  learning/            mastery and spaced-selection rules
  rewards/             point ledger and voucher redemption
  storage/             IndexedDB schema, migrations, backup
  visuals/             hundred field, line, blocks, coins, shapes
  accessibility/       speech, motion, contrast helpers
```

Important domain records are `Skill`, `Challenge`, `Attempt`, `MasteryState`, `DailyLedger`, `RewardDefinition`, and `CollectedReward`. `DailyLedger` is a calendar grouping and active-round container, not a daily reward limit.

The persisted reward shape is conceptually:

```text
DailyLedger
  dateKey
  round                    current zero-based round number
  points                   points in the active round only
  activeRewardId           selected catalogue option, or null between rounds
  awardedChallengeIds[]    duplicate-award guard for the active round

RewardDefinition
  id
  label
  minutes
  pointsGoal
  schoolTopic

CollectedReward
  id, rewardId, dateKey, round
  collectedAt, redeemedAt
  rewardLabel, rewardMinutes
  points, schoolTopic
```

Challenge generation is deterministic from `dateKey + round + task slot + skill + difficulty`. Refresh/retry therefore keeps the current question stable, while a collected same-day round receives distinct IDs and a different deterministic seed.

Persistence migrations must preserve unfinished points and attach the legacy global reward as its active reward. Legacy redemptions become already-redeemed collected items, while a legacy completed day receives a usable fresh round.

### Privacy and safety

- Store everything on the device in v1; use an optional nickname only and collect no date of birth, school, email, location, voice, or contacts.
- No analytics, advertisements, cookies, third-party scripts, social sharing, push notifications, or dark patterns.
- Hash the local parent PIN with Web Crypto and rate-limit retries. It is an adult gate, not high-security authentication.
- Apply a restrictive Content Security Policy and make export/reset adult-only.
- Swiss data protection requires privacy by design/default. If cloud sync, accounts, telemetry, or school use is added later, do a fresh privacy/legal review, provide appropriate information and consent flows, minimise child data, define retention/deletion, and assess any foreign hosting.

## 8. Delivery plan

### Phase 0 — alignment and paper prototype (2–3 days)

- Confirm which edition and chapter the school currently uses.
- Test the reward choice → 10 tasks → child collection → later parent redemption flow on paper with the child.
- Let the child choose the theme/mascot from two or three calm concepts.
- Finalise original naming and copyright boundaries.

Exit: parent and child understand collection versus redemption without explanation; current school topics are known.

### Phase 1 — app foundation (4–5 days)

- Scaffold the TypeScript SPA/PWA, responsive shell, offline cache, and local database.
- Implement child home, mission state machine, parent gate/settings, active-round point ledger, calendar grouping, child collection, later reward redemption, and migration from the former once-per-day model.
- Add accessibility settings and install guidance for iOS/iPadOS and Android.

Exit: a placeholder 10-task round reliably collects a reward across refresh/offline scenarios, resets to 0, can start a second same-day round before redemption, and retains later redemption status.

### Phase 2 — arithmetic MVP (8–10 days)

- Implement pure, tested generators for numbers to 100, hundred field, number line/order, counting steps, complements, addition/subtraction, doubling/halving, and decomposing.
- Add the hundred field, place-value blocks, strips, and number-line explanations.
- Add rule-based difficulty and spaced review.

Exit: every generated task is valid, has a relevant explanation, and can complete a balanced reward round.

### Phase 3 — game layer and parent insight (4–5 days)

Status: **implemented after the Phase 4 curriculum expansion**.

- Added three child-selectable mission skins per round: Zahlenweg, Formenwerkstatt, and Markttag.
- Added a responsive route map that advances once per resolved task, calm success motion, reduced-motion support, and optional quiet confirmation tones.
- Added four cosmetic learning badges derived only from personal mastery evidence; badges never affect reward points or task access.
- Added a seven-day parent overview of tasks, first-try success, visual-help use, collected rewards, and supportive review suggestions.
- Added explicit parent unlocks for quantities/stories, figures/symmetry, and conceptual multiplication/sharing.
- Migrated the local schema to version 6 while preserving active points, mastery, settings, attempts, and legacy reward history.

Exit: the app feels playful, every round stops at its configured goal, and collection deliberately opens the next child-selected round without conflating it with real-world redemption.

### Phase 4 — broader Zahlenbuch coverage (8–10 days)

Status: **implemented ahead of Phase 3**.

- Added money/time/length, figures/symmetry, conceptual multiplication/sharing, and short number stories as eight adaptive skill families at four levels.
- Added original symbolic coin, analogue clock, ruler, polygon, symmetry-grid, array, and sharing visuals.
- Added parent-selectable school topics and an explicit, default-off unlock for multiplication and sharing.
- Extended local mastery, deterministic generation, schema migration, and parent progress from 10 to 18 skills.
- Added Swiss-context wording while keeping written UI in Swiss Standard German.

Exit: the app covers all major 2nd-class strands, not only arithmetic drill.

### Phase 5 — family pilot and hardening (5–7 days spread over 2 weeks)

- Observe 5–10 real sessions without coaching and note confusion, fatigue, guessing, and favourite interactions.
- Tune task length/difficulty; test on at least one small phone, iPhone/iPad Safari, and Android Chrome.
- Run accessibility, offline/update, storage migration, duplicate-award, and property-based generator tests.
- Ask the class teacher to review the skill order if possible; do not send child performance data.

Exit: the child can independently start, learn from a mistake, reach the goal, stop, and ask the parent to redeem; after approval, the fresh round is understandable without explanation.

Estimated focused build time: **5–7 weeks for a polished family-use v1**, with the arithmetic MVP usable after roughly 2–3 weeks.

## 9. MVP acceptance criteria

The initial usable release is done when:

- it installs or runs normally on current phone/tablet browsers and works offline after first load;
- a parent can define a local catalogue including “15 minutes reading a comic = 100 points in Zahlen bis 100”;
- the child can choose one catalogue option before a mission, whose category controls the skills used in that round;
- exactly 10 resolved tasks reach the default goal, and refresh/back/retry cannot duplicate points;
- reaching the goal freezes scoring until the child collects the reward, without requiring a PIN;
- every collected reward is retained after restart, and collection immediately opens a fresh round at 0 points;
- collected rewards remain individually parent-redeemable and listed afterward as “Eingelöst”;
- two complete rounds can be collected on the same calendar day without either one first being redeemed;
- a second same-day round uses distinct challenge IDs and cannot collide with the first round's duplicate-award guard;
- reloading before/after collection or redemption cannot duplicate a reward, lose it, or restore points from a collected round;
- legacy once-per-day data migrates so redeemed rewards remain in history while the child receives a usable fresh round;
- the adaptive session uses at least six arithmetic/number task families in the 0–100 range;
- every wrong-answer path supplies a supportive, mathematically relevant visual strategy;
- multiplication is off by default and can be unlocked by the parent;
- layouts work at 320, 390, 768, and 1024 CSS px in relevant orientations;
- targets, contrast, zoom/reflow, reduced motion, keyboard focus, and screen-reader labels pass the agreed WCAG 2.2 checks;
- generator property tests prove all operands/results meet their skill constraints and all presented answers are unambiguous;
- no network request is required during a completed offline session, and no personal data leaves the device.

## 10. Success measures for the first month

Keep these measures on-device and review them together with the parent; do not optimise for raw screen time.

- The child independently finishes short rounds and can deliberately choose another parent-defined reward without artificial streak or autoplay prompts.
- Median round time stays around 8–12 minutes.
- More than 80% of started rounds end at the goal rather than being abandoned.
- Hint use on reviewed skills trends down while first-try success trends up.
- The child can explain at least one visual strategy, not merely type answers.
- The parent can always tell which rewards are collected, which remain open, and which were redeemed.
- There are no repeated disputes about whether a reward was earned, already redeemed, or reset correctly.
- After two weeks, the child still sometimes chooses a mission voluntarily; if not, revise the experience rather than raising rewards or adding pressure.

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The external gaming reward crowds out interest in maths | Keep the reward predictable and modest; add choice, mastery feedback, and explanation; never escalate rewards automatically. |
| Child taps randomly until correct | Adapt downward, vary input formats, require constructing/choosing a model sometimes, and review guessing patterns in the parent view. |
| App becomes only a speed drill | No scoring by time; include visual, verbal, geometry, quantity, and applied tasks. |
| Content runs ahead of school | Parent-controlled chapter/topic unlocks; multiplication off by default. |
| Incorrect or ambiguous generated tasks | Pure generators, invariants/property tests, reviewed text templates, deterministic seeds. |
| Copyright/trademark conflict | Original content and visuals, no scans/logos/copied wording, no implied publisher affiliation, pre-launch legal review. |
| Device loss erases progress | Optional parent-controlled JSON export/import in v1; consider privacy-reviewed sync only if actually needed. |
| Repeatable rewards create an uncontrolled loop | Every scored round ends explicitly, the child must collect and choose again, and the available goals are parent-defined. The app never auto-starts the next round or adds streak pressure. |
| Collection or redemption duplicates incorrectly | Treat collection (snapshot plus round reset) and later redemption (status timestamp) as separate idempotent transitions; test reloads and duplicate actions around both boundaries. |

## 12. Research sources

- [Klett und Balmer: Schweizer Zahlenbuch 2, new edition](https://www.klett.ch/lehrwerke/schweizer-zahlenbuch/zyklus-1/schweizer-zahlenbuch-2-neue-ausgabe)
- [Klett shop: workbook contents and included learning materials](https://www.klett.ch/shop/artikel/978-3-264-84711-6)
- [German National Library: contents of the current teacher volume](https://d-nb.info/1209415259/04)
- [Klett: public Blitzrechnen guidance and skill progression](https://downloads.klett.ch/uploads/images/textbooks/Dateien/Blitzrechenoffensive-mit-dem-Schweizer-Zahlenbuch-1-4-978-3-264-10928-3-klett-und-balmer.pdf?v=1562682143)
- [Klett: Lehrplan 21 changes affecting multiplication](https://www.klett.ch/lehrwerke/schweizer-zahlenbuch/didaktik/schweizer-zahlenbuch-neuausgabe)
- [Lehrplan 21: mathematics, number and variable](https://zg.lehrplan.ch/index.php?code=a%7C5%7C0%7C1%7C1%7C2)
- [Meta-analysis: gamification, intrinsic motivation, autonomy, and competence](https://link.springer.com/article/10.1007/s11423-023-10337-7)
- [AAP: current policy for child-centred digital ecosystems](https://publications.aap.org/pediatrics/article-pdf/157/2/e2025075320/1907776/pediatrics.2025075320.pdf)
- [Pediatrics systematic review: apps as learning tools](https://publications.aap.org/pediatrics/article-abstract/145/1/e20191579/36974/Apps-As-Learning-Tools-A-Systematic-Review)
- [Frontiers: retrieval practice in real primary-school settings](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1632206/pdf)
- [W3C: WCAG 2.2 target size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced)
- [MDN: installable progressive web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Swiss FDPIC/EDÖB: privacy by design and privacy by default](https://www.edoeb.admin.ch/de/das-neue-datenschutzgesetz-aus-sicht-des-edob)
