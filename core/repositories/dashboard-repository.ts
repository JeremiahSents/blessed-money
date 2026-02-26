import db from "@/core/db";
import { loans, billingCycles, payments, customers, appSettings } from "@/core/db/schema";
import { eq, or, sql, gte, desc, and, inArray } from "drizzle-orm";
import { startOfMonth } from "date-fns";

export async function getDashboardStats(userId: string) {
    const baseWorkingCapitalRes = await db
        .select({ workingCapital: appSettings.workingCapital })
        .from(appSettings)
        .where(eq(appSettings.userId, userId));

    const baseWorkingCapital = baseWorkingCapitalRes[0]?.workingCapital ?? "0";

    const activeLoansRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .innerJoin(customers, eq(customers.id, loans.customerId))
        .where(and(eq(customers.userId, userId), eq(loans.status, "active")));

    const overdueLoansRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .innerJoin(customers, eq(customers.id, loans.customerId))
        .where(and(eq(customers.userId, userId), eq(loans.status, "overdue")));

    const principalIssuedRes = await db
        .select({
            sum: sql<number>`sum(CAST(${loans.principalAmount} AS NUMERIC))`,
        })
        .from(loans)
        .innerJoin(customers, eq(customers.id, loans.customerId))
        .where(eq(customers.userId, userId));

    const outstandingRes = await db
        .select({
            sum: sql<number>`sum(CAST(${billingCycles.balance} AS NUMERIC))`,
        })
        .from(billingCycles)
        .innerJoin(loans, eq(loans.id, billingCycles.loanId))
        .innerJoin(customers, eq(customers.id, loans.customerId))
        .where(
            and(
                eq(customers.userId, userId),
                or(
                    eq(billingCycles.status, "open"),
                    eq(billingCycles.status, "overdue")
                )
            )
        );

    const expectedRes = await db
        .select({
            sum: sql<number>`sum(CAST(${billingCycles.totalDue} AS NUMERIC))`,
        })
        .from(billingCycles)
        .innerJoin(loans, eq(loans.id, billingCycles.loanId))
        .innerJoin(customers, eq(customers.id, loans.customerId))
        .where(and(eq(customers.userId, userId), eq(billingCycles.status, "open")));

    const startOfCurrentMonth = startOfMonth(new Date())
        .toISOString()
        .split("T")[0];

    const collectedRes = await db
        .select({
            sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))`,
        })
        .from(payments)
        .innerJoin(loans, eq(loans.id, payments.loanId))
        .innerJoin(customers, eq(customers.id, loans.customerId))
        .where(and(eq(customers.userId, userId), gte(payments.paidAt, startOfCurrentMonth)));

    const totalCollectedAllTimeRes = await db
        .select({
            sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))`,
        })
        .from(payments)
        .innerJoin(loans, eq(loans.id, payments.loanId))
        .innerJoin(customers, eq(customers.id, loans.customerId))
        .where(eq(customers.userId, userId));

    const principalIssued = principalIssuedRes[0].sum || 0;
    const totalCollectedAllTime = totalCollectedAllTimeRes[0].sum || 0;
    const workingCapitalCurrent =
        parseFloat(baseWorkingCapital) - principalIssued + totalCollectedAllTime;

    return {
        activeLoans: activeLoansRes[0].count || 0,
        overdueLoans: overdueLoansRes[0].count || 0,
        capitalOutstanding: outstandingRes[0].sum || 0,
        expectedThisCycle: expectedRes[0].sum || 0,
        collectedThisMonth: collectedRes[0].sum || 0,
        workingCapitalBase: baseWorkingCapital,
        workingCapitalCurrent,
    };
}

export async function getRecentActivity(userId: string) {
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
        where: (p) =>
            inArray(
                p.loanId,
                db
                    .select({ id: loans.id })
                    .from(loans)
                    .innerJoin(customers, eq(customers.id, loans.customerId))
                    .where(eq(customers.userId, userId))
            ),
    });

    const recentLoans = await db.query.loans.findMany({
        limit: 10,
        orderBy: [desc(loans.createdAt)],
        with: { customer: true },
        where: (l) =>
            inArray(
                l.customerId,
                db
                    .select({ id: customers.id })
                    .from(customers)
                    .where(eq(customers.userId, userId))
            ),
    });

    return { recentPayments, recentLoans };
}

export async function getOverdueList(userId: string) {
    return db.query.loans.findMany({
        where: and(
            eq(loans.status, "overdue"),
            inArray(
                loans.customerId,
                db
                    .select({ id: customers.id })
                    .from(customers)
                    .where(eq(customers.userId, userId))
            )
        ),
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
