import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { HugeiconsIcon } from '@hugeicons/react';
import { 
    MoneyReceive01Icon, 
    DocumentAttachmentIcon 
} from '@hugeicons/core-free-icons';
import Link from "next/link";
import type { ActivityItem } from "@/lib/types";

export function ActivityFeed({ activity = [] }: { activity: ActivityItem[] }) {
    if (activity.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                <p className="text-xs font-semibold uppercase text-zinc-300 dark:text-zinc-700">No activity yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {activity.map((item, i) => {
                const isPayment = item.type === "PAYMENT";
                const customerName = isPayment 
                    ? (item.data as any).loan?.customer?.name || "Customer"
                    : (item.data as any).customer?.name || "Customer";

                return (
                    <Link
                        key={i}
                        href={`/loans/${isPayment ? item.data.loanId : item.data.id}`}
                        className="flex gap-4 items-start py-3 px-2 transition-all active:bg-zinc-50 dark:active:bg-zinc-900/50 rounded-xl group"
                    >
                        <div className={`shrink-0 w-10 h-10 flex items-center justify-center ${isPayment
                                ? 'text-emerald-500'
                                : 'text-blue-500'
                            }`}>
                            <HugeiconsIcon
                                icon={isPayment ? MoneyReceive01Icon : DocumentAttachmentIcon}
                                className="w-6 h-6"
                            />
                        </div>

                        <div className="flex-1 min-w-0 border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
                            <div className="flex justify-between items-start gap-4">
                                <div className="truncate">
                                    <div className="flex flex-wrap items-center gap-x-2">
                                        <p className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                                            {customerName}
                                        </p>
                                        <span className={`text-[9px] font-semibold uppercase px-1.5 py-0 rounded-md ${
                                            isPayment 
                                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                              : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                          }`}>
                                          {isPayment ? "Payment" : "Loan"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-600 uppercase mt-0.5">
                                        {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 pt-0.5">
                                    <p className={`text-[15px] font-semibold tabular-nums ${isPayment ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                        {isPayment ? '+' : ''}{formatCurrency(parseFloat(isPayment ? item.data.amount : item.data.principalAmount))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
