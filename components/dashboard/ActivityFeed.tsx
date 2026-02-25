import { formatCurrency, formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

export function ActivityFeed({ activity = [] }: { activity: any[] }) {
    if (activity.length === 0) {
        return <div className="text-sm text-zinc-500 italic p-4 text-center">No recent activity.</div>;
    }

    return (
        <div className="space-y-4">
            {activity.map((item, i) => {
                const isPayment = item.type === "PAYMENT";
                return (
                    <div key={i} className="flex gap-4 items-start group relative">
                        {/* Timeline line */}
                        {i !== activity.length - 1 && (
                            <div className="absolute left-[19px] top-10 bottom-[-16px] w-[2px] bg-zinc-100 dark:bg-zinc-800" />
                        )}

                        <div className="shrink-0 mt-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-sm ${isPayment ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                }`}>
                                {isPayment ? <ArrowDownLeftIcon className="w-5 h-5" /> : <ArrowUpRightIcon className="w-5 h-5" />}
                            </div>
                        </div>

                        <div className="flex-1 bg-white dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium">
                                        {isPayment ? (
                                            <span>Payment received from <span className="font-semibold">{item.data.loan?.customer?.name || "Customer"}</span></span>
                                        ) : (
                                            <span>New loan issued to <span className="font-semibold">{item.data.customer?.name || "Customer"}</span></span>
                                        )}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold ${isPayment ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                        {isPayment ? '+' : ''}{formatCurrency(parseFloat(isPayment ? item.data.amount : item.data.principalAmount))}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2 flex justify-between items-center">
                                <span>{isPayment ? item.data.note || 'No notes' : `Rate: ${(parseFloat(item.data.interestRate) * 100).toFixed(1)}%`}</span>
                                <Link href={`/loans/${isPayment ? item.data.loanId : item.data.id}`} className="text-primary hover:underline">
                                    View Loan
                                </Link>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
