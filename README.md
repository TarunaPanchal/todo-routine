# RoutineBuddy 🌱

A cute, animated, installable PWA for daily / weekly / monthly routines. No backend, no accounts: all data lives on the device (localStorage, behind a swappable storage adapter).

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand (`persist`) · Recharts · date-fns · canvas-confetti · lucide-react · html-to-image · Serwist (service worker) · Vitest.

## Run

```bash
npm install
npm run dev        # http://localhost:3000 (service worker disabled in dev)
npm run build      # production build (uses webpack; required by Serwist)
npm start          # serve the production build; test PWA/offline here
npm test           # Vitest: schedule, streak, gamification, migration
npm run typecheck
node scripts/generate-icons.mjs   # regenerate placeholder PNG icons
```

Try it with sample data: finish onboarding with **Explore with demo data**, or Settings → Demo data.

## Structure

```
app/          routes (Today, calendar, reports, settings, routines), manifest.ts, sw.ts
components/   ui/ shell/ today/ routines/ calendar/ reports/
store/        useStore (persisted data + actions), useUI (ephemeral UI state)
lib/          date, schedule (frequency + streak, pure), stats, gamification, migrate, storage, i18n, export, seed
hooks/        useHydrated, useToday, useNow, useReminders
types/        data model
tests/        Vitest unit tests
```

Notes:
- Dates are local-time `yyyy-MM-dd` strings (never UTC) to avoid off-by-one-day bugs.
- Persisted state uses `skipHydration` and rehydrates after mount; screens show a skeleton until hydrated, so there is no SSR mismatch.
- Data is versioned (`schemaVersion`); add a step in `lib/migrate.ts` when the schema changes.
- To move to IndexedDB, replace `activeStorage` in `lib/storage.ts`.
- Skipped tasks never break a streak or count against completion. "X times per week" routines use weekly streaks.
- Reminders fire while the app is open or recently used. No server means no true background push.

## Deploy on Vercel

1. Push the repo to GitHub and import it at vercel.com/new (framework: Next.js).
2. Build command is `npm run build` (from package.json). No env vars needed.
3. Open the HTTPS URL. Service workers need HTTPS, so the PWA is installable there.

## Install on your phone

- **Android (Chrome):** open the site, then use the in-app **Install** banner, or menu ⋮ → *Install app*.
- **iOS (Safari):** open the site → Share → **Add to Home Screen**. On iOS, notifications only work for the installed app.
