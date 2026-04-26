import { formatCompactCurrency, getAvatarColor, getInitials } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import type { ActivityItem } from "@/lib/types";

export function ActivityFeed({
    activity = [],
    emptyLabel = "No activity yet",
}: {
    activity: ActivityItem[];
    emptyLabel?: string;
}) {
    if (activity.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground/50">{emptyLabel}</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-border/70 -mx-1">
            {activity.map((item, i) => {
                const isPayment = item.type === "PAYMENT";
                const customerName = isPayment
                    ? (item.data as any).loan?.customer?.name || "Customer"
                    : (item.data as any).customer?.name || "Customer";
                const amount = parseFloat(isPayment ? item.data.amount : item.data.principalAmount);
                const dateObj = new Date(item.date);
                const dateStr = format(dateObj, "d MMM yyyy");
                let relative: string;
                try {
                    relative = formatDistanceToNow(dateObj, { addSuffix: true });
                } catch {
                    relative = dateStr;
                }
                const note = isPayment ? (item.data as any).note : null;

                return (
                    <Link
                        key={i}
                        href={`/loans/${isPayment ? item.data.loanId : item.data.id}`}
                        className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-muted/40 active:bg-muted/60 rounded-lg"
                    >
                        <div className="relative shrink-0">
                            <Avatar className="w-10 h-10">
                                <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(customerName)}`}>
                                    {getInitials(customerName)}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-card ${
                                    isPayment
                                        ? "bg-emerald-500 text-white"
                                        : "bg-violet-500 text-white"
                                }`}
                            >
                                <HugeiconsIcon
                                    icon={isPayment ? Coins01Icon : PlusSignIcon}
                                    className="w-3 h-3"
                                />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground truncate">
                                    {customerName}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {isPayment ? "Payment received" : "Loan issued"} &middot; {relative}
                                {note ? ` · ${note}` : ""}
                            </p>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                            <p className={`text-sm font-semibold tabular-nums ${
                                isPayment
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-foreground"
                            }`}>
                                {isPayment ? "+" : ""}{formatCompactCurrency(amount)}
                            </p>
                            <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                                {dateStr}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
