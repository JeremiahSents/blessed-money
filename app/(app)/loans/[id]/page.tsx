"use client";

import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    ArrowLeft01Icon,
    Alert02Icon,
    Calendar04Icon,
    MoneyReceive01Icon,
    Note01Icon,
    Shield01Icon,
    Activity03Icon,
    Wallet01Icon,
    TickDouble02Icon
} from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { CollateralList } from "@/components/collateral/collateral-list";
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
    const isSettled = loan.status === 'settled';

    const unpaidCycles = loan.billingCycles.filter((c) => c.status !== 'closed');
    const nextPaymentDue = unpaidCycles[0];

    const totalDue = loan.billingCycles.reduce((acc, c) => acc + parseFloat(c.totalDue), 0);
    const totalPaid = loan.billingCycles.reduce((acc, c) => acc + parseFloat(c.totalPaid), 0);
    const outstanding = Math.max(0, totalDue - totalPaid);
    const repaymentRate = totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 0;

    const daysUntilDue = nextPaymentDue
        ? Math.ceil((new Date(nextPaymentDue.cycleEndDate).getTime() - Date.now()) / 86400000)
        : null;

    const recentPayments = (loan.payments || []).slice(0, 6);

    return (
        <div className="max-w-3xl mx-auto space-y-10 pb-32 md:pb-12 px-4 sm:px-6">
            {/* Back link */}
            <div className="pt-6">
                <Link
                    href={`/customers/${loan.customer.id}`}
                    className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3.5 h-3.5 mr-2" />
                    Back to {loan.customer.name.split(" ")[0]}
                </Link>
            </div>

            {/* Hero card */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 p-6 sm:p-8 shadow-sm">
                <div className="absolute -top-32 -right-24 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-32 -left-24 w-80 h-80 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-semibold shrink-0 uppercase shadow-lg shadow-primary/20">
                            {loan.customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={`/customers/${loan.customer.id}`}
                                    className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white truncate hover:text-primary transition-colors"
                                >
                                    {loan.customer.name}
                                </Link>
                                <Badge className={cn(
                                    "px-2 py-0.5 text-[10px] font-semibold border-none shadow-none uppercase tracking-wider",
                                    isActive ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                        isOverdue ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400" :
                                            "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                )}>
                                    {displayStatus(loan.status)}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-zinc-500">
                                <HugeiconsIcon icon={Calendar04Icon} className="w-3.5 h-3.5" />
                                Started {formatDate(loan.startDate)}
                            </div>
                        </div>
                    </div>

                    {!isSettled && (
                        <Button
                            onClick={() => setIsPaymentOpen(true)}
                            className="hidden md:inline-flex h-11 px-5 rounded-xl bg-primary text-white hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20"
                        >
                            <HugeiconsIcon icon={MoneyReceive01Icon} className="w-4 h-4 mr-2" />
                            Collect Payment
                        </Button>
                    )}
                </div>

                {/* Hero numbers */}
                <div className="relative z-10 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:divide-x sm:divide-zinc-100 dark:sm:divide-zinc-800/70">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Principal</p>
                        <p className="text-3xl font-semibold text-zinc-900 dark:text-white tabular-nums mt-1">
                            {formatCurrency(parseFloat(loan.principalAmount))}
                        </p>
                    </div>
                    <div className="sm:pl-6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Outstanding</p>
                        <p className={cn(
                            "text-3xl font-semibold tabular-nums mt-1",
                            outstanding === 0 ? "text-emerald-500" : "text-zinc-900 dark:text-white"
                        )}>
                            {formatCurrency(outstanding)}
                        </p>
                    </div>
                    <div className="sm:pl-6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Interest</p>
                        <p className="text-3xl font-semibold text-zinc-900 dark:text-white tabular-nums mt-1">
                            {(parseFloat(loan.interestRate) * 100).toFixed(1)}<span className="text-xl text-zinc-400">%</span>
                            <span className="text-xs font-medium text-zinc-500 ml-1">/mo</span>
                        </p>
                    </div>
                </div>

                {/* Repayment progress */}
                <div className="relative z-10 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/70">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                            Repaid {formatCurrency(totalPaid)} <span className="text-zinc-400 font-medium">of {formatCurrency(totalDue)}</span>
                        </p>
                        <p className={cn(
                            "text-xs font-bold tabular-nums",
                            repaymentRate >= 100 ? "text-emerald-500" : "text-primary"
                        )}>
                            {repaymentRate.toFixed(0)}%
                        </p>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-700 ease-out",
                                repaymentRate >= 100 ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${repaymentRate}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Stacked Sections */}
            <div className="space-y-16">
                {/* Recent Activity: next payment + past payments */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-zinc-900 dark:text-white">
                        <HugeiconsIcon icon={Activity03Icon} className="w-5 h-5" />
                        <h2 className="text-xl font-semibold">Recent Activity</h2>
                    </div>

                    {/* Next payment */}
                    {nextPaymentDue && (
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-3">Next Payment</p>
                            <div className={cn(
                                "rounded-2xl border p-5 flex items-start gap-4 transition-all",
                                isOverdue
                                    ? "border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/10"
                                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80"
                            )}>
                                <div className={cn(
                                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
                                    isOverdue ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                                )}>
                                    <HugeiconsIcon icon={Alert02Icon} className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                            Due {formatDate(nextPaymentDue.cycleEndDate)}
                                        </p>
                                        {isOverdue && <Badge className="bg-red-500 text-white text-[9px] font-semibold uppercase h-4 px-1.5 border-none shadow-none">Overdue</Badge>}
                                    </div>
                                    {daysUntilDue !== null && (
                                        <p className={cn(
                                            "text-xs font-medium",
                                            daysUntilDue < 0 ? "text-red-500" : daysUntilDue <= 3 ? "text-amber-600" : "text-zinc-500"
                                        )}>
                                            {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : daysUntilDue === 0 ? "Due today" : `In ${daysUntilDue} days`}
                                        </p>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-lg font-semibold tabular-nums shrink-0",
                                    isOverdue ? "text-red-500" : "text-zinc-900 dark:text-white"
                                )}>
                                    {formatCurrency(parseFloat(nextPaymentDue.balance))}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Past payments */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Past Payments</p>
                            {recentPayments.length > 0 && (
                                <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                                    {(loan.payments || []).length} total
                                </span>
                            )}
                        </div>

                        {recentPayments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center bg-zinc-50/50 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
                                    <HugeiconsIcon icon={Wallet01Icon} className="w-5 h-5 text-zinc-400" />
                                </div>
                                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No payments yet</p>
                                <p className="text-xs text-zinc-400 mt-1">Collected payments will appear here.</p>
                            </div>
                        ) : (
                            <ol className="relative space-y-3 before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-100 dark:before:bg-zinc-800">
                                {recentPayments.map((p) => (
                                    <li key={p.id} className="relative flex items-start gap-4 pl-1">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-4 ring-white dark:ring-zinc-950">
                                            <HugeiconsIcon icon={TickDouble02Icon} className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex items-start justify-between gap-3 py-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                                    Payment received
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                    {formatDate(p.paidAt)}
                                                    {p.note && <span className="text-zinc-400"> · {p.note}</span>}
                                                </p>
                                            </div>
                                            <p className="text-sm font-semibold text-emerald-500 tabular-nums shrink-0">
                                                +{formatCurrency(parseFloat(p.amount))}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </section>

                {/* Administrative Notes */}
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
