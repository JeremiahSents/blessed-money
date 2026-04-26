"use client";

import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    PencilEdit01Icon,
    ArrowLeft01Icon,
    TelephoneIcon,
    Coins01Icon,
    Task01Icon,
    InformationCircleIcon,
    Calendar04Icon,
    Download01Icon,
    PlusSignIcon
} from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerForm } from "@/components/customers/customer-form";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, cn, getAvatarColor, getInitials } from "@/lib/utils";
import type { BillingCycle, Customer, LoanSummary } from "@/lib/types";

import { useState, use } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function CustomerDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data, isLoading } = useQuery<{ data: Customer }>({
        queryKey: ['customer', params.id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${params.id}`);
            if (!res.ok) throw new Error("Failed to fetch customer");
            return res.json();
        }
    });

    const generateStatement = () => {
        if (!data?.data) return;
        const doc = new jsPDF();
        const customer = data.data;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Customer Statement", 14, 22);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${customer.name}`, 14, 32);
        doc.text(`Phone: ${customer.phone || 'N/A'}`, 14, 38);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 44);

        const loansData = (customer.loans || []).map((loan: LoanSummary) => [
            loan.id.slice(0, 8),
            formatCurrency(parseFloat(loan.principalAmount)),
            `${(parseFloat(loan.interestRate) * 100).toFixed(1)}%`,
            new Date(loan.startDate).toLocaleDateString(),
            loan.status,
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Loan ID', 'Principal', 'Rate', 'Started', 'Status']],
            body: loansData,
            theme: 'grid',
        });

        doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}.pdf`);
    };

    if (isLoading) {
        return <DetailPageSkeleton />;
    }

    const customer = data?.data;
    if (!customer) return <div className="p-12 text-center">Customer not found.</div>;

    const loans = customer.loans || [];
    const avatarColor = getAvatarColor(customer.name);
    const totalPaid = loans.reduce((acc: number, l: LoanSummary) => acc + (l.billingCycles || []).reduce((lAcc: number, c: BillingCycle) => lAcc + parseFloat(c.totalPaid), 0), 0);
    const totalLent = parseFloat(customer.totalLent || "0");
    const balance = parseFloat(customer.outstandingBalance || "0");


    const customerFormDefaults = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? undefined,
        notes: customer.notes ?? undefined,
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-24 px-4 sm:px-6">
            <div className="pt-8 sm:pt-10">
                <Link
                    href="/customers"
                    className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors mb-8"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3.5 h-3.5 mr-2" />
                    Back to Customers
                </Link>

                <section className="relative overflow-hidden rounded-[36px] border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm shadow-zinc-100/60 dark:shadow-none">
                    <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10 p-6 sm:p-8 xl:p-10 space-y-8">
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
                                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl">
                                    <AvatarFallback className={cn("rounded-2xl text-lg sm:text-xl font-semibold uppercase tracking-tight", avatarColor)}>
                                        {getInitials(customer.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 pt-0.5 sm:pt-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-none text-zinc-900 dark:text-white capitalize">
                                            {customer.name}
                                        </h1>
                                        <Badge className={cn(
                                            "h-6 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-wider border-none shadow-none",
                                            customer.isActive ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                        )}>
                                            {customer.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium text-zinc-500 mt-2">
                                        Customer since {formatDate(customer.createdAt!)}
                                        <span className="mx-2 text-zinc-300 dark:text-zinc-700">•</span>
                                        {loans.length} loan{loans.length === 1 ? "" : "s"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid w-full sm:w-auto grid-cols-1 sm:grid-cols-2 gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-11 rounded-2xl px-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                                    onClick={() => setIsEditOpen(true)}
                                >
                                    <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-11 rounded-2xl px-4 bg-primary text-white hover:bg-primary/90 font-semibold border-none shadow-none"
                                    onClick={() => window.location.href = `/loans/new?customer=${customer.id}`}
                                >
                                    <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                                    New Loan
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Total Lent</p>
                                <p className="text-2xl sm:text-[28px] font-semibold text-zinc-900 dark:text-white tabular-nums mt-2">{formatCurrency(totalLent)}</p>
                            </div>
                            <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Total Repaid</p>
                                <p className="text-2xl sm:text-[28px] font-semibold text-primary tabular-nums mt-2">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Outstanding</p>
                                <p className="text-2xl sm:text-[28px] font-semibold text-zinc-900 dark:text-white tabular-nums mt-2">{formatCurrency(balance)}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[32px] border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm shadow-zinc-100/60 dark:shadow-none">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={TelephoneIcon} className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Phone Number</p>
                            <p className="text-sm text-zinc-500">Primary contact for payment follow-up</p>
                        </div>
                    </div>
                    <p className="text-base font-semibold text-zinc-900 dark:text-white tabular-nums">
                        {customer.phone || "No phone provided"}
                    </p>
                </div>

                {customer.notes ? (
                    <div className="rounded-[32px] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-6 shadow-sm shadow-zinc-100/60 dark:shadow-none">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0">
                                <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Internal Notes</p>
                                <p className="text-sm text-zinc-500">Private context for your team</p>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 italic">
                            &quot;{customer.notes}&quot;
                        </p>
                    </div>
                ) : (
                    <div className="rounded-[32px] border border-dashed border-zinc-200 dark:border-zinc-800 bg-transparent p-6 flex items-center justify-center text-center text-sm text-zinc-400">
                        No internal notes recorded.
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <section className="space-y-5">
                    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3 text-zinc-900 dark:text-white">
                            <HugeiconsIcon icon={Task01Icon} className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Loan Portfolio</h2>
                        </div>
                        <Badge variant="outline" className="h-6 rounded-full px-2.5 border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-wider">
                            {loans.length} total loans
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {loans.length > 0 ? (
                            loans.map((loan: LoanSummary) => {
                                const lTotalDue = (loan.billingCycles || []).reduce((acc: number, c: BillingCycle) => acc + parseFloat(c.totalDue), 0);
                                const lTotalPaid = (loan.billingCycles || []).reduce((acc: number, c: BillingCycle) => acc + parseFloat(c.totalPaid), 0);
                                const repaymentRate = lTotalDue > 0 ? (lTotalPaid / lTotalDue) * 100 : 0;
                                const outstandingLoan = Math.max(0, lTotalDue - lTotalPaid);
                                const isSettled = loan.status === "settled";
                                const isOverdue = loan.status === "overdue";
                                const accentClass = isSettled
                                    ? "bg-emerald-500"
                                    : isOverdue
                                        ? "bg-rose-500"
                                        : "bg-primary";

                                return (
                                    <Link
                                        key={loan.id}
                                        href={`/loans/${loan.id}`}
                                        className={cn(
                                            "group relative block overflow-hidden rounded-[40px] border transition-all active:scale-[0.99]",
                                            isSettled
                                                ? "bg-emerald-50/30 border-emerald-100/60 dark:bg-emerald-500/5 dark:border-emerald-500/10 hover:border-emerald-200"
                                                : isOverdue
                                                    ? "bg-rose-50/30 border-rose-100/60 dark:bg-rose-500/5 dark:border-rose-500/10 hover:border-rose-200"
                                                    : "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                                        )}
                                    >
                                        <div className={cn("absolute inset-y-0 left-0 w-1.5", accentClass)} />
                                        <div className="p-5 sm:p-6 pl-6 sm:pl-7 space-y-5">
                                            <div className="flex items-start justify-between gap-5">
                                                <div className="min-w-0 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge className={cn(
                                                            "h-5 rounded-full px-2 text-[9px] font-semibold uppercase border-none shadow-none",
                                                            isSettled ? "bg-emerald-500 text-white" :
                                                                isOverdue ? "bg-rose-500 text-white" :
                                                                    "bg-zinc-900 text-white dark:bg-white dark:text-black"
                                                        )}>
                                                            {loan.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-[11px] font-semibold uppercase">
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 whitespace-nowrap",
                                                            isSettled ? "text-emerald-600/70" : isOverdue ? "text-rose-600/70" : "text-zinc-500"
                                                        )}>
                                                            <HugeiconsIcon icon={Calendar04Icon} className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate">{formatDate(loan.startDate)}</span>
                                                        </div>
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 whitespace-nowrap",
                                                            isSettled ? "text-emerald-700 dark:text-emerald-400" : isOverdue ? "text-rose-700 dark:text-rose-400" : "text-zinc-900 dark:text-white"
                                                        )}>
                                                            <HugeiconsIcon icon={Coins01Icon} className="w-3.5 h-3.5 shrink-0 opacity-60" />
                                                            <span className="truncate">{formatCurrency(parseFloat(loan.principalAmount))}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="text-right min-w-[76px]">
                                                        <p className={cn(
                                                            "text-lg font-semibold tabular-nums leading-none mb-1.5",
                                                            repaymentRate >= 100 ? "text-emerald-500" :
                                                                repaymentRate > 0 ? "text-primary" : "text-zinc-400"
                                                        )}>
                                                            {repaymentRate.toFixed(0)}%
                                                        </p>
                                                        <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-tight">Paid</p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                                        isSettled ? "bg-emerald-100/70 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white" :
                                                            isOverdue ? "bg-rose-100/70 text-rose-600 group-hover:bg-rose-500 group-hover:text-white" :
                                                                "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 group-hover:bg-primary group-hover:text-white"
                                                    )}>
                                                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 rotate-180" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="rounded-[28px] border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Principal</p>
                                                    <p className="text-base font-semibold text-zinc-900 dark:text-white tabular-nums mt-2">
                                                        {formatCurrency(parseFloat(loan.principalAmount))}
                                                    </p>
                                                </div>
                                                <div className="rounded-[28px] border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                                                        Outstanding
                                                    </p>
                                                    <p className={cn(
                                                        "text-base font-semibold tabular-nums mt-2",
                                                        outstandingLoan === 0 ? "text-emerald-500" : "text-zinc-900 dark:text-white"
                                                    )}>
                                                        {formatCurrency(outstandingLoan)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-1">
                                                <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                                                    <span>Repayment progress</span>
                                                    <span>{repaymentRate.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-500", accentClass)}
                                                        style={{ width: `${Math.min(100, repaymentRate)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-zinc-950/20 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800">
                                <HugeiconsIcon icon={Task01Icon} className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-4" />
                                <p className="text-sm font-semibold text-zinc-400 uppercase">No active or previous loans</p>
                                <Button
                                    variant="link"
                                    className="text-primary font-semibold mt-2"
                                    onClick={() => window.location.href = `/loans/new?customer=${customer.id}`}
                                >
                                    Issue first loan
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                <div className="pt-4 flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-zinc-600 font-semibold uppercase text-[10px] tracking-wide"
                        onClick={generateStatement}
                    >
                        <HugeiconsIcon icon={Download01Icon} className="w-3.5 h-3.5 mr-2" />
                        Download Full Statement
                    </Button>
                </div>
            </div>

            <CustomerForm
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                defaultValues={customerFormDefaults}
            />
        </div>
    );
}
