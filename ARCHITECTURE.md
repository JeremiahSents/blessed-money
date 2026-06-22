# Architecture

Blessed Money is a small, mobile-first app for a solo money lender. It does four things:

1. **Give a loan** to a borrower
2. **Record a payment** on a loan
3. **Email a daily reminder** of payments due (to the lender)
4. **Track** how much is out on loan and what each borrower still owes

It's a single Next.js (App Router) app — the frontend pages and the backend API live in the
same project.

## Folder map

```
app/                    Pages (URLs) and API routes — the only place routing lives
  page.tsx              The dashboard (home screen)
  signin/               Sign-in page
  customers/            Borrowers list + [id] detail
  loans/                Loans list, new loan, [id] detail
  settings/             Settings
  api/                  Backend endpoints (one folder per resource)
  layout.tsx            Root layout → wraps everything in <AppShell>

features/               Everything specific to one part of the app, grouped by feature
  <feature>/
    service.ts          Talks to the database for this feature (the ONLY db access)
    components/         React components used by this feature's pages

components/             Shared UI used everywhere
  ui/                   shadcn/ui primitives (Button, Card, Input, …) — don't hand-edit
  shared/               App-wide pieces (navigation, app-shell, page-header, …)

lib/                    Small shared helpers
  api.ts                withAuth() wrapper for API routes
  auth.ts               Authentication setup (Better Auth)
  db.ts → db/           Database connection
  utils.ts              cn(), formatCurrency(), formatDate(), …
  interest.ts           Interest & billing-cycle math
  types.ts              Shared TypeScript types

db/                     Database schema + migrations (Drizzle ORM)
  schema.ts             Table definitions
  migrations/           Generated SQL migrations
```

## How a request flows

```
Page (app/…/page.tsx)
  → fetch("/api/…")                     browser calls the backend
    → API route (app/api/…/route.ts)    thin: auth + parse, no business logic
      → feature service (features/…/service.ts)   queries/updates the database
        → db (Drizzle)                  the actual SQL
```

Each layer has one job, so a beginner can follow any feature top to bottom.

## The two patterns to know

**1. API routes use `withAuth`** (see `lib/api.ts`). It checks the user is signed in and turns a
thrown error into a clean `{ error }` response. Your handler just returns data:

```ts
import { withAuth } from "@/lib/api";
import { listCustomers } from "@/features/customers/service";

export const GET = withAuth(async ({ req }) => {
  const { data, total } = await listCustomers({ search: "", page: 1, limit: 10 });
  return { data, meta: { total } };
});
```

All endpoints answer in the same shape: `{ data }` on success, `{ error }` on failure.

**2. Database access lives only in `features/<feature>/service.ts`.** Pages and API routes never
import the database directly — they call a service function. This keeps SQL in one predictable place.

## Adding a new feature (recipe)

1. Create `features/<name>/service.ts` with the database functions.
2. Create `app/api/<name>/route.ts` using `withAuth`, calling those functions.
3. Create the page in `app/<name>/page.tsx`; put feature-specific components in
   `features/<name>/components/`.
4. If you changed the database, edit `db/schema.ts` and run `bun run generate`.

## Useful commands

```bash
bun run dev        # start the app locally
bun run build      # production build (also type-checks)
bun run generate   # create a migration after editing db/schema.ts
bun run push       # apply schema changes to the database
```
