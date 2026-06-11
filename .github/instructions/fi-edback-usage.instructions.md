---
applyTo: "**"
description: >
  Use when working with the fi-edback package — adding the feedback widget,
  registering the route handler, configuring env vars, or troubleshooting
  the feedback tool in this project.
---

# fi-edback — Usage Instructions

`fi-edback` is a floating visual feedback widget for Next.js preview deployments.
Feedback is stored in a shared Neon PostgreSQL database, keyed by project slug.

## Integration (3 files)

### 0. Install

```bash
npm i github:Tuffisoft/fi-edback
npm i @neondatabase/serverless zod@~3.23.8
```

### 1. Route handler — `app/api/fi-edback/route.ts`

```ts
import { createFeedbackRouteHandler } from "fi-edback";
export const { POST } = createFeedbackRouteHandler();
```

### 2. Root layout — add `<FeedbackRoot />` inside `<body>`

```tsx
import { FeedbackRoot } from "fi-edback/client";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <FeedbackRoot />
      </body>
    </html>
  );
}
```

### 3. `next.config.ts` — add `serverExternalPackages`

```ts
const nextConfig = {
  // @neondatabase/serverless uses Node.js internals and cannot be bundled
  // by Turbopack — it must be loaded natively by Node at runtime.
  // fi-edback must also be external so Turbopack does not attempt to
  // bundle and statically evaluate its server entry at build time.
  serverExternalPackages: ["@neondatabase/serverless", "fi-edback"],
};
export default nextConfig;
```

### 3. Environment variables

Set these in Vercel → Project Settings → Environment Variables.
For preview-only behaviour, scope them to the **Preview** environment only.

| Variable                            | Example value                          | Notes                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------- |
| `DATABASE_URL`                      | `postgresql://...pooler.neon.tech/...` | Neon pooled connection string — server only |
| `NEXT_PUBLIC_ENABLE_FEEDBACK`       | `true`                                 | Omit or set `false` for production          |
| `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` | `client-acme`                          | Tags all feedback rows for this project     |

## How it works

- `FeedbackRoot` reads `NEXT_PUBLIC_ENABLE_FEEDBACK` — renders nothing if not `"true"`
- Clicking "Feedback" activates a crosshair overlay — click anywhere to place a pin
- The form collects message (required), name and email (optional)
- On submit, a `POST` request goes to `/api/fi-edback`
- The route handler validates with Zod, checks rate limit, inserts into `fi_feedback` table

## Disable for production

Remove `NEXT_PUBLIC_ENABLE_FEEDBACK` from the Production environment in Vercel —
the widget renders nothing and no requests are made. No code changes needed.

## Upgrade

```bash
npm update fi-edback
# or pin a specific commit:
npm i github:studiofi/fi-edback#<commit-sha>
```

## Database

All projects write to a shared `fi_feedback` table in one Neon database.
Rows are separated by the `project_slug` column.
Run `SQL_MIGRATION.sql` (in the fi-edback repo) once in the Neon console to create the table.

## Troubleshooting

| Symptom            | Cause                                       | Fix                                   |
| ------------------ | ------------------------------------------- | ------------------------------------- |
| Button not visible | `NEXT_PUBLIC_ENABLE_FEEDBACK` not `"true"`  | Check env vars and restart dev server |
| Button not visible | `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` missing | Set the slug env var                  |
| POST returns 500   | `DATABASE_URL` not set                      | Add server-side env var               |
| POST returns 429   | Rate limit exceeded (5 per 60s per session) | Wait 60 seconds                       |
| Hydration error    | Old version without mounted guard           | Update to latest                      |
