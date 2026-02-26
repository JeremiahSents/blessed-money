import db from "@/core/db";
import { billingCycles, payments } from "@/core/db/schema";
import { and, desc, eq, or } from "drizzle-orm";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type PaymentCreateInput = {
    loanId: string;
    cycleId: string;
    amount: string;
    paidAt: string;
    note?: string | null;
};

export async function findAllPayments() {
    return db.query.payments.findMany({
        orderBy: [desc(payments.paidAt), desc(payments.createdAt)],
        with: {
            loan: {
                with: { customer: true },
            },
        },
    });
}

export async function findActiveBillingCycle(loanId: string, tx?: Tx) {
    const runner = tx ?? db;
    return runner.query.billingCycles.findFirst({
        where: and(
            eq(billingCycles.loanId, loanId),
            or(
                eq(billingCycles.status, "open"),
                eq(billingCycles.status, "overdue")
            )
        ),
        orderBy: (cycles, { desc: d }) => [d(cycles.cycleNumber)],
    });
}

export async function createPayment(input: PaymentCreateInput, tx?: Tx) {
    const runner = tx ?? db;
    const [payment] = await runner.insert(payments).values(input).returning();
    return payment;
}

export async function updateBillingCycle(
    cycleId: string,
    data: { totalPaid: string; balance: string; status: "overdue" | "open" | "closed" },
    tx?: Tx
) {
    const runner = tx ?? db;
    await runner
        .update(billingCycles)
        .set(data)
        .where(eq(billingCycles.id, cycleId));
}
