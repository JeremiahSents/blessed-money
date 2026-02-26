"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, ArrowLeft01Icon, Alert02Icon, PropertyEditIcon } from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CollateralList } from "@/components/collateral/collateral-list";
import { BillingCycleTable } from "@/components/loans/billing-cycle-table";
import { PaymentForm } from "@/components/loans/payment-form";
import { formatCurrency, formatDate } from "@/lib/utils";
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
        return <div className="flex justify-center p-12"><HugeiconsIcon icon={Loading02Icon} className="w-8 h-8 animate-spin text-zinc-400" /></div>;
    }

    const loan = data?.data;
    if (!loan) return <div className="p-12 text-center">Loan not found.</div>;

    const isActive = loan.status === 'active';
    const isOverdue = loan.status === 'overdue';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div>
                <Link href={`/customers/${loan.customer.id}`} className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white flex items-center mb-4 transition-colors">
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 mr-1" /> Back to Customer
                </Link>
                <PageHeader
                    title={`Loan for ${loan.customer.name}`}
                    description={`Loan #${loan.id.slice(0, 8)} • Started ${formatDate(loan.startDate)}`}
                    action={
                        <div className="flex gap-2 items-center">
                            <Badge className="text-sm px-4 py-1" variant={isActive ? "default" : isOverdue ? "destructive" : "secondary"}>
                                {loan.status}
                            </Badge>
                            {loan.status !== 'settled' && (
                                <Button onClick={() => setIsPaymentOpen(true)}>Record Payment</Button>
                            )}
                        </div>
                    }
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <p className="text-sm text-zinc-500">Principal Amount</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(parseFloat(loan.principalAmount))}</p>
                </div>
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <p className="text-sm text-zinc-500">Interest Rate</p>
                    <p className="text-2xl font-bold tracking-tight">{(parseFloat(loan.interestRate) * 100).toFixed(1)}% / mo</p>
                </div>
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1 md:col-span-2 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center shrink-0">
                        <HugeiconsIcon icon={Alert02Icon} className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500">Outstanding Cycles</p>
                        <p className="text-sm font-medium">
                            {loan.billingCycles.filter((c) => c.status !== 'closed').length} active cycle(s) requiring payment.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-zinc-500" />
                            <h2 className="text-xl font-semibold">Billing Cycles</h2>
                        </div>
                        <BillingCycleTable cycles={loan.billingCycles} />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={PropertyEditIcon} className="w-5 h-5 text-zinc-500" />
                            <h2 className="text-xl font-semibold">Internal Notes</h2>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            {loan.notes || "No notes recorded for this loan."}
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <CollateralList loanId={loan.id} items={loan.collateral} />
                    </div>
                </div>
            </div>

            <PaymentForm
                loanId={loan.id}
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
            />
        </div>
    );
}
