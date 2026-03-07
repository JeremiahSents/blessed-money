import db from "@/core/db";
import { billingCycles, auditLogs, payments } from "@/core/db/schema";
import { createPenaltyCycleFromRemaining } from "@/lib/interest";
import { parseCurrency } from "@/lib/utils";
import { and, eq, lte, gt, sql } from "drizzle-orm";
import { updateLoanStatus } from "@/core/repositories/loan-repository";
import { updateBillingCycle } from "@/core/repositories/payment-repository";
import { addMonths } from "date-fns";
import { sendDailyRemindersEmail } from "@/core/services/email-service";

export async function rolloverOverdueCycles() {
    const today = new Date().toISOString().split("T")[0];

    // Find all billing cycles where cycleEndDate < today AND status = 'open' AND balance > 0
    const cyclesToRollover = await db.query.billingCycles.findMany({
        where: and(
            lte(billingCycles.cycleEndDate, today),
            eq(billingCycles.status, "open"),
            gt(billingCycles.balance, "0")
        ),
        with: { loan: true },
    });

    const rolledOverCount = cyclesToRollover.length;

    for (const cycle of cyclesToRollover) {
        await db.transaction(async (tx) => {
            // 1. Mark current cycle as overdue
            await updateBillingCycle(cycle.id, { totalPaid: cycle.totalPaid, balance: cycle.balance, status: "overdue" }, tx);

            // 2. Mark loan as overdue
            await updateLoanStatus(cycle.loanId, "overdue", tx);

            // 3. Determine remaining balance and whether borrower has started paying
            const prevBalanceCents = parseCurrency(cycle.balance);

            const paymentCountRes = await tx
                .select({ count: sql<number>`count(*)` })
                .from(payments)
                .where(eq(payments.loanId, cycle.loanId));

            const hasAnyPayments = (paymentCountRes[0]?.count || 0) > 0;

            const nextCycleData = hasAnyPayments
                ? createPenaltyCycleFromRemaining(prevBalanceCents, cycle.loan.interestRate)
                : {
                    openingPrincipalCents: prevBalanceCents,
                    interestChargedCents: 0n,
                    totalDueCents: prevBalanceCents,
                    totalPaidCents: 0n,
                    balanceCents: prevBalanceCents,
                };

            const newStartDate = new Date(cycle.cycleEndDate);
            const newEndDate = addMonths(newStartDate, 1);

            // 4. Create next billing cycle
            const [newCycle] = await tx
                .insert(billingCycles)
                .values({
                    loanId: cycle.loanId,
                    cycleNumber: cycle.cycleNumber + 1,
                    cycleStartDate: newStartDate.toISOString().split("T")[0],
                    cycleEndDate: newEndDate.toISOString().split("T")[0],
                    openingPrincipal: (Number(nextCycleData.openingPrincipalCents) / 100).toFixed(2),
                    interestCharged: (Number(nextCycleData.interestChargedCents) / 100).toFixed(2),
                    totalDue: (Number(nextCycleData.totalDueCents) / 100).toFixed(2),
                    totalPaid: "0.00",
                    balance: (Number(nextCycleData.balanceCents) / 100).toFixed(2),
                    status: "open",
                })
                .returning();

            // 5. Audit Log
            await tx.insert(auditLogs).values({
                userId: "system-cron",
                action: "CYCLE_ROLLED_OVER",
                entityType: "loan",
                entityId: cycle.loanId,
                metadata: { previousCycle: cycle.id, newCycle: newCycle.id },
            });
        });
    }

    return rolledOverCount;
}

export async function sendDailyReminders() {
    const today = new Date().toISOString().split("T")[0];

    // Find all billing cycles due today with an outstanding balance
    const cyclesDueToday = await db.query.billingCycles.findMany({
        where: and(
            eq(billingCycles.cycleEndDate, today),
            eq(billingCycles.status, "open"),
            gt(billingCycles.balance, "0")
        ),
        with: {
            loan: {
                with: {
                    customer: {
                        with: {
                            business: {
                                with: {
                                    user: true
                                }
                            }
                        }
                    }
                }
            }
        },
    });

    // Group due payments by business/admin
    const businessesToNotify = new Map<string, {
        businessName: string;
        adminName: string;
        adminEmail: string;
        duePayments: {
            customerName: string;
            amountDue: string;
            loanId: string;
        }[];
    }>();

    for (const cycle of cyclesDueToday) {
        const loan = cycle.loan;
        const customer = loan?.customer;
        const business = customer?.business;
        const admin = business?.user;

        if (!admin || !admin.email) continue;

        if (!businessesToNotify.has(business.id)) {
            businessesToNotify.set(business.id, {
                businessName: business.name,
                adminName: admin.name,
                adminEmail: admin.email,
                duePayments: [],
            });
        }

        businessesToNotify.get(business.id)!.duePayments.push({
            customerName: customer.name,
            amountDue: cycle.balance,
            loanId: loan.id,
        });
    }

    let emailsSent = 0;
    for (const data of businessesToNotify.values()) {
        const { error } = await sendDailyRemindersEmail(data);
        if (!error) {
            emailsSent++;
        }
    }

    return { emailsSent, totalAdminNotified: businessesToNotify.size };
}
