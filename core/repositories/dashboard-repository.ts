import db from "@/core/db";
import { loans, billingCycles, payments, appSettings } from "@/core/db/schema";
import { and, eq, or, sql, gte, lte, desc } from "drizzle-orm";
import { endOfMonth, startOfMonth } from "date-fns";

export async function getDashboardStats() {
    const settingsRes = await db
        .select({ workingCapital: appSettings.workingCapital })
        .from(appSettings)
        .limit(1);

    const baseWorkingCapital = settingsRes[0]?.workingCapital ?? "0";

    const activeLoansRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(eq(loans.status, "active"));

    const overdueLoansRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(eq(loans.status, "overdue"));

    const principalIssuedRes = await db
        .select({
            sum: sql<number>`sum(CAST(${loans.principalAmount} AS NUMERIC))`,
        })
        .from(loans);

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

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now).toISOString().split("T")[0];
    const endOfCurrentMonth = endOfMonth(now).toISOString().split("T")[0];

    const collectedRes = await db
        .select({
            sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))`,
        })
        .from(payments)
        .where(gte(payments.paidAt, startOfCurrentMonth));

    const totalCollectedAllTimeRes = await db
        .select({
            sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))`,
        })
        .from(payments);

    const lentThisMonthRes = await db
        .select({
            sum: sql<number>`sum(CAST(${loans.principalAmount} AS NUMERIC))`,
        })
        .from(loans)
        .where(gte(loans.createdAt, startOfMonth(now)));

    const remainingThisMonthRes = await db
        .select({
            sum: sql<number>`sum(CAST(${billingCycles.balance} AS NUMERIC))`,
        })
        .from(billingCycles)
        .where(
            and(
                or(
                    eq(billingCycles.status, "open"),
                    eq(billingCycles.status, "overdue")
                ),
                lte(billingCycles.cycleEndDate, endOfCurrentMonth)
            )
        );

    const principalIssued = parseFloat(String(principalIssuedRes[0].sum || "0"));
    const totalCollectedAllTime = parseFloat(String(totalCollectedAllTimeRes[0].sum || "0"));
    const outstanding = parseFloat(String(outstandingRes[0].sum || "0"));
    const collected = parseFloat(String(collectedRes[0].sum || "0"));
    const lentThisMonth = parseFloat(String(lentThisMonthRes[0].sum || "0"));
    const remainingThisMonth = parseFloat(String(remainingThisMonthRes[0].sum || "0"));

    const workingCapitalCurrent =
        parseFloat(baseWorkingCapital) - principalIssued + totalCollectedAllTime;

    // Net worth = cash on hand + outstanding receivables
    const netWorth = workingCapitalCurrent + outstanding;

    return {
        activeLoans: activeLoansRes[0].count || 0,
        overdueLoans: overdueLoansRes[0].count || 0,
        capitalOutstanding: outstanding,
        collectedThisMonth: collected,
        lentThisMonth,
        remainingThisMonth,
        netWorth,
        workingCapitalBase: baseWorkingCapital,
        workingCapitalCurrent,
    };
}

export async function getRecentActivity() {
    const recentPayments = await db.query.payments.findMany({
        limit: 10,
        orderBy: [desc(payments.createdAt)],
        with: {
            loan: {
                with: {
                    customer: true,
                },
            },
        },
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
