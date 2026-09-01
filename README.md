# Mathe-Mission

An installable, local-first mathematics trainer for a child in the Swiss 2nd primary class. Phases 1–4 provide the application foundation, adaptive arithmetic through 100, a calm game layer with parent insight, and broader quantities, geometry, multiplication, sharing, and story problems.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite. On a phone or tablet, deployment must use HTTPS for installation and offline service-worker behaviour.

## Available scripts

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run preview
```

The end-to-end suite runs the repeatable reward journey at phone and tablet sizes. Chromium is installed for the suite with:

```bash
npx playwright install chromium
```

## Implemented functionality

- responsive child home, adaptive number mission, two-step strategy hints, and finish screen;
- parent-defined reward catalogue, with a 50–200 point goal and maths category per reward;
- exactly 10 points per unique resolved task, resilient to refresh/back navigation;
- child-collected reward rounds that can repeat immediately, with PIN-protected redemption deferred until later;
- salted, derived parent PIN with retry throttling;
- a child reward screen with open/redeemed history, plus parent settings and current-round progress;
- IndexedDB persistence with no account, analytics, advertisements, or backend;
- automatic read-aloud, reduced motion, high contrast, and left-handed layout options;
- installable PWA assets, offline app shell, update prompt, and iOS/Android install guidance.

### Phase 2 arithmetic course

- ten original skill families: number recognition, place value, number order, counting steps, complements to a ten and to 100, addition, subtraction, doubling/halving, and decomposition;
- four rule-based difficulty levels with every operand and result constrained to 0–100;
- hundred fields, five/ten strips, place-value blocks, number lines, sequences, equal groups, and part-whole diagrams;
- multiple-choice and number-entry interactions without speed scoring;
- rotating task forms for every skill, including changed unknown positions, varied sequence gaps, alternate visual models, and a broader mix of number-entry and choice tasks;
- cross-round scheduling that avoids recently used skills and the same skill in the same route position whenever the learning priorities allow it;
- on-device mastery by skill and representation, with review dates after 1, 3, 7, or 14 days;
- explainable selection within the maths category of the reward chosen by the child;
- migration of existing Phase 1 points, settings, attempts, PIN, and redemption history;
- parent learning view using supportive bands rather than grades.

### Phase 3 game layer and parent insight

- three equivalent mission skins chosen at the start of each round: Zahlenweg, Formenwerkstatt, and Markttag;
- a responsive map that advances exactly once for each resolved 10-point task;
- calm success feedback with reduced-motion support and optional quiet confirmation tones;
- four cosmetic personal-mastery badges that never affect points, rewards, or content access;
- a local seven-day parent view for tasks, first-try success, visual-help use, collected rewards, and review suggestions;
- explicit parent content unlocks for quantities/stories, figures/symmetry, and conceptual multiplication/sharing;
- schema-version-6 migration that preserves earlier settings and learning/reward history.

### Phase 4 broader course

- eight additional skill families: money, time, length, shapes, symmetry, multiplication arrays, fair sharing, and short word problems;
- original responsive visuals for symbolic Swiss coins, analogue clocks, rulers, polygons, symmetry grids, dot arrays, and sharing groups;
- three additional parent-selectable school topics for quantities/story problems, figures/symmetry, and multiplication/division;
- multiplication and sharing remain disabled by default and require an explicit parent unlock;
- adaptive scheduling and mastery now cover all 18 skill families, with extensions gated by parent unlocks and weighted toward the selected school topic;
- Swiss Standard German wording and familiar contexts such as Franken, Rappen, and Znüni;
- automatic schema migration that preserves existing settings, rewards, attempts, and mastery.

The wider product and curriculum roadmap is in [PRODUCT_PLAN.md](./PRODUCT_PLAN.md).
