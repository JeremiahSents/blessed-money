import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import type { BillingCycle, Customer, LoanSummary } from "@/lib/types";

type OverdueLoan = LoanSummary & {
    customer: Pick<Customer, "name">;
    billingCycles?: BillingCycle[];
};

export function OverduePanel({ overdueLoans = [] }: { overdueLoans: OverdueLoan[] }) {
    if (overdueLoans.length === 0) {
        return (
            <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-900/10">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                        <CheckMarkIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="font-medium text-emerald-800 dark:text-emerald-300">All caught up!</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">There are no overdue loans requiring your attention.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
            <CardHeader className="pb-3 border-b border-red-100 dark:border-red-900/50">
                <CardTitle className="text-red-800 dark:text-red-300 flex items-center text-base">
                    <HugeiconsIcon icon={Alert02Icon} className="w-5 h-5 mr-2" />
                    Immediate Attention Required
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                {overdueLoans.map((loan) => {
                    const overdueCycle = loan.billingCycles?.[0]; // API returns 1 cycle where status = overdue
                    const amountDue = overdueCycle ? parseFloat(overdueCycle.balance) : parseFloat(loan.principalAmount);

                    return (
                        <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-zinc-950 rounded-lg border border-red-100 dark:border-red-900/50 shadow-sm gap-3">
                            <div>
                                <p className="font-medium">{loan.customer.name}</p>
                                <p className="text-xs text-zinc-500">
                                    Loan #{loan.id.slice(0, 8)} • Started {formatDate(loan.startDate)}
                                </p>
                                {overdueCycle && (
                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                                        Cycle #{overdueCycle.cycleNumber} unpaid since {formatDate(overdueCycle.cycleEndDate)}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-4 sm:ml-auto">
                                <div className="text-right">
                                    <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(amountDue)}</p>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Due</p>
                                </div>
                                <Link href={`/loans/${loan.id}`}>
                                    <Button size="sm" variant="outline" className="border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900">
                                        Review
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function CheckMarkIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}
