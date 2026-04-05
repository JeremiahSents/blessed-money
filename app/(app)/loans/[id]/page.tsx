"use client";

import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    ArrowLeft01Icon,
    Alert02Icon,
    Coins01Icon,
    PercentCircleIcon,
    Calendar04Icon,
    MoneyReceive01Icon,
    Note01Icon,
    Shield01Icon,
    Task01Icon
} from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { CollateralList } from "@/components/collateral/collateral-list";
import { BillingCycleTable } from "@/components/loans/billing-cycle-table";
import { PaymentForm } from "@/components/loans/payment-form";
import { formatCurrency, formatDate, displayStatus, cn } from "@/lib/utils";
import type { LoanDetail } from "@/lib/types";
import { useState, use } from "react";
import Link from "next/link";

export default function LoanDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const { data, isLoading } = useQuery<{ data: LoanDetail }>({
        queryKey: ['loan', params.id],
        queryFn: async () => {
            const res = await fetch(`/api/loans/${params.id}`);
            if (!res.ok) throw new Error("Failed to fetch loan");
            return res.json();
        }
    });

    if (isLoading) {
        return <DetailPageSkeleton />;
    }

    const loan = data?.data;
    if (!loan) return <div className="p-12 text-center">Loan not found.</div>;

    const isActive = loan.status === 'active';
    const isOverdue = loan.status === 'overdue';

    const unpaidCycles = loan.billingCycles.filter((c) => c.status !== 'closed');
    const nextPaymentDue = unpaidCycles[0];

    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-32 md:pb-12 px-4 sm:px-6">
            {/* Header Section */}
            <div className="pt-8">
                <Link
                    href={`/customers/${loan.customer.id}`}
                    className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors mb-8"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3.5 h-3.5 mr-2" />
                    Back to Customer
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-semibold shrink-0 uppercase">
                            {loan.customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                                    Loan for <Link href={`/customers/${loan.customer.id}`} className="hover:text-primary transition-colors underline decoration-zinc-200 dark:decoration-zinc-800 underline-offset-4 decoration-2 hover:decoration-primary">{loan.customer.name}</Link>
                                </h1>
                                <Badge className={cn(
                                    "px-2 py-0.5 text-[10px] font-semibold border-none shadow-none uppercase",
                                    isActive ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                        isOverdue ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400" :
                                            "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                )}>
                                    {displayStatus(loan.status)}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <HugeiconsIcon icon={Calendar04Icon} className="w-3.5 h-3.5" />
                                    Started {formatDate(loan.startDate)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {loan.status !== 'settled' && (
                        <Button
                            onClick={() => setIsPaymentOpen(true)}
                            className="h-11 px-5 rounded-xl bg-primary text-white hover:bg-primary/90 font-semibold"
                        >
                            <HugeiconsIcon icon={MoneyReceive01Icon} className="w-4 h-4 mr-2" />
                            Collect Payment
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Stats & Health */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-400 mb-4">
                            <HugeiconsIcon icon={Coins01Icon} className="w-4 h-4" />
                            <p className="text-[10px] font-semibold uppercase">Loan Amount</p>
                        </div>
                        <p className="text-2xl font-semibold text-zinc-900 dark:text-white tabular-nums">
                            {formatCurrency(parseFloat(loan.principalAmount))}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-400 mb-4">
                            <HugeiconsIcon icon={PercentCircleIcon} className="w-4 h-4" />
                            <p className="text-[10px] font-semibold uppercase">Interest Rate</p>
                        </div>
                        <p className="text-2xl font-semibold text-zinc-900 dark:text-white tabular-nums">
                            {(parseFloat(loan.interestRate) * 100).toFixed(1)}% <span className="text-xs font-medium text-zinc-500">/ month</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-start gap-4">
                        <HugeiconsIcon icon={Alert02Icon} className={cn("w-5 h-5 shrink-0 mt-0.5", isOverdue ? "text-red-500" : "text-emerald-500")} />
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-semibold uppercase text-zinc-400">Next Payment</p>
                                {isOverdue && <Badge variant="destructive" className="bg-red-500 text-[8px] font-semibold uppercase h-4 border-none">Overdue</Badge>}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-0">
                                    {nextPaymentDue ? formatCurrency(parseFloat(nextPaymentDue.balance)) : "Fully Settled"}
                                </h3>
                                {nextPaymentDue && (
                                    <span className="text-xs font-medium text-zinc-400">
                                        Due {formatDate(nextPaymentDue.cycleEndDate)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stacked Sections */}
            <div className="space-y-16">
                {/* 1. Payment Schedule */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3 text-zinc-900 dark:text-white">
                            <HugeiconsIcon icon={MoneyReceive01Icon} className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Payment Schedule</h2>
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                            {loan.billingCycles.length} Total Rounds
                        </span>
                    </div>
                    <BillingCycleTable cycles={loan.billingCycles} />
                </section>

                {/* 2. Borrowing History & Trends */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-3">
                            <HugeiconsIcon icon={Task01Icon} className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Borrowing History</h2>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {loan.customer?.loans?.filter(l => l.id !== loan.id).length ? (
                            loan.customer.loans
                                .filter(l => l.id !== loan.id)
                                .map(prevLoan => {
                                    const totalDue = (prevLoan.billingCycles || []).reduce((acc, c) => acc + parseFloat(c.totalDue), 0);
                                    const totalPaid = (prevLoan.billingCycles || []).reduce((acc, c) => acc + parseFloat(c.totalPaid), 0);
                                    const repaymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
                                    const isSettled = prevLoan.status === 'settled';

                                    return (
                                        <Link 
                                            key={prevLoan.id}
                                            href={`/loans/${prevLoan.id}`}
                                            className="group block p-[22px] rounded-[28px] border border-zinc-100 dark:border-zinc-800 hover:border-primary/20 transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 active:scale-[0.99]"
                                        >
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex flex-col gap-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-tight">#{prevLoan.id.slice(0, 8)}</span>
                                                        <Badge className={cn(
                                                            "text-[9px] px-2 py-0.5 h-4 font-semibold uppercase border-none shadow-none",
                                                            isSettled ? "bg-emerald-500 text-white" : 
                                                            prevLoan.status === 'overdue' ? "bg-red-500 text-white" : 
                                                            "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                                        )}>
                                                            {prevLoan.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-[11px] font-semibold text-zinc-500 uppercase">
                                                        <div className="flex items-center gap-1.5">
                                                            <HugeiconsIcon icon={Calendar04Icon} className="w-3.5 h-3.5 opacity-60" />
                                                            {formatDate(prevLoan.startDate)}
                                                        </div>
                                                        <span className="text-zinc-200 dark:text-zinc-800">•</span>
                                                        <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                                                            <HugeiconsIcon icon={Coins01Icon} className="w-3.5 h-3.5 opacity-60" />
                                                            {formatCurrency(parseFloat(prevLoan.principalAmount))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right min-w-[80px]">
                                                        <p className={cn(
                                                            "text-lg font-semibold tabular-nums leading-none mb-1.5",
                                                            repaymentRate >= 100 ? "text-emerald-500" : 
                                                            repaymentRate > 0 ? "text-primary" : "text-zinc-400"
                                                        )}>
                                                            {repaymentRate.toFixed(0)}%
                                                        </p>
                                                        <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-tight">Repaid</p>
                                                    </div>
                                                    <div className="hidden sm:block w-32 h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-50 dark:border-zinc-800">
                                                        <div 
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-700 ease-out",
                                                                repaymentRate >= 100 ? "bg-emerald-500" : 
                                                                repaymentRate > 50 ? "bg-primary" : 
                                                                repaymentRate > 0 ? "bg-primary/60" : "bg-transparent"
                                                            )}
                                                            style={{ width: `${Math.min(100, repaymentRate)}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-zinc-300">
                                                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 rotate-180" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-50/50 dark:bg-zinc-950/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                <HugeiconsIcon icon={Task01Icon} className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mb-3" />
                                <p className="text-xs font-semibold text-zinc-400 uppercase">No borrowing records found for this customer.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. Administrative Notes */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-zinc-900 dark:text-white">
                        <HugeiconsIcon icon={Note01Icon} className="w-5 h-5" />
                        <h2 className="text-xl font-semibold">Administrative Notes</h2>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        {loan.notes || "No additional administrative notes have been recorded for this loan."}
                    </div>
                </section>

                {/* 4. Security Items */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-zinc-900 dark:text-white">
                        <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5" />
                        <h2 className="text-xl font-semibold">Security Items</h2>
                    </div>
                    <CollateralList loanId={loan.id} items={loan.collateral} />
                </section>
            </div>

            <PaymentForm
                loanId={loan.id}
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                balance={nextPaymentDue ? parseFloat(nextPaymentDue.balance) : 0}
            />

            {/* Mobile sticky payment bar */}
            {loan.status !== 'settled' && (
                <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-4 pt-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                        className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/20"
                        onClick={() => setIsPaymentOpen(true)}
                    >
                        Collect Payment
                    </Button>
                </div>
            )}
        </div>
    );
}
