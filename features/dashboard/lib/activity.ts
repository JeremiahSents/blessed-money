import { differenceInCalendarDays } from "date-fns";

/**
 * Builds a unified, typed activity feed for the dashboard from data the
 * `/api/dashboard` endpoint already returns (recent payments + recent loans +
 * the overdue list). No extra API calls — everything is derived client-side.
 *
 * Each event carries a `kind` so the UI can give it a distinct icon + colour,
 * letting the lender tell at a glance whether they loaned money out, received a
 * payment, or someone is running late / has missed entirely.
 */

export type ActivityKind =
    | "disbursed"
    | "payment"
    | "late"
    | "missed"
    | "milestone";

export type FeedItem = {
    id: string;
    kind: ActivityKind;
    /** Person the event is about. */
    name: string;
    /** Short human description, e.g. "Payment received", "12 days overdue". */
    label: string;
    amount: number | null;
    /** Sign shown before the amount. */
    sign: "+" | "-" | "";
    date: string | Date | null;
    href: string;
    /** The loan this event belongs to — used to open the collect sheet. */
    loanId: string;
    customerId: string | null;
};

// ── Loose shapes matching the dashboard API response ─────────────────────────
type ApiPayment = {
    id: string;
    loanId: string;
    amount: string;
    paidAt: string;
    createdAt?: string | Date;
    loan?: { id?: string; customer?: { id: string; name: string } };
};

type ApiLoan = {
    id: string;
    principalAmount: string;
    status: "active" | "overdue" | "settled";
    createdAt?: string | Date;
    startDate?: string;
    customer?: { id: string; name: string };
};

type ApiOverdueLoan = ApiLoan & {
    billingCycles?: Array<{ balance: string; cycleEndDate?: string }>;
};

type ApiActivityItem =
    | { type: "PAYMENT"; date: string | Date; data: ApiPayment }
    | { type: "LOAN"; date: string | Date; data: ApiLoan };

export function buildActivityFeed(input: {
    activity?: ApiActivityItem[];
    overdueLoansList?: ApiOverdueLoan[];
}): FeedItem[] {
    const items: FeedItem[] = [];
    const now = new Date();

    for (const entry of input.activity ?? []) {
        if (entry.type === "PAYMENT") {
            const p = entry.data;
            items.push({
                id: `pay-${p.id}`,
                kind: "payment",
                name: p.loan?.customer?.name ?? "Customer",
                label: "Payment received",
                amount: parseFloat(p.amount || "0"),
                sign: "+",
                date: p.createdAt ?? p.paidAt ?? entry.date,
                href: `/loans/${p.loan?.id ?? p.loanId}`,
                loanId: p.loan?.id ?? p.loanId,
                customerId: p.loan?.customer?.id ?? null,
            });
        } else {
            const l = entry.data;
            const settled = l.status === "settled";
            items.push({
                id: `loan-${l.id}`,
                kind: settled ? "milestone" : "disbursed",
                name: l.customer?.name ?? "Customer",
                label: settled ? "Loan fully repaid" : "Loan disbursed",
                amount: parseFloat(l.principalAmount || "0"),
                sign: settled ? "" : "-",
                date: l.createdAt ?? l.startDate ?? entry.date,
                href: `/loans/${l.id}`,
                loanId: l.id,
                customerId: l.customer?.id ?? null,
            });
        }
    }

    for (const l of input.overdueLoansList ?? []) {
        const cycle = l.billingCycles?.[0];
        const due = cycle?.cycleEndDate ? new Date(cycle.cycleEndDate) : null;
        const daysOverdue = due ? Math.max(0, differenceInCalendarDays(now, due)) : 0;
        const missed = daysOverdue > 30;
        items.push({
            id: `overdue-${l.id}`,
            kind: missed ? "missed" : "late",
            name: l.customer?.name ?? "Customer",
            label: missed
                ? `Missed · ${daysOverdue} days overdue`
                : daysOverdue > 0
                    ? `${daysOverdue} days overdue`
                    : "Payment overdue",
            amount: cycle ? parseFloat(cycle.balance || "0") : null,
            sign: "",
            date: cycle?.cycleEndDate ?? null,
            href: `/loans/${l.id}`,
            loanId: l.id,
            customerId: l.customer?.id ?? null,
        });
    }

    return items.sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
    });
}
