import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { loans, billingCycles, auditLogs } from "@/src/db/schema";
import { and, eq, lte, gt } from "drizzle-orm";
import { calculateNextCycle } from "@/lib/interest";
import { parseCurrency } from "@/lib/utils";
import { addMonths } from "date-fns";
import { getErrorMessage } from "@/lib/errors";

export async function POST(req: NextRequest) {
    // Secured by CRON_SECRET
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const today = new Date().toISOString().split('T')[0];

        // Find all billingCycles where cycleEndDate < today AND status = 'open' AND balance > 0
        const cyclesToRollover = await db.query.billingCycles.findMany({
            where: and(
                lte(billingCycles.cycleEndDate, today),
                eq(billingCycles.status, 'open'),
                gt(billingCycles.balance, '0') // Using string '0' since it's numeric type
            ),
            with: { loan: true }
        });

        const rolledOverCount = cyclesToRollover.length;

        for (const cycle of cyclesToRollover) {
            await db.transaction(async (tx) => {
                // 1. Set current cycle to overdue
                await tx.update(billingCycles)
                    .set({ status: 'overdue' })
                    .where(eq(billingCycles.id, cycle.id));

                // 2. Set loan to overdue
                await tx.update(loans)
                    .set({ status: 'overdue' })
                    .where(eq(loans.id, cycle.loanId));

                // 3. Calculate next cycle values
                const prevBalanceCents = parseCurrency(cycle.balance);
                const nextCycleData = calculateNextCycle(prevBalanceCents, cycle.loan.interestRate);

                const newStartDate = new Date(cycle.cycleEndDate);
                const newEndDate = addMonths(newStartDate, 1);

                // 4. Create next cycle
                const [newCycle] = await tx.insert(billingCycles).values({
                    loanId: cycle.loanId,
                    cycleNumber: cycle.cycleNumber + 1,
                    cycleStartDate: newStartDate.toISOString().split('T')[0],
                    cycleEndDate: newEndDate.toISOString().split('T')[0],
                    openingPrincipal: (Number(nextCycleData.openingPrincipalCents) / 100).toFixed(2),
                    interestCharged: (Number(nextCycleData.interestChargedCents) / 100).toFixed(2),
                    totalDue: (Number(nextCycleData.totalDueCents) / 100).toFixed(2),
                    totalPaid: "0.00",
                    balance: (Number(nextCycleData.balanceCents) / 100).toFixed(2),
                    status: 'open',
                }).returning();

                // 5. Audit Log
                await tx.insert(auditLogs).values({
                    userId: 'system-cron', // Service action
                    action: 'CYCLE_ROLLED_OVER',
                    entityType: 'loan',
                    entityId: cycle.loanId,
                    metadata: { previousCycle: cycle.id, newCycle: newCycle.id }
                });
            });
        }

        return NextResponse.json({ message: "Rollover complete", count: rolledOverCount });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}
