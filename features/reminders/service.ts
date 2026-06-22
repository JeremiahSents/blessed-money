import db from "@/db";
import { billingCycles, auditLogs, payments } from "@/db/schema";
import { createPenaltyCycleFromRemaining } from "@/lib/interest";
import { parseCurrency } from "@/lib/utils";
import { and, eq, lte, gt, sql } from "drizzle-orm";
import { addMonths } from "date-fns";
import { Resend } from "resend";
import { updateLoanStatus } from "@/features/loans/service";
import { updateBillingCycle } from "@/features/payments/service";

// ── Email ────────────────────────────────────────────────────────────────────

interface PaymentDueInfo {
    customerName: string;
    amountDue: string;
    loanId: string;
}

async function sendDailyRemindersEmail(data: {
    businessName: string;
    adminName: string;
    adminEmail: string;
    duePayments: PaymentDueInfo[];
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not set. Skipping email send.");
        return { data: null, error: { message: "RESEND_API_KEY is not set" } };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { businessName, adminName, adminEmail, duePayments } = data;

    const paymentsHtmlList = duePayments.map(p => `
        <li style="margin-bottom: 10px;">
            <strong>Customer:</strong> ${p.customerName}<br/>
            <strong>Amount Due:</strong> UGX ${p.amountDue}<br/>
            <strong>Loan ID:</strong> ${p.loanId}
        </li>
    `).join("");

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Daily Payment Reminders - ${businessName}</h2>
            <p>Hello ${adminName},</p>
            <p>This is your daily reminder that the following customers have payments due today:</p>
            <ul style="list-style-type: none; padding-left: 0;">${paymentsHtmlList}</ul>
            <p>Please log in to your dashboard to manage these payments.</p>
            <p>Best regards,<br/>The ${businessName} Team</p>
        </div>
    `;

    try {
        const { data: responseData, error } = await resend.emails.send({
            from: "payments@shopvendly.store",
            to: [adminEmail],
            subject: `[${businessName}] Daily Payments Due Reminder`,
            html: htmlContent,
        });
        if (error) console.error("Failed to send daily reminder email:", error);
        return { data: responseData, error };
    } catch (err) {
        console.error("Unexpected error sending email via Resend:", err);
        return { data: null, error: { message: "Unexpected error" } };
    }
}

// ── Rollover overdue cycles ───────────────────────────────────────────────────

export async function rolloverOverdueCycles() {
    const today = new Date().toISOString().split("T")[0];

    const cyclesToRollover = await db.query.billingCycles.findMany({
        where: and(
            lte(billingCycles.cycleEndDate, today),
            eq(billingCycles.status, "open"),
            gt(billingCycles.balance, "0")
        ),
        with: { loan: true },
    });

    for (const cycle of cyclesToRollover) {
        await db.transaction(async (tx) => {
            await updateBillingCycle(cycle.id, { totalPaid: cycle.totalPaid, balance: cycle.balance, status: "overdue" }, tx);
            await updateLoanStatus(cycle.loanId, "overdue", tx);

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

            await tx.insert(auditLogs).values({
                userId: "system-cron",
                action: "CYCLE_ROLLED_OVER",
                entityType: "loan",
                entityId: cycle.loanId,
                metadata: { previousCycle: cycle.id, newCycle: newCycle.id },
            });
        });
    }

    return cyclesToRollover.length;
}

// ── Daily reminder emails ─────────────────────────────────────────────────────

export async function sendDailyReminders() {
    const today = new Date().toISOString().split("T")[0];

    const cyclesDueToday = await db.query.billingCycles.findMany({
        where: and(
            eq(billingCycles.cycleEndDate, today),
            eq(billingCycles.status, "open"),
            gt(billingCycles.balance, "0")
        ),
        with: { loan: { with: { customer: true } } },
    });

    const duePayments = cyclesDueToday
        .filter((cycle) => cycle.loan?.customer)
        .map((cycle) => ({
            customerName: cycle.loan.customer.name,
            amountDue: cycle.balance,
            loanId: cycle.loan.id,
        }));

    if (duePayments.length === 0) {
        return { emailsSent: 0, totalAdminNotified: 0 };
    }

    const { error } = await sendDailyRemindersEmail({
        businessName: "Blessed Money",
        adminName: "Admin",
        adminEmail: process.env.ADMIN_EMAIL ?? "",
        duePayments,
    });

    const emailsSent = error ? 0 : 1;
    return { emailsSent, totalAdminNotified: emailsSent };
}
