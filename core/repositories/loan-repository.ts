import db from "@/core/db";
import { loans, billingCycles } from "@/core/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type LoanStatus = "active" | "overdue" | "settled";

export type LoanCreateInput = {
    customerId: string;
    principalAmount: string;
    interestRate: string;
    startDate: string;
    dueDate: string;
    status: LoanStatus;
    notes?: string | null;
};

export async function findManyLoans(opts: {
    status: LoanStatus | null;
    page: number;
    limit: number;
}) {
    const { status, page, limit } = opts;
    const offset = (page - 1) * limit;

    const whereClause = status ? eq(loans.status, status) : undefined;

    const data = await db.query.loans.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(loans.createdAt)],
        with: {
            customer: true,
            billingCycles: {
                orderBy: (cycles, { desc: d }) => [d(cycles.cycleNumber)],
                limit: 1, // only the latest/active cycle
            },
        },
    });

    const totalCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(whereClause);

    const total = totalCountRes[0].count;

    return { data, total };
}

export async function findLoanById(id: string) {
    return db.query.loans.findFirst({
        where: eq(loans.id, id),
        with: {
            customer: true,
            collateral: true,
            billingCycles: {
                orderBy: (cycles, { asc }) => [asc(cycles.cycleNumber)],
            },
            payments: {
                orderBy: (payments, { desc: d }) => [d(payments.paidAt)],
            },
        },
    });
}

export async function createLoan(input: LoanCreateInput, tx?: Tx) {
    const runner = tx ?? db;
    const [loan] = await runner.insert(loans).values(input).returning();
    return loan;
}

export async function updateLoanStatus(id: string, status: LoanStatus, tx?: Tx) {
    const runner = tx ?? db;
    await runner.update(loans).set({ status }).where(eq(loans.id, id));
}

export async function findOverdueLoansWithActiveCycles(opts: { limit: number }) {
    return db.query.loans.findMany({
        where: eq(loans.status, "overdue"),
        limit: opts.limit,
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
