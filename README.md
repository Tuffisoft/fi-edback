# fi-edback

Floating visual feedback widget for Next.js preview deployments. Clients click anywhere on the page to drop a pin and leave a message. All submissions go to a shared Neon PostgreSQL database, separated by project slug.

**Features**:

- ✅ Multi-page support — feedback automatically isolated by URL
- ✅ Persistent pins — all feedback visible to everyone
- ✅ Clickable pins — view message, author, and timestamp
- ✅ Draggable pins — reposition feedback with mouse or touch
- ✅ Color-coded pins — 5 colors to categorize feedback visually
- ✅ Device tracking — capture viewport size and device type
- ✅ Cross-device filtering — toggle pins from different screen sizes
- ✅ Reactions — engage with feedback using emojis (👍 ✅ ❤️ 🔥 👀)
- ✅ Delete feedback — anyone can delete (no auth)
- ✅ IP tracking — automatic fallback identifier
- ✅ CSV export — one-click download with German Excel compatibility
- ✅ i18n — EN/DE/GA language toggle with visual active state
- ✅ Mobile-friendly — touch support for dragging, responsive UI

---

## One-time setup checklist

- [ ] Create a [Neon](https://neon.tech) project (free tier)
- [ ] Open the Neon SQL Editor and run `SQL_MIGRATION.sql` to create the `fi_feedback` table
- [ ] Copy the **pooled** connection string from Neon → Connection Details

---

## Add to a new project

### Install

```bash
npm install fi-edback
```

### 1. Route handler — `app/api/fi-edback/route.ts`

```ts
import { createFeedbackRouteHandler } from "fi-edback";
export const { GET, POST, PATCH, DELETE } = createFeedbackRouteHandler();
```

Provides:

- `POST` — submit new feedback
- `GET` — fetch existing feedback (query: `projectSlug`, `pageUrl`, `sessionId`)
- `PATCH` — toggle reactions or update pin position
- `DELETE` — delete feedback by ID (query: `id`)

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

### 3. Environment variables

Set in Vercel → Project Settings → Environment Variables.
Scope `NEXT_PUBLIC_*` vars to **Preview** only so the widget never appears in production.

| Variable                            | Example                                | Notes                                            |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------ |
| `FI_EDBACK_DATABASE_URL`            | `postgresql://...pooler.neon.tech/...` | Neon pooled connection string — server only      |
| `NEXT_PUBLIC_ENABLE_FEEDBACK`       | `true`                                 | Widget is hidden unless this is exactly `"true"` |
| `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` | `client-acme`                          | Tags all rows for this project                   |

### Per-project checklist

- [ ] `npm install fi-edback`
- [ ] Create `app/api/fi-edback/route.ts`
- [ ] Add `<FeedbackRoot />` to root layout
- [ ] Set `FI_EDBACK_DATABASE_URL` on Vercel (all scopes)
- [ ] Set `NEXT_PUBLIC_ENABLE_FEEDBACK=true` on Vercel (Preview scope only)
- [ ] Set `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` on Vercel (Preview scope only)
- [ ] Deploy and test — submit feedback, check Neon table

---

## Disable for production

Remove `NEXT_PUBLIC_ENABLE_FEEDBACK` from the Production environment in Vercel.
The widget renders nothing and no requests are made. No code changes needed.

---

## Development (this repo)

```bash
# Install root dependencies and build dist/
npm install

# Set up dev environment
cd dev
cp .env.local.example .env.local   # fill in FI_EDBACK_DATABASE_URL
npm install
npm run dev                         # opens on localhost:3000
```

### Dev checklist

- [ ] Neon `fi_feedback` table exists (ran `SQL_MIGRATION.sql`)
- [ ] `dev/.env.local` has `FI_EDBACK_DATABASE_URL`, `NEXT_PUBLIC_ENABLE_FEEDBACK=true`, `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG=dev`
- [ ] Dev server running — Feedback button visible bottom-right
- [ ] Click pin → fill form → submit → row appears in Neon

---

## Upgrade

```bash
npm update fi-edback
# or install a specific version:
npm install fi-edback@0.4.0
```

After upgrading, rebuild if you've modified source:

```bash
npm run build
git add dist/
git commit -m "build: upgrade dist"
```

---

## Copilot instructions

Drop `.github/instructions/fi-edback-usage.instructions.md` into any consuming project and Copilot will understand the integration automatically:

```bash
mkdir -p .github/instructions
cp node_modules/fi-edback/.github/instructions/fi-edback-usage.instructions.md .github/instructions/
```

---

## Troubleshooting

| Symptom            | Cause                                       | Fix                                   |
| ------------------ | ------------------------------------------- | ------------------------------------- |
| Button not visible | `NEXT_PUBLIC_ENABLE_FEEDBACK` not `"true"`  | Check env vars and restart dev server |
| Button not visible | `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` missing | Set the slug env var                  |
| POST returns 500   | `FI_EDBACK_DATABASE_URL` not set            | Add server-side env var               |
| POST returns 429   | Rate limit exceeded (5 per 60s per session) | Wait 60 seconds                       |
| Hydration error    | Old version without mounted guard           | `npm update fi-edback`                |

---

## Multi-Page Support

Feedback is automatically scoped to individual pages by URL. When users navigate between pages:

- The widget detects URL changes (Next.js routing and browser navigation)
- Pins automatically refresh to show only the current page's feedback
- Each page maintains its own independent feedback

**To test:**

1. Run the dev harness: `cd dev && npm run dev`
2. Navigate between Home (`/`), About (`/about`), and Pricing (`/pricing`)
3. Add feedback on each page and verify pins stay isolated

See `.github/instructions/fi-edback-usage.instructions.md` for detailed testing steps.

---

## Exporting Feedback

All feedback is stored in the shared Neon database. To export for analysis or reporting:

### Quick Export (Neon Console)

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

Replace `YOUR_PROJECT_SLUG` with your actual slug, then copy results to Excel/Google Sheets.

**See [`docs/EXPORT.md`](docs/EXPORT.md) for:**

- CSV export with psql
- Page-by-page summaries
- Reaction breakdowns
- Time-based filtering (last 7 days, etc.)
