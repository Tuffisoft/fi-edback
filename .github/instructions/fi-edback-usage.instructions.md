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
- `GET` — fetch existing feedback for a page (query params: `projectSlug`, `pageUrl`, `sessionId`) OR export as CSV (query params: `format=csv`, `projectSlug`)
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
- **Multi-page support**: Each page's feedback is isolated by URL — pins automatically update when navigating between pages
- **Persistent pins**: All feedback is fetched on page load via `GET` endpoint
- **Clickable pins**: Users can click any pin to view the message, author, and timestamp
- **Draggable pins**: Pins can be repositioned by dragging them to a new location
- **Delete**: Anyone can delete any feedback via the delete button (no authentication)
- **Reactions**: Users can react to feedback with emojis (👍 ✅ ❤️ 🔥 👀) to mark as done, agree, or show support
- **IP tracking**: IP addresses are captured automatically from request headers
- **i18n**: Language selector (EN/DE/GA) in bottom-right switches all UI text

## Features

### Multi-Page Support

Feedback is automatically scoped to individual pages. When you navigate between pages (using Next.js `<Link>` or browser navigation), the widget:

- Automatically fetches and displays feedback for the current page only
- Clears pins from the previous page
- Works seamlessly with client-side routing (no page refresh needed)
- Stores the full URL (`window.location.href`) including path and query parameters

Each page maintains its own independent set of feedback pins. Feedback submitted on `/pricing` will only appear when viewing `/pricing`, not on `/about` or other pages.

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

### Pin Colors

Users can choose from 5 color options when placing feedback:

- 🔵 **Blue** (#3b82f6) - Default/general feedback
- 🟢 **Green** (#22c55e) - Positive feedback/suggestions
- 🟡 **Yellow** (#eab308) - Questions
- 🔴 **Red** (#ef4444) - Issues/bugs
- 🟣 **Purple** (#a855f7) - Design feedback

The selected color is displayed on the pin and saved with the feedback. This allows teams to categorize feedback visually at a glance.

### CSV Export

Click the **📥 Export CSV** button (bottom-right, next to language toggle) to download all feedback for the current project as a CSV file. The export includes:

- All feedback fields (message, name, email, coordinates)
- Pin color selections
- Device type (mobile/tablet/desktop)
- Viewport dimensions
- IP addresses
- Aggregated reactions
- Timestamps

The CSV is automatically formatted for Excel compatibility (including German/European locales using semicolon delimiters).

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

The instruction text also indicates this is a **preview-only tool** to communicate with users that it won't appear in production.

## Optional: Security Middleware

For stricter CORS protection, add `middleware.ts` to your app root:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  /^https:\/\/.*\.vercel\.app$/,
  "http://localhost:3000",
].filter(Boolean);

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/fi-edback")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const isAllowed =
    !origin ||
    ALLOWED_ORIGINS.some((allowed) =>
      typeof allowed === "string" ? allowed === origin : allowed.test(origin),
    );

  if (!isAllowed) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = { matcher: "/api/fi-edback/:path*" };
```

**Note:** The route handler already includes built-in security (rate limiting, honeypot, input validation). Middleware is optional.

## Upgrade

```bash
npm update fi-edback
# or pin a specific commit:
npm i github:Tuffisoft/fi-edback#<commit-sha>
```

## Database

All projects write to a shared `fi_feedback` table in one Neon database.
Rows are separated by the `project_slug` column.
Run `SQL_MIGRATION.sql` (in the fi-edback repo) once in the Neon console to create the tables.

**fi_feedback schema includes**:

- `id`, `project_slug`, `page_url`, `x`, `y`, `message`
- `name`, `email` (optional user-provided fields)
- `pin_color` (hex color code, default #3b82f6)
- `viewport_width` (captured at submission)
- `device_type` (mobile/tablet/desktop)
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

## Testing Multi-Page Functionality

To verify feedback isolation across pages:

1. **In the dev harness** (`dev/` folder):

   ```bash
   cd dev
   npm run dev
   ```

   Navigate between Home (`/`), About (`/about`), and Pricing (`/pricing`) using the links.

2. **In your Next.js app**:
   - Add feedback on one page (e.g., `/pricing`)
   - Navigate to another page (e.g., `/about`) using Next.js `<Link>` components
   - Verify pins from `/pricing` disappear
   - Add feedback on `/about`
   - Navigate back to `/pricing` — only pricing feedback should appear
   - Test browser back/forward buttons to ensure feedback refreshes correctly

3. **What to verify**:
   - Pins are isolated by full URL (including query params)
   - Client-side navigation (Next.js `<Link>`) triggers refetch
   - Browser back/forward buttons work correctly
   - Each page loads only its own feedback from the database

## Exporting Feedback

All feedback is stored in a shared Neon PostgreSQL database. To export feedback for analysis or reporting:

### Quick Export (Neon Console)

1. Go to https://console.neon.tech
2. Select your database → SQL Editor
3. Run this query (replace `YOUR_PROJECT_SLUG`):

```sql
SELECT
  f.page_url,
  f.message,
  f.name,
  f.email,
  f.created_at,
  COUNT(r.id) AS reactions
FROM fi_feedback f
LEFT JOIN fi_feedback_reactions r ON f.id = r.feedback_id
WHERE f.project_slug = 'YOUR_PROJECT_SLUG'
GROUP BY f.id, f.page_url, f.message, f.name, f.email, f.created_at
ORDER BY f.created_at DESC;
```

4. Copy results to Excel/Google Sheets

### Advanced Export Queries

See [`docs/EXPORT.md`](../docs/EXPORT.md) for:

- CSV export with psql
- Page-by-page summaries
- Reaction details
- Time-based filtering (last 7 days, etc.)
- Full schema examples
