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
export const { GET, POST, PATCH, DELETE } = createFeedbackRouteHandler();
```

Provides four endpoints:

- `POST` — submit new feedback
- `GET` — fetch existing feedback for a page (query params: `projectSlug`, `pageUrl`, `sessionId`)
- `PATCH` — toggle a reaction on feedback (body: `feedbackId`, `reaction`, `sessionId`) OR update pin position (body: `feedbackId`, `x`, `y`)
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
- **Draggable pins**: Pins can be repositioned by dragging them to a new location
- **Delete**: Anyone can delete any feedback via the delete button (no authentication)
- **Reactions**: Users can react to feedback with emojis (👍 ✅ ❤️ 🔥 👀) to mark as done, agree, or show support
- **IP tracking**: IP addresses are captured automatically from request headers
- **i18n**: Language selector (EN/DE/GA) in bottom-right switches all UI text

## Features

### Persistent Pins

All feedback submitted for a page is displayed as pins. Pins are fetched on mount and remain visible to all users. Click any pin to see the full feedback.

### Drag and Drop Pins

Pins can be repositioned by clicking and dragging them to a new location (or tap and drag on mobile). The new position is automatically saved to the database. This is useful when:

- A pin is obscuring important content
- Feedback needs to be repositioned after page layout changes
- Multiple pins overlap and need to be spread out

Desktop: Click and drag with mouse
Mobile: Touch and drag with finger

### Mobile Support

The feedback tool is fully mobile-friendly with:
- Touch event support for dragging pins
- Responsive UI that adapts to screen size
- Optimized button sizes for touch targets
- Centered modals on small screens
- All features work on phones and tablets

### Delete Feedback

A delete button (×) appears in the top-right of each feedback popup. Anyone can delete any feedback — no authentication required.

### IP Address Tracking

IP addresses are automatically captured from `x-forwarded-for` or `x-real-ip` headers and stored in the database. This provides a fallback identifier when users don't enter a name.

### Internationalization

Switch between English, German, and Irish using the language selector next to the Feedback button. The active language is highlighted with bold text and a light background. All UI text updates instantly.

Supported languages:
- **EN** (English)
- **DE** (Deutsch/German)
- **GA** (Gaeilge/Irish)

### Reactions

Users can react to any feedback with predefined emojis:

- 👍 (Agree/Like)
- ✅ (Done/Completed)
- ❤️ (Love/Important)
- 🔥 (Hot/Priority)
- 👀 (Watching/Noted)

Click a reaction to toggle it on/off. Reaction counts are shown next to each emoji. The same user (identified by session) can only react once per type — clicking again removes the reaction. Reactions are stored in the `fi_feedback_reactions` table.

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
Run `SQL_MIGRATION.sql` (in the fi-edback repo) once in the Neon console to create the tables.

**fi_feedback schema includes**:

- `id`, `project_slug`, `page_url`, `x`, `y`, `message`
- `name`, `email` (optional user-provided fields)
- `session_id` (anonymous session cookie for rate limiting)
- `user_agent`, `ip_address` (auto-captured from request headers)
- `created_at` (timestamp)

**fi_feedback_reactions schema includes**:

- `id`, `feedback_id` (foreign key to fi_feedback)
- `reaction` (emoji or text like "done", "agree")
- `session_id` (prevents duplicate reactions from same user)
- `created_at` (timestamp)

## Troubleshooting

| Symptom            | Cause                                       | Fix                                   |
| ------------------ | ------------------------------------------- | ------------------------------------- |
| Button not visible | `NEXT_PUBLIC_ENABLE_FEEDBACK` not `"true"`  | Check env vars and restart dev server |
| Button not visible | `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` missing | Set the slug env var                  |
| POST returns 500   | `DATABASE_URL` not set                      | Add server-side env var               |
| POST returns 429   | Rate limit exceeded (5 per 60s per session) | Wait 60 seconds                       |
| Hydration error    | Old version without mounted guard           | Update to latest                      |
