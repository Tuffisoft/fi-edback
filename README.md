# fi-edback

Floating visual feedback widget for Next.js preview deployments. Clients click anywhere on the page to drop a pin and leave a message. All submissions go to a shared Neon PostgreSQL database, separated by project slug.

---

## One-time setup checklist

- [ ] Create a [Neon](https://neon.tech) project (free tier)
- [ ] Open the Neon SQL Editor and run `SQL_MIGRATION.sql` to create the `fi_feedback` table
- [ ] Copy the **pooled** connection string from Neon → Connection Details

---

## Add to a new project

### Install

```bash
npm i github:Tuffisoft/fi-edback
npm i @neondatabase/serverless zod
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

### 3. Environment variables

Set in Vercel → Project Settings → Environment Variables.
Scope `NEXT_PUBLIC_*` vars to **Preview** only so the widget never appears in production.

| Variable                            | Example                                | Notes                                            |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------ |
| `DATABASE_URL`                      | `postgresql://...pooler.neon.tech/...` | Neon pooled connection string — server only      |
| `NEXT_PUBLIC_ENABLE_FEEDBACK`       | `true`                                 | Widget is hidden unless this is exactly `"true"` |
| `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG` | `client-acme`                          | Tags all rows for this project                   |

### Per-project checklist

- [ ] `npm i github:studiofi/fi-edback`
- [ ] Create `app/api/fi-edback/route.ts`
- [ ] Add `<FeedbackRoot />` to root layout
- [ ] Set `DATABASE_URL` on Vercel (all scopes)
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
cp .env.local.example .env.local   # fill in DATABASE_URL
npm install
npm run dev                         # opens on localhost:3000
```

### Dev checklist

- [ ] Neon `fi_feedback` table exists (ran `SQL_MIGRATION.sql`)
- [ ] `dev/.env.local` has `DATABASE_URL`, `NEXT_PUBLIC_ENABLE_FEEDBACK=true`, `NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG=dev`
- [ ] Dev server running — Feedback button visible bottom-right
- [ ] Click pin → fill form → submit → row appears in Neon

---

## Upgrade

```bash
npm update fi-edback
# or pin a specific commit:
npm i github:studiofi/fi-edback#<commit-sha>
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
| POST returns 500   | `DATABASE_URL` not set                      | Add server-side env var               |
| POST returns 429   | Rate limit exceeded (5 per 60s per session) | Wait 60 seconds                       |
| Hydration error    | Old version without mounted guard           | `npm update fi-edback`                |
