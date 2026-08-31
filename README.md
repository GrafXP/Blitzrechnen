# Mathe-Mission

An installable, local-first mathematics trainer for a child in the Swiss 2nd primary class. Phases 1 and 2 provide the complete application foundation and an adaptive arithmetic course through the number range to 100.

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
- configurable 50–200 point goal and real-life reward;
- exactly 10 points per unique resolved task, resilient to refresh/back navigation;
- repeatable parent-approved reward rounds, with a fresh point goal immediately after each redemption;
- salted, derived parent PIN with retry throttling;
- parent settings, current-round progress, and on-device redemption history;
- IndexedDB persistence with no account, analytics, advertisements, or backend;
- automatic read-aloud, reduced motion, high contrast, and left-handed layout options;
- installable PWA assets, offline app shell, update prompt, and iOS/Android install guidance.

### Phase 2 arithmetic course

- ten original skill families: number recognition, place value, number order, counting steps, complements to a ten and to 100, addition, subtraction, doubling/halving, and decomposition;
- four rule-based difficulty levels with every operand and result constrained to 0–100;
- hundred fields, five/ten strips, place-value blocks, number lines, sequences, equal groups, and part-whole diagrams;
- multiple-choice and number-entry interactions without speed scoring;
- on-device mastery by skill and representation, with review dates after 1, 3, 7, or 14 days;
- explainable selection weighted toward due review and the school topic chosen by the parent;
- migration of existing Phase 1 points, settings, attempts, PIN, and redemption history;
- parent learning view using supportive bands rather than grades.

The wider product and curriculum roadmap is in [PRODUCT_PLAN.md](./PRODUCT_PLAN.md).
