import db from "@/core/db";
import { auditLogs } from "@/core/db/schema";
import { applyPayment, type BillingCycleData } from "@/lib/interest";
import { parseCurrency } from "@/lib/utils";
import {
    findAllPayments,
    findActiveBillingCycle,
    createPayment,
    updateBillingCycle,
} from "@/core/repositories/payment-repository";
import { updateLoanStatus } from "@/core/repositories/loan-repository";

export async function listPayments() {
    return findAllPayments();
}

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
        // 1. Find the active billing cycle
        const cycle = await findActiveBillingCycle(loanId, tx);

        if (!cycle) {
            throw new Error(
                "No open or overdue billing cycle found for this loan to apply payment to."
            );
        }

        // 2. Create the payment record
        const payment = await createPayment(
            {
                loanId,
                cycleId: cycle.id,
                amount: (Number(paymentCents) / 100).toFixed(2),
                paidAt: new Date(data.paidAt).toISOString().split("T")[0],
                note: data.note,
            },
            tx
        );

        // 3. Recalculate cycle with payment applied
        const cycleData: BillingCycleData = {
            openingPrincipalCents: parseCurrency(cycle.openingPrincipal),
            interestChargedCents: parseCurrency(cycle.interestCharged),
            totalDueCents: parseCurrency(cycle.totalDue),
            totalPaidCents: parseCurrency(cycle.totalPaid),
            balanceCents: parseCurrency(cycle.balance),
        };

        const updatedCycleData = applyPayment(cycleData, paymentCents);
        const isSettled = updatedCycleData.balanceCents <= 0n;

        // 4. Update the billing cycle
        await updateBillingCycle(
            cycle.id,
            {
                totalPaid: (Number(updatedCycleData.totalPaidCents) / 100).toFixed(2),
                balance: (Number(updatedCycleData.balanceCents) / 100).toFixed(2),
                status: isSettled ? "closed" : (cycle.status as "open" | "closed" | "overdue"),
            },
            tx
        );

        // 5. If fully settled, update the loan status
        if (isSettled) {
            await updateLoanStatus(loanId, "settled", tx);
        }

        // 6. Audit Log
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
