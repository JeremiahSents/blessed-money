import { formatCompactCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { ActivityItem } from "@/lib/types";

export function ActivityFeed({ activity = [] }: { activity: ActivityItem[] }) {
    if (activity.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground/50">No activity yet</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
            {activity.map((item, i) => {
                const isPayment = item.type === "PAYMENT";
                const customerName = isPayment
                    ? (item.data as any).loan?.customer?.name || "Customer"
                    : (item.data as any).customer?.name || "Customer";
                const amount = parseFloat(isPayment ? item.data.amount : item.data.principalAmount);
                const dateStr = format(new Date(item.date), "d MMM yyyy");

                return (
                    <Link
                        key={i}
                        href={`/loans/${isPayment ? item.data.loanId : item.data.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-muted"
                    >
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            isPayment
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
                        }`}>
                            <HugeiconsIcon
                                icon={isPayment ? Coins01Icon : PlusSignIcon}
                                className="w-5 h-5"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {customerName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isPayment ? "Payment received" : "Loan issued"} &middot; {dateStr}
                            </p>
                        </div>

                        <p className={`text-sm font-semibold tabular-nums shrink-0 ${
                            isPayment
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                        }`}>
                            {isPayment ? "+" : "\u2013"}{formatCompactCurrency(amount)}
                        </p>
                    </Link>
                );
            })}
        </div>
    );
}
