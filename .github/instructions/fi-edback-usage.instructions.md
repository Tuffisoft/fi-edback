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
export const { GET, POST, DELETE } = createFeedbackRouteHandler();
```

Provides three endpoints:

- `POST` — submit new feedback
- `GET` — fetch existing feedback for a page (query params: `projectSlug`, `pageUrl`)
- `DELETE` — delete feedback by ID (query param: `id`)

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
- **Persistent pins**: All feedback is fetched on page load via `GET` endpoint
- **Clickable pins**: Users can click any pin to view the message, author, and timestamp
- **Delete**: Anyone can delete any feedback via the delete button (no authentication)
- **IP tracking**: IP addresses are captured automatically from request headers
- **i18n**: Language toggle (EN/DE) in bottom-right switches all UI text

## Features

### Persistent Pins

All feedback submitted for a page is displayed as pins. Pins are fetched on mount and remain visible to all users. Click any pin to see the full feedback.

### Delete Feedback

A delete button (×) appears in the top-right of each feedback popup. Anyone can delete any feedback — no authentication required.

### IP Address Tracking

IP addresses are automatically captured from `x-forwarded-for` or `x-real-ip` headers and stored in the database. This provides a fallback identifier when users don't enter a name.

### Internationalization

Toggle between English and German using the language switcher (EN | DE) next to the Feedback button. All UI text updates instantly.

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

**Schema includes**:

- `id`, `project_slug`, `page_url`, `x`, `y`, `message`
- `name`, `email` (optional user-provided fields)
- `session_id` (anonymous session cookie for rate limiting)
- `user_agent`, `ip_address` (auto-captured from request headers)
- `created_at` (timestamp)

## Troubleshooting

| Symptom            | Cause                                       | Fix                                   |
| ------------------ | ------------------------------------------- | ------------------------------------- |
| Button not visible | `NEXT_PUBLIC_ENABLE_FEEDBACK` not `"true"`  | Check env vars and restart dev server |
| Button not visible | `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` missing | Set the slug env var                  |
| POST returns 500   | `DATABASE_URL` not set                      | Add server-side env var               |
| POST returns 429   | Rate limit exceeded (5 per 60s per session) | Wait 60 seconds                       |
| Hydration error    | Old version without mounted guard           | Update to latest                      |
