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
    PlusSignIcon
} from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { BillingCycle, Customer, LoanSummary } from "@/lib/types";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data, isLoading } = useQuery<{ data: Customer }>({
        queryKey: ['customer', params.id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${params.id}`);
            if (!res.ok) throw new Error("Failed to fetch customer");
            return res.json();
        }
    });

    if (isLoading) {
        return <DetailPageSkeleton />;
    }

    const customer = data?.data;
    if (!customer) return <div className="p-12 text-center">Customer not found.</div>;

    const loans = customer.loans || [];
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
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3.5 h-3.5 mr-2" />
                    Back to Customers
                </Link>

                <section className="relative overflow-hidden rounded-[36px] border border-border bg-card shadow-sm dark:shadow-none">
                    <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-success/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10 p-6 sm:p-8 xl:p-10 space-y-8">
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
                                <PersonAvatar seed={customer.id} name={customer.name} className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />
                                <div className="min-w-0 pt-0.5 sm:pt-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-none text-foreground capitalize">
                                            {customer.name}
                                        </h1>
                                        <Badge className={cn(
                                            "h-6 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-wider border-none shadow-none",
                                            customer.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                                        )}>
                                            {customer.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-2">
                                        Customer since {formatDate(customer.createdAt!)}
                                        <span className="mx-2 text-muted-foreground">•</span>
                                        {loans.length} loan{loans.length === 1 ? "" : "s"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid w-full sm:w-auto grid-cols-1 sm:grid-cols-2 gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-11 rounded-2xl px-4 bg-muted border border-border font-semibold text-muted-foreground hover:text-foreground dark:hover:text-primary-foreground transition-all"
                                    onClick={() => setIsEditOpen(true)}
                                >
                                    <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-11 rounded-2xl px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold border-none shadow-none"
                                    onClick={() => router.push(`/loans/new?customer=${customer.id}`)}
                                >
                                    <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                                    New Loan
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-[28px] border border-border bg-muted p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total Lent</p>
                                <p className="text-2xl sm:text-[28px] font-semibold text-foreground tabular-nums mt-2">{formatCurrency(totalLent)}</p>
                            </div>
                            <div className="rounded-[28px] border border-border bg-card p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total Repaid</p>
                                <p className="text-2xl sm:text-[28px] font-semibold text-primary tabular-nums mt-2">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div className="rounded-[28px] border border-border bg-muted p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Outstanding</p>
                                <p className="text-2xl sm:text-[28px] font-semibold text-foreground tabular-nums mt-2">{formatCurrency(balance)}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={TelephoneIcon} className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Phone Number</p>
                            <p className="text-sm text-muted-foreground">Primary contact for payment follow-up</p>
                        </div>
                    </div>
                    <p className="text-base font-semibold text-foreground tabular-nums">
                        {customer.phone || "No phone provided"}
                    </p>
                </div>

                {customer.notes ? (
                    <div className="rounded-[32px] border border-border bg-muted p-6 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Internal Notes</p>
                                <p className="text-sm text-muted-foreground">Private context for your team</p>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground italic">
                            &quot;{customer.notes}&quot;
                        </p>
                    </div>
                ) : (
                    <div className="rounded-[32px] border border-dashed border-border bg-transparent p-6 flex items-center justify-center text-center text-sm text-muted-foreground">
                        No internal notes recorded.
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <section className="space-y-5">
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                        <div className="flex items-center gap-3 text-foreground">
                            <HugeiconsIcon icon={Task01Icon} className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Loan Portfolio</h2>
                        </div>
                        <Badge variant="outline" className="h-6 rounded-full px-2.5 border-border text-[10px] font-semibold uppercase tracking-wider">
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
                                    ? "bg-success"
                                    : isOverdue
                                        ? "bg-destructive"
                                        : "bg-primary";

                                return (
                                    <Link
                                        key={loan.id}
                                        href={`/loans/${loan.id}`}
                                        className={cn(
                                            "group relative block overflow-hidden rounded-[40px] border transition-all active:scale-[0.99]",
                                            isSettled
                                                ? "bg-success/15 border-success/30 hover:border-success/30"
                                                : isOverdue
                                                    ? "bg-destructive/10 border-destructive/30 hover:border-destructive/30"
                                                    : "bg-card border-border hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                                        )}
                                    >
                                        <div className={cn("absolute inset-y-0 left-0 w-1.5", accentClass)} />
                                        <div className="p-5 sm:p-6 pl-6 sm:pl-7 space-y-5">
                                            <div className="flex items-start justify-between gap-5">
                                                <div className="min-w-0 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge className={cn(
                                                            "h-5 rounded-full px-2 text-[9px] font-semibold uppercase border-none shadow-none",
                                                            isSettled ? "bg-success text-primary-foreground" :
                                                                isOverdue ? "bg-destructive text-primary-foreground" :
                                                                    "bg-muted text-muted-foreground"
                                                        )}>
                                                            {loan.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-[11px] font-semibold uppercase">
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 whitespace-nowrap",
                                                            isSettled ? "text-success/70" : isOverdue ? "text-destructive/70" : "text-muted-foreground"
                                                        )}>
                                                            <HugeiconsIcon icon={Calendar04Icon} className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate">{formatDate(loan.startDate)}</span>
                                                        </div>
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 whitespace-nowrap",
                                                            isSettled ? "text-success" : isOverdue ? "text-destructive" : "text-foreground"
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
                                                            repaymentRate >= 100 ? "text-success" :
                                                                repaymentRate > 0 ? "text-primary" : "text-muted-foreground"
                                                        )}>
                                                            {repaymentRate.toFixed(0)}%
                                                        </p>
                                                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-tight">Paid</p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                                        isSettled ? "bg-success/15 text-success group-hover:bg-success group-hover:text-primary-foreground" :
                                                            isOverdue ? "bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-primary-foreground" :
                                                                "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                                                    )}>
                                                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 rotate-180" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="rounded-[28px] border border-border bg-muted p-4">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Principal</p>
                                                    <p className="text-base font-semibold text-foreground tabular-nums mt-2">
                                                        {formatCurrency(parseFloat(loan.principalAmount))}
                                                    </p>
                                                </div>
                                                <div className="rounded-[28px] border border-border bg-muted p-4">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                        Outstanding
                                                    </p>
                                                    <p className={cn(
                                                        "text-base font-semibold tabular-nums mt-2",
                                                        outstandingLoan === 0 ? "text-success" : "text-foreground"
                                                    )}>
                                                        {formatCurrency(outstandingLoan)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-1">
                                                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                                    <span>Repayment progress</span>
                                                    <span>{repaymentRate.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
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
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-muted rounded-[40px] border border-dashed border-border">
                                <HugeiconsIcon icon={Task01Icon} className="w-12 h-12 text-primary-foreground mb-4" />
                                <p className="text-sm font-semibold text-muted-foreground uppercase">No active or previous loans</p>
                                <Button
                                    variant="link"
                                    className="text-primary font-semibold mt-2"
                                    onClick={() => router.push(`/loans/new?customer=${customer.id}`)}
                                >
                                    Issue first loan
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

            </div>

            <CustomerForm
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                defaultValues={customerFormDefaults}
            />
        </div>
    );
}
