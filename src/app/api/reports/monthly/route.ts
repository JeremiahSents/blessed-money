import { NextResponse } from "next/server";
import db from "@/src/index";
import { loans, billingCycles, payments } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";

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
        loansIssuedRaw.forEach((row: any) => monthsSet.add(row.month));
        collectedRaw.forEach((row: any) => monthsSet.add(row.month));
        interestRaw.forEach((row: any) => monthsSet.add(row.month));

        const allMonths = Array.from(monthsSet).sort().reverse();

        const data = allMonths.map(month => {
            const issued = loansIssuedRaw.find((r: any) => r.month === month) || { count: 0, total_principal: 0 };
            const collected = collectedRaw.find((r: any) => r.month === month) || { total_collected: 0 };
            const interest = interestRaw.find((r: any) => r.month === month) || { total_interest: 0 };

            return {
                month,
                loansIssuedCount: Number(issued.count),
                loansIssuedPrincipal: Number(issued.total_principal),
                collected: Number(collected.total_collected),
                interestEarned: Number(interest.total_interest),
            };
        });

        return NextResponse.json({ data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
