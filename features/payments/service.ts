import db from "@/db";
import { billingCycles, payments, auditLogs } from "@/db/schema";
import { and, desc, eq, or } from "drizzle-orm";
import { applyPayment, type BillingCycleData } from "@/lib/interest";
import { parseCurrency } from "@/lib/utils";
import { updateLoanStatus } from "@/features/loans/service";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ── Queries ────────────────────────────────────────────────────────────────

export async function listPayments() {
    return db.query.payments.findMany({
        orderBy: [desc(payments.paidAt), desc(payments.createdAt)],
        with: {
            loan: { with: { customer: true } },
        },
    });
}

async function findActiveBillingCycle(loanId: string, tx?: Tx) {
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

// Shared command used by the rollover cron.
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

// ── Record a payment against a loan's active cycle ────────────────────────────

export async function recordPayment(
    loanId: string,
    data: { amount: string | number; paidAt: string; note?: string | null },
    userId: string
) {
    const paymentCents = parseCurrency(String(data.amount));

    if (paymentCents <= 0n) {
        throw new Error("Payment amount must be greater than zero");
    }

    return db.transaction(async (tx) => {
        const cycle = await findActiveBillingCycle(loanId, tx);

        if (!cycle) {
            throw new Error(
                "No open or overdue billing cycle found for this loan to apply payment to."
            );
        }

        const [payment] = await tx.insert(payments).values({
            loanId,
            cycleId: cycle.id,
            amount: (Number(paymentCents) / 100).toFixed(2),
            paidAt: new Date(data.paidAt).toISOString().split("T")[0],
            note: data.note,
        }).returning();

        const cycleData: BillingCycleData = {
            openingPrincipalCents: parseCurrency(cycle.openingPrincipal),
            interestChargedCents: parseCurrency(cycle.interestCharged),
            totalDueCents: parseCurrency(cycle.totalDue),
            totalPaidCents: parseCurrency(cycle.totalPaid),
            balanceCents: parseCurrency(cycle.balance),
        };

        const updatedCycleData = applyPayment(cycleData, paymentCents);
        const isSettled = updatedCycleData.balanceCents <= 0n;

        await updateBillingCycle(
            cycle.id,
            {
                totalPaid: (Number(updatedCycleData.totalPaidCents) / 100).toFixed(2),
                balance: (Number(updatedCycleData.balanceCents) / 100).toFixed(2),
                status: isSettled ? "closed" : (cycle.status as "open" | "closed" | "overdue"),
            },
            tx
        );

        if (isSettled) {
            await updateLoanStatus(loanId, "settled", tx);
        }

        await tx.insert(auditLogs).values({
            userId,
            action: "PAYMENT_RECORDED",
            entityType: "payment",
            entityId: payment.id,
            metadata: {
                payment,
                newCycleBalance: (Number(updatedCycleData.balanceCents) / 100).toFixed(2),
            },
        });

        return payment;
    });
}
