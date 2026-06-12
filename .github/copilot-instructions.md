# fi-edback — Copilot Instructions

## What this repo is

`fi-edback` is a reusable npm package (installed via git URL) that adds a floating visual feedback widget to any Next.js preview deployment. Feedback is written to a shared Neon PostgreSQL database. It is **not** a standalone app — the `dev/` folder is a Next.js development harness only.

## Repo structure

```
src/                    ← package source (compiled to dist/ by tsup)
  index.ts              ← server entry: createFeedbackRouteHandler + types
  client.ts             ← 'use client' entry: FeedbackRoot component
  lib/
    types.ts            ← FeedbackPayload, FeedbackConfig, FeedbackRow
    env.ts              ← env var accessors (isEnabled, getProjectSlug, getDatabaseUrl)
    config.ts           ← API_PATH, SESSION_COOKIE_NAME, rate limit constants
    validation.ts       ← Zod schema (includes honeypot field)
    session.ts          ← client-side anonymous session cookie
    i18n.ts             ← translations (EN/DE) and Language type
    db/
      client.ts         ← getNeonClient() — cached neon() instance
      queries.ts        ← insertFeedback(), getFeedbackForPage(), deleteFeedback(), isRateLimited()
  server/
    route-handler.ts    ← createFeedbackRouteHandler() factory (GET, POST, DELETE)
  components/
    FeedbackRoot.tsx    ← gate component (mounted check + env check)
    FeedbackLauncher.tsx ← main orchestrator (language state, fetch pins, clickable pins)
    FeedbackOverlay.tsx
    FeedbackPinLayer.tsx ← renders clickable pins
    FeedbackForm.tsx     ← submit new feedback
    FeedbackPopup.tsx    ← view/delete existing feedback
dev/                    ← Next.js 16 dev harness (not part of the package)
dist/                   ← compiled output (committed to git)
SQL_MIGRATION.sql       ← run once in Neon console to create fi_feedback table
```

## Key conventions

- All components are `'use client'` — none should have server-side rendering logic
- `FeedbackRoot` uses a `mounted` state guard (`useEffect → setMounted(true)`) to prevent hydration mismatches — do not remove this
- The DB layer uses `@neondatabase/serverless` with raw SQL (no ORM) — keep queries in `src/lib/db/queries.ts`
- `getNeonClient()` caches clients by URL — safe for Vercel serverless warm starts
- Rate limiting is DB-based (count rows for sessionId in last 60s) — no Redis needed
- The honeypot field is named `website` — it must be an empty string (`z.literal('')`) in the Zod schema
- Coordinates are document-relative (`clientX + scrollX`, `clientY + scrollY`) — not viewport-relative
- `dist/` is committed to git so `npm i github:studiofi/fi-edback` works without a build step

## Features

### Persistent pins
All feedback for a page is fetched via GET endpoint on mount and displayed as clickable pins. Clicking a pin shows a popup with the full message, author, and timestamp.

### IP address tracking
IP addresses are captured from `x-forwarded-for` or `x-real-ip` headers and stored in the database. This provides a fallback identifier when users don't enter a name.

### Delete functionality
Anyone can delete any feedback via the delete button in the popup. No authentication required. DELETE endpoint removes the row from the database.

### Internationalization
EN/DE language toggle next to the Feedback button. All UI strings are centralized in `src/lib/i18n.ts`. Language state is managed in `FeedbackLauncher` and passed down to all components.

## Build

```bash
npm run build    # runs tsup, outputs to dist/
```

Two entry points:

- `dist/index.js` — server-safe, exports `createFeedbackRouteHandler` and types
- `dist/client.js` — client components, exports `FeedbackRoot`

## Dev harness

```bash
cd dev
cp .env.local.example .env.local   # add DATABASE_URL
npm install
npm run dev
```

Requires `NEXT_PUBLIC_ENABLE_FEEDBACK=true` and `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` in `dev/.env.local`.

## Database

Table: `fi_feedback` in a shared Neon PostgreSQL database. Created by running `SQL_MIGRATION.sql` once in the Neon console. All projects share one table, separated by `project_slug`.

## Environment variables

| Var                                 | Side   | Purpose                         |
| ----------------------------------- | ------ | ------------------------------- |
| `DATABASE_URL`                      | Server | Neon pooled connection string   |
| `NEXT_PUBLIC_ENABLE_FEEDBACK`       | Public | Must be `"true"` to show widget |
| `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` | Public | Tags all rows for this project  |

## What NOT to do

- Do not add Prisma — the DB layer uses `@neondatabase/serverless` directly
- Do not add Resend — email delivery is out of scope for this version
- Do not add `'use server'` directives to package files — Server Actions cannot be exported from packages
- Do not move the `mounted` check out of `FeedbackRoot`
- Do not make components SSR — the widget is preview-only and entirely interactive
