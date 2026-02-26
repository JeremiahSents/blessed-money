import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { loans, billingCycles, payments, auditLogs } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { applyPayment, BillingCycleData } from "@/lib/interest";
import { parseCurrency } from "@/lib/utils";
import { eq, and, or } from "drizzle-orm";
import { getErrorMessage } from "@/lib/errors";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { amount, paidAt, note } = body;

        const paymentCents = parseCurrency(amount);
        if (paymentCents <= 0n) {
            throw new Error("Payment amount must be greater than zero");
        }

        const recordedPayment = await db.transaction(async (tx) => {
            // 1. Find the active billing cycle for this loan
            const cycle = await tx.query.billingCycles.findFirst({
                where: and(
                    eq(billingCycles.loanId, params.id),
                    or(eq(billingCycles.status, "open"), eq(billingCycles.status, "overdue"))
                ),
                orderBy: (cycles, { desc }) => [desc(cycles.cycleNumber)],
            });

            if (!cycle) {
                throw new Error("No open or overdue billing cycle found for this loan to apply payment to.");
            }

            // 2. Create the payment record
            const [payment] = await tx.insert(payments).values({
                loanId: params.id,
                cycleId: cycle.id,
                amount: (Number(paymentCents) / 100).toFixed(2),
                paidAt: new Date(paidAt).toISOString().split('T')[0],
                note
            }).returning();

            // 3. Recalculate cycle with payment
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
            await tx.update(billingCycles)
                .set({
                    totalPaid: (Number(updatedCycleData.totalPaidCents) / 100).toFixed(2),
                    balance: (Number(updatedCycleData.balanceCents) / 100).toFixed(2),
                    status: isSettled ? "closed" : cycle.status
                })
                .where(eq(billingCycles.id, cycle.id));

            // 5. If settled, update the loan status
            if (isSettled) {
                await tx.update(loans)
                    .set({ status: "settled" })
                    .where(eq(loans.id, params.id));
            }

            // 6. Audit Log
            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "PAYMENT_RECORDED",
                entityType: "payment",
                entityId: payment.id,
                metadata: { payment, newCycleBalance: (Number(updatedCycleData.balanceCents) / 100).toFixed(2) }
            });

            return payment;
        });

        return NextResponse.json({ data: recordedPayment });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
    }
}
