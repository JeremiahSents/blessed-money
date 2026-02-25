import { NextResponse } from "next/server";
import db from "@/src/index";
import { loans, billingCycles, payments, customers } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, or, sql, gt, gte, desc } from "drizzle-orm";
import { startOfMonth } from "date-fns";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // 1. Active Loans Count
        const activeLoansRes = await db.select({ count: sql<number>`count(*)` }).from(loans).where(eq(loans.status, 'active'));

        // 2. Overdue Loans Count
        const overdueLoansRes = await db.select({ count: sql<number>`count(*)` }).from(loans).where(eq(loans.status, 'overdue'));

        // 3. Capital Outstanding (Sum of balance of all open/overdue cycles)
        const outstandingRes = await db.select({ sum: sql<number>`sum(CAST(${billingCycles.balance} AS NUMERIC))` })
            .from(billingCycles)
            .where(or(eq(billingCycles.status, 'open'), eq(billingCycles.status, 'overdue')));

        // 4. Expected This Cycle (Sum of totalDue of open cycles)
        const expectedRes = await db.select({ sum: sql<number>`sum(CAST(${billingCycles.totalDue} AS NUMERIC))` })
            .from(billingCycles)
            .where(eq(billingCycles.status, 'open'));

        // 5. Collected This Month
        const startOfCurrentMonth = startOfMonth(new Date()).toISOString().split('T')[0];
        const collectedRes = await db.select({ sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))` })
            .from(payments)
            .where(gte(payments.paidAt, startOfCurrentMonth));

        // 6. Recent Activity Feed (Payments + New Loans)
        const recentPayments = await db.query.payments.findMany({
            limit: 10,
            orderBy: [desc(payments.createdAt)],
            with: { loan: { with: { customer: true } } }
        });

        const recentLoans = await db.query.loans.findMany({
            limit: 10,
            orderBy: [desc(loans.createdAt)],
            with: { customer: true }
        });

        const activity = [
            ...recentPayments.map(p => ({ type: 'PAYMENT', date: p.createdAt, data: p })),
            ...recentLoans.map(l => ({ type: 'LOAN', date: l.createdAt, data: l }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

        // 7. Overdue List Panel Data
        const overdueLoansList = await db.query.loans.findMany({
            where: eq(loans.status, 'overdue'),
            limit: 10,
            with: { customer: true, billingCycles: { where: eq(billingCycles.status, 'overdue'), orderBy: [desc(billingCycles.cycleNumber)], limit: 1 } }
        });

        return NextResponse.json({
            data: {
                stats: {
                    activeLoans: activeLoansRes[0].count || 0,
                    overdueLoans: overdueLoansRes[0].count || 0,
                    capitalOutstanding: outstandingRes[0].sum || 0,
                    expectedThisCycle: expectedRes[0].sum || 0,
                    collectedThisMonth: collectedRes[0].sum || 0,
                },
                activity,
                overdueLoansList
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
