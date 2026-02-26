import { NextResponse } from "next/server";
import db from "@/src/index";
import { loans, billingCycles, payments } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/errors";

type MonthRow = {
    month: string;
    count?: string | number;
    total_principal?: string | number;
    total_collected?: string | number;
    total_interest?: string | number;
};

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Generate a monthly grouped summary of: Let's group by month of loan creation for loans issued,
        // and month of payment for collected, or more simply, just query month by month.
        // For a complex query, we can use raw SQL or structure multiple Drizzle queries.

        // Monthly Loans Issued
        const loansIssuedRaw = await db.execute(sql`
        SELECT TO_CHAR(start_date, 'YYYY-MM') as month, COUNT(*) as count, SUM(CAST(principal_amount AS NUMERIC)) as total_principal
        FROM loans
        GROUP BY TO_CHAR(start_date, 'YYYY-MM')
        ORDER BY month DESC
    `);

        // Monthly Collected
        const collectedRaw = await db.execute(sql`
        SELECT TO_CHAR(paid_at, 'YYYY-MM') as month, SUM(CAST(amount AS NUMERIC)) as total_collected
        FROM payments
        GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
        ORDER BY month DESC
    `);

        // Monthly Interest Charged (from billing cycles)
        const interestRaw = await db.execute(sql`
        SELECT TO_CHAR(cycle_start_date, 'YYYY-MM') as month, SUM(CAST(interest_charged AS NUMERIC)) as total_interest
        FROM billing_cycles
        GROUP BY TO_CHAR(cycle_start_date, 'YYYY-MM')
        ORDER BY month DESC
    `);

        // Merge into a cohesive array
        const monthsSet = new Set<string>();
        (loansIssuedRaw as unknown as MonthRow[]).forEach((row) => monthsSet.add(row.month));
        (collectedRaw as unknown as MonthRow[]).forEach((row) => monthsSet.add(row.month));
        (interestRaw as unknown as MonthRow[]).forEach((row) => monthsSet.add(row.month));

        const allMonths = Array.from(monthsSet).sort().reverse();

        const issuedRows = loansIssuedRaw as unknown as MonthRow[];
        const collectedRows = collectedRaw as unknown as MonthRow[];
        const interestRows = interestRaw as unknown as MonthRow[];

        const data = allMonths.map(month => {
            const issued = issuedRows.find((r) => r.month === month) || { count: 0, total_principal: 0 };
            const collected = collectedRows.find((r) => r.month === month) || { total_collected: 0 };
            const interest = interestRows.find((r) => r.month === month) || { total_interest: 0 };

            return {
                month,
                loansIssuedCount: Number(issued.count ?? 0),
                loansIssuedPrincipal: Number(issued.total_principal ?? 0),
                collected: Number(collected.total_collected ?? 0),
                interestEarned: Number(interest.total_interest ?? 0),
            };
        });

        return NextResponse.json({ data });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}
