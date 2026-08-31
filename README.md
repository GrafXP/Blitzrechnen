# Mathe-Mission

An installable, local-first mathematics trainer for a child in the Swiss 2nd primary class. Phase 1 provides the complete application foundation and a placeholder daily arithmetic mission.

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

The end-to-end suite runs the daily journey at phone and tablet sizes. Chromium is installed for the suite with:

```bash
npx playwright install chromium
```

## Phase 1 functionality

- responsive child home, placeholder number mission, two-step hints, and finish screen;
- configurable 50–200 point goal and real-life reward;
- exactly 10 points per unique resolved task, resilient to refresh/back navigation;
- Zurich calendar-day rollover and one parent-approved redemption per day;
- salted, derived parent PIN with retry throttling;
- parent settings and on-device daily overview;
- IndexedDB persistence with no account, analytics, advertisements, or backend;
- automatic read-aloud, reduced motion, high contrast, and left-handed layout options;
- installable PWA assets, offline app shell, update prompt, and iOS/Android install guidance.

The wider product and curriculum roadmap is in [PRODUCT_PLAN.md](./PRODUCT_PLAN.md).
