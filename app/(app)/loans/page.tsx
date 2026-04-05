"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    Wallet01Icon, 
    MoneyReceive01Icon, 
    PlusSignIcon,
    Calendar04Icon,
    Coins01Icon,
    UserMultipleIcon,
    ArrowRight01Icon
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentForm } from "@/components/loans/payment-form";
import { formatCurrency, formatDate, displayStatus, cn } from "@/lib/utils";
import Link from "next/link";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import type { LoanSummary, Customer, BillingCycle } from "@/lib/types";

type LoanWithCustomer = LoanSummary & {
    customer: Customer;
    billingCycles: BillingCycle[];
};

export default function LoansPage() {
    const [selectedLoan, setSelectedLoan] = useState<LoanWithCustomer | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const { data, isLoading } = useQuery<{ data: LoanWithCustomer[] }>({
        queryKey: ["loans", "all"],
        queryFn: async () => {
            const res = await fetch("/api/loans?limit=100");
            if (!res.ok) throw new Error("Failed to fetch loans");
            return res.json();
        },
    });

    if (isLoading) return <DetailPageSkeleton />;

    const loans = data?.data || [];
    const activeLoans = loans.filter(l => l.status !== "settled");
    const finishedLoans = loans.filter(l => l.status === "settled");

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-32 pt-8 px-4 sm:px-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-primary">
                            <HugeiconsIcon icon={Wallet01Icon} className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">Loan Portfolio</h1>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium ml-1">Track active cycles and manage settled records.</p>
                </div>
                <Link href="/loans/new">
                    <Button className="h-11 px-6 rounded-2xl bg-primary text-white hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                        <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                        Issue New Loan
                    </Button>
                </Link>
            </div>

            {/* Active Portfolios Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Active & Overdue</h2>
                        <span className="flex h-5 items-center rounded-full bg-emerald-500/10 px-2 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider">
                            {activeLoans.length}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLoans.length > 0 ? (
                        activeLoans.map((loan) => (
                            <LoanListItem 
                                key={loan.id} 
                                loan={loan} 
                                onQuickPay={() => {
                                    setSelectedLoan(loan);
                                    setIsPaymentOpen(true);
                                }} 
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800">
                            <HugeiconsIcon icon={Wallet01Icon} className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mb-2" />
                            <p className="text-sm font-semibold text-zinc-400 uppercase tracking-tighter">No active loans found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Settled History Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-semibold text-zinc-400 dark:text-zinc-600">Settled History</h2>
                    <span className="flex h-5 items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {finishedLoans.length}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {finishedLoans.length > 0 ? (
                        finishedLoans.map((loan) => (
                            <LoanListItem key={loan.id} loan={loan} />
                        ))
                    ) : (
                        <div className="col-span-full py-8 text-center text-sm font-semibold text-zinc-400 uppercase tracking-tight italic opacity-40">
                            No settled records found
                        </div>
                    )}
                </div>
            </div>

            {selectedLoan && (
                <PaymentForm
                    loanId={selectedLoan.id}
                    open={isPaymentOpen}
                    onOpenChange={setIsPaymentOpen}
                    balance={selectedLoan.billingCycles?.[0] ? parseFloat(selectedLoan.billingCycles[0].balance) : 0}
                />
            )}
        </div>
    );
}

function LoanListItem({ loan, onQuickPay }: { loan: LoanWithCustomer, onQuickPay?: () => void }) {
    const isSettled = loan.status === "settled";
    const isOverdue = loan.status === "overdue";

    return (
        <div className={cn(
            "group relative p-6 rounded-[32px] border transition-all duration-300",
            isSettled 
                ? "bg-zinc-50/30 dark:bg-zinc-900/5 border-zinc-100 dark:border-zinc-800 opacity-70" 
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.99]"
        )}>
            {/* Top Bar: Customer & Status */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                        isSettled ? "dark:bg-zinc-800 text-zinc-400" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                    )}>
                        <HugeiconsIcon icon={UserMultipleIcon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <Link 
                            href={`/customers/${loan.customerId}`} 
                            title={loan.customer?.name}
                            className="text-base font-semibold text-zinc-900 dark:text-zinc-50 block hover:text-primary transition-colors truncate"
                        >
                            {loan.customer?.name}
                        </Link>
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">#{loan.id.slice(0, 8)}</span>
                    </div>
                </div>
                <Badge className={cn(
                    "px-2 py-0.5 text-[9px] font-bold border-none shadow-none uppercase tracking-wider shrink-0",
                    loan.status === 'active' ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                    isOverdue ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" :
                    "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                )}>
                    {displayStatus(loan.status)}
                </Badge>
            </div>

            {/* Mid: Stats */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-tight">
                        <HugeiconsIcon icon={Coins01Icon} className="w-3.5 h-3.5 opacity-60" />
                        Principal
                    </div>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white tabular-nums tracking-tight">
                        {formatCurrency(parseFloat(loan.principalAmount))}
                    </p>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-tight">
                        <HugeiconsIcon icon={Calendar04Icon} className="w-3.5 h-3.5 opacity-60" />
                        Issued
                    </div>
                    <p className="text-lg font-semibold text-zinc-500 tabular-nums tracking-tight">
                        {formatDate(loan.startDate)}
                    </p>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-5 border-t border-zinc-100 dark:border-zinc-800/50">
                <Link href={`/loans/${loan.id}`} className="flex-1">
                    <Button variant="outline" className="w-full h-11 rounded-xl text-xs font-semibold uppercase border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                        Terms & History
                    </Button>
                </Link>
                {onQuickPay && !isSettled && (
                    <Button 
                        onClick={onQuickPay}
                        className="flex-1 h-11 rounded-xl bg-primary text-white text-xs font-semibold uppercase shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
                    >
                        <HugeiconsIcon icon={MoneyReceive01Icon} className="w-4 h-4 mr-2" />
                        Quick Pay
                    </Button>
                )}
                {isSettled && (
                    <div className="flex-1 flex items-center justify-center h-11 text-[10px] font-bold text-zinc-400 uppercase border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        Fully Settled
                    </div>
                )}
            </div>
            
            {/* Subtle Hover Indicator */}
            {!isSettled && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-primary" />
                </div>
            )}
        </div>
    );
}
