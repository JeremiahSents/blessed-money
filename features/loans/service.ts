import db from "@/db";
import { loans, billingCycles, auditLogs } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { createAgreedTermCycle } from "@/lib/interest";
import { parseCurrency } from "@/lib/utils";
import { addMonths } from "date-fns";

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

export type LoanCreatePayload = {
    customerId: string;
    principalAmount: number | string;
    interestRate?: string;
    startDate: string;
    dueDate: string;
    notes?: string | null;
};

// ── Queries ────────────────────────────────────────────────────────────────

export async function listLoans(opts: {
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

    return { data, total: totalCountRes[0].count };
}

export async function getLoan(id: string) {
    return db.query.loans.findFirst({
        where: eq(loans.id, id),
        with: {
            customer: {
                with: {
                    loans: {
                        orderBy: (loans, { desc: d }) => [d(loans.startDate)],
                        with: {
                            billingCycles: true,
                            payments: true,
                        },
                    },
                },
            },
            billingCycles: {
                orderBy: (cycles, { asc }) => [asc(cycles.cycleNumber)],
            },
            payments: {
                orderBy: (payments, { desc: d }) => [d(payments.paidAt)],
            },
        },
    });
}

// ── Shared command used by other features ────────────────────────────────────

export async function updateLoanStatus(id: string, status: LoanStatus, tx?: Tx) {
    const runner = tx ?? db;
    await runner.update(loans).set({ status }).where(eq(loans.id, id));
}

// ── Create loan + first billing cycle + audit ────────────────────────────────

export async function createLoanWithCycleAndAudit(
    data: LoanCreatePayload,
    userId: string
) {
    const principalFormatStr =
        typeof data.principalAmount === "number"
            ? data.principalAmount.toFixed(2)
            : data.principalAmount;

    const principalCents = parseCurrency(principalFormatStr);

    if (principalCents <= 0n) {
        throw new Error("Principal amount must be greater than zero");
    }

    const interestRate = data.interestRate || "0.2000";
    const start = new Date(data.startDate);
    const due = new Date(data.dueDate);
    const termMonths = Math.max(
        1,
        (due.getFullYear() - start.getFullYear()) * 12 + (due.getMonth() - start.getMonth())
    );

    const firstCycleData = createAgreedTermCycle(principalCents, interestRate, termMonths);

    return db.transaction(async (tx) => {
        // 1. Create Loan
        const [loan] = await tx.insert(loans).values({
            customerId: data.customerId,
            principalAmount: (Number(principalCents) / 100).toFixed(2),
            interestRate,
            startDate: new Date(data.startDate).toISOString().split("T")[0],
            dueDate: new Date(data.dueDate).toISOString().split("T")[0],
            status: "active",
            notes: data.notes,
        }).returning();

        // 2. Create First Billing Cycle
        await tx.insert(billingCycles).values({
            loanId: loan.id,
            cycleNumber: 1,
            cycleStartDate: loan.startDate,
            cycleEndDate: addMonths(new Date(loan.startDate), 1)
                .toISOString()
                .split("T")[0],
            openingPrincipal: (Number(firstCycleData.openingPrincipalCents) / 100).toFixed(2),
            interestCharged: (Number(firstCycleData.interestChargedCents) / 100).toFixed(2),
            totalDue: (Number(firstCycleData.totalDueCents) / 100).toFixed(2),
            totalPaid: "0.00",
            balance: (Number(firstCycleData.balanceCents) / 100).toFixed(2),
            status: "open",
        });

        // 3. Audit Log for Loan
        const initialCycleForAudit = {
            openingPrincipalCents: Number(firstCycleData.openingPrincipalCents),
            interestChargedCents: Number(firstCycleData.interestChargedCents),
            totalDueCents: Number(firstCycleData.totalDueCents),
            totalPaidCents: Number(firstCycleData.totalPaidCents),
            balanceCents: Number(firstCycleData.balanceCents),
        };

        await tx.insert(auditLogs).values({
            userId,
            action: "LOAN_CREATED",
            entityType: "loan",
            entityId: loan.id,
            metadata: { after: loan, initialCycle: initialCycleForAudit },
        });

        return loan;
    });
}
