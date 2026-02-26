import db from "@/core/db";
import { loans, billingCycles, payments } from "@/core/db/schema";
import { eq, or, sql, gte, desc } from "drizzle-orm";
import { startOfMonth } from "date-fns";

export async function getDashboardStats() {
    const activeLoansRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(eq(loans.status, "active"));

    const overdueLoansRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(eq(loans.status, "overdue"));

    const outstandingRes = await db
        .select({
            sum: sql<number>`sum(CAST(${billingCycles.balance} AS NUMERIC))`,
        })
        .from(billingCycles)
        .where(
            or(
                eq(billingCycles.status, "open"),
                eq(billingCycles.status, "overdue")
            )
        );

    const expectedRes = await db
        .select({
            sum: sql<number>`sum(CAST(${billingCycles.totalDue} AS NUMERIC))`,
        })
        .from(billingCycles)
        .where(eq(billingCycles.status, "open"));

    const startOfCurrentMonth = startOfMonth(new Date())
        .toISOString()
        .split("T")[0];

    const collectedRes = await db
        .select({
            sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))`,
        })
        .from(payments)
        .where(gte(payments.paidAt, startOfCurrentMonth));

    return {
        activeLoans: activeLoansRes[0].count || 0,
        overdueLoans: overdueLoansRes[0].count || 0,
        capitalOutstanding: outstandingRes[0].sum || 0,
        expectedThisCycle: expectedRes[0].sum || 0,
        collectedThisMonth: collectedRes[0].sum || 0,
    };
}

export async function getRecentActivity() {
    const recentPayments = await db.query.payments.findMany({
        limit: 10,
        orderBy: [desc(payments.createdAt)],
        with: { loan: { with: { customer: true } } },
    });

    const recentLoans = await db.query.loans.findMany({
        limit: 10,
        orderBy: [desc(loans.createdAt)],
        with: { customer: true },
    });

    return { recentPayments, recentLoans };
}

export async function getOverdueList() {
    return db.query.loans.findMany({
        where: eq(loans.status, "overdue"),
        limit: 10,
        with: {
            customer: true,
            billingCycles: {
                where: eq(billingCycles.status, "overdue"),
                orderBy: [desc(billingCycles.cycleNumber)],
                limit: 1,
            },
        },
    });
}
