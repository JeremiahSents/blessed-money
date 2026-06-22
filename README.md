# Blessed Money

A simple, mobile-first app for a solo money lender. It does four things:

1. **Give a loan** to a borrower
2. **Record a payment** on a loan
3. **Email a daily reminder** of payments due
4. **Track** how much is out on loan and what each borrower still owes

For how the code is organised, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Technology Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Authentication:** Better Auth (Google OAuth)
- **UI:** Tailwind CSS v4, shadcn/ui (with hugeicons)
- **Forms & Validation:** React Hook Form + Zod
- **Data Fetching:** TanStack Query v5
- **Email:** Resend

## Local Setup

### 1. Prerequisites
- [Bun](https://bun.sh) (package manager + runner)
- A PostgreSQL database (a `DATABASE_URL`)
- A Google Cloud project (for OAuth credentials)

### 2. Environment Variables
Create a `.env` file with at least:
```
DATABASE_URL=...
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CRON_SECRET=...            # protects the cron routes
RESEND_API_KEY=...         # optional — daily reminder emails
ADMIN_EMAIL=...            # who receives the daily reminders
```

### 3. Database
```bash
bun run push          # apply the schema to your database
```

### 4. Run it
```bash
bun install
bun run dev           # http://localhost:3000
```

## Background Jobs (Cron)
- `POST /api/cron/rollover` — rolls over expired billing cycles (capitalises unpaid interest,
  marks accounts overdue).
- `POST /api/cron/daily-reminders` — emails the lender the list of payments due today.

Both require a `Authorization: Bearer <CRON_SECRET>` header. On Vercel, schedule them in
`vercel.json`.

## Interest Engine
All money math uses cent-based `BigInt` arithmetic (zero floating-point drift). The logic lives in
[lib/interest.ts](lib/interest.ts). When a cycle is unpaid by its due date, the remaining balance
becomes the opening principal of the next cycle (a compound model, standard for local lenders).
