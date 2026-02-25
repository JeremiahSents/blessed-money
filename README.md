# LendTrack

LendTrack is a personal loan portfolio management application built for a solo money lender. It provides a comprehensive dashboard, customer management, billing cycle tracking, collateral management, and Cent-based interest calculations.

## Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL) + Drizzle ORM
- **Authentication:** Better Auth (Google OAuth)
- **UI & Styling:** Tailwind CSS v4, shadcn/ui (base-nova with hugeicons), Lucide Icons
- **Forms & Validation:** React Hook Form + Zod
- **Data Fetching:** TanStack Query v5
- **PDF Generation:** jsPDF + jspdf-autotable

## Local Setup

### 1. Prerequisites
- Node.js >= 20
- A Supabase account and project
- A Google Cloud project (for OAuth credentials)

### 2. Environment Variables
Copy the `.env.example` file to a new `.env` file:
```bash
cp .env.example .env
```
Fill in the placeholders with your actual Supabase and Google OAuth credentials.

### 3. Supabase Storage Setup
1. Go to your Supabase project dashboard -> Storage.
2. Create two new buckets:
   - `customer-ids`
   - `collateral-docs`
3. Both buckets should be **private** (the application server uses the Service Role key to generate Signed URLs for secure viewing).

### 4. Database Setup
Ensure your local `.env` has the correct `DATABASE_URL`. Run the Drizzle migrations to set up the schema:
```bash
npm run db:push
```
Or generate and apply migrations:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 5. Seeding Dummy Data (Optional)
To test the application out of the box with sample data:
```bash
npx tsx scripts/seed.ts
```

### 6. Start the Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`.

## Automated Nightly Rollover (Cron)
LendTrack includes an automated cron job route that rolls over billing cycles when they expire, capitalizing interest and marking accounts as overdue if they miss payments.
- **Route:** `POST /api/cron/rollover`
- **Security:** Requires a Bearer token matching your `CRON_SECRET` environment variable.
- **Vercel Setup:** If deploying to Vercel, configure a Cron Job in your `vercel.json` pointing to this route to run every night at midnight.

## Domain Logic: Interest Calculation Engine
The application engine uses strict Cent-based arithmetic (`BigInt`) for all financial operations. This ensures zero floating-point drift over the lifetime of a loan.
The logic resides in `lib/interest.ts`, and is heavily tested via Vitest (`lib/interest.test.ts`).
1. **Cycle 1:** Computes interest on the original Principal.
2. ** Rollover (Cycle 2+):** If a cycle is unpaid or partially paid by its due date, the remaining *Balance* (Principal + Unpaid Interest) becomes the *Opening Principal* for the next cycle. Interest is applied to this new amount. By doing this, the system mathematically acts as a compound interest model, which is the standard methodology for local money lenders.
