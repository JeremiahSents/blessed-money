"use client";

import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    PencilEdit01Icon,
    ArrowLeft01Icon,
    TelephoneIcon,
    Calendar04Icon,
    TickDouble02Icon,
    PlusSignIcon,
    Alert02Icon,
    ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { formatCurrency, formatCompactCurrency, formatDate, cn } from "@/lib/utils";
import type { BillingCycle, Customer, LoanSummary, Payment } from "@/lib/types";

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

    const activeLoans = loans.filter((l) => l.status !== "settled");
    const settledLoans = loans.filter((l) => l.status === "settled");
    const hasOverdue = loans.some((l) => l.status === "overdue");

    // Most recent payment across all of this person's loans.
    const allPayments: Payment[] = loans.flatMap((l) => l.payments || []);
    const lastPayment = allPayments
        .slice()
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];

    // One-line read on where this relationship stands.
    const standing = hasOverdue
        ? { label: "Has overdue payments", tone: "bg-destructive/10 text-destructive", icon: Alert02Icon }
        : activeLoans.length > 0
            ? { label: "Paying on time", tone: "bg-success/10 text-success", icon: TickDouble02Icon }
            : { label: "All loans cleared", tone: "bg-success/10 text-success", icon: TickDouble02Icon };

    const customerFormDefaults = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? undefined,
        notes: customer.notes ?? undefined,
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 px-1">
            <div className="pt-2 md:pt-4">
                <Link
                    href="/customers"
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3.5 h-3.5 mr-2" />
                    Back to Customers
                </Link>

                {/* Identity + standing */}
                <div className="flex items-start gap-4">
                    <PersonAvatar seed={customer.id} name={customer.name} className="w-16 h-16 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground capitalize leading-none">
                                {customer.name}
                            </h1>
                            {!customer.isActive && (
                                <Badge className="h-5 rounded-full px-2 text-[10px] font-semibold uppercase tracking-wider border-none bg-muted text-muted-foreground">
                                    Inactive
                                </Badge>
                            )}
                        </div>
                        <span className={cn(
                            "inline-flex items-center gap-1.5 mt-2.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                            standing.tone,
                        )}>
                            <HugeiconsIcon icon={standing.icon} className="w-3.5 h-3.5" />
                            {standing.label}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mt-5">
                    <Button
                        variant="secondary"
                        className="h-11 rounded-2xl bg-muted border border-border font-semibold text-muted-foreground hover:text-foreground"
                        onClick={() => setIsEditOpen(true)}
                    >
                        <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        className="h-11 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                        onClick={() => router.push(`/loans/new?customer=${customer.id}`)}
                    >
                        <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                        New Loan
                    </Button>
                </div>

                {/* The money, as a flat divided row — not three cards */}
                <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card py-4">
                    <Stat label="Total lent" value={formatCompactCurrency(totalLent)} />
                    <Stat label="Repaid" value={formatCompactCurrency(totalPaid)} tone="text-primary" />
                    <Stat label="Outstanding" value={formatCompactCurrency(balance)} tone={balance > 0 ? "text-foreground" : "text-success"} />
                </div>
            </div>

            {/* Person-to-person facts — plain rows, no cards */}
            <div className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
                <Fact icon={TelephoneIcon} label="Phone">
                    {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="text-sm font-semibold text-primary tabular-nums hover:underline">
                            {customer.phone}
                        </a>
                    ) : (
                        <span className="text-sm text-muted-foreground">Not provided</span>
                    )}
                </Fact>
                <Fact icon={Calendar04Icon} label="Customer since">
                    <span className="text-sm font-medium text-foreground">{formatDate(customer.createdAt!)}</span>
                </Fact>
                <Fact icon={TickDouble02Icon} label="Last payment">
                    <span className="text-sm font-medium text-foreground">
                        {lastPayment ? `${formatCurrency(parseFloat(lastPayment.amount))} · ${formatDate(lastPayment.paidAt)}` : "None yet"}
                    </span>
                </Fact>
                <Fact icon={ArrowRight01Icon} label="Loans">
                    <span className="text-sm font-medium text-foreground">
                        {activeLoans.length} active · {settledLoans.length} settled
                    </span>
                </Fact>
            </div>

            {/* Internal notes — only if present */}
            {customer.notes && (
                <div>
                    <h2 className="text-sm font-semibold text-foreground mb-3 px-1">Internal notes</h2>
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-sm leading-relaxed text-muted-foreground">{customer.notes}</p>
                    </div>
                </div>
            )}

            {/* Loan portfolio — flat list rows */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-semibold text-foreground">Loans ({loans.length})</h2>
                </div>

                {loans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center bg-muted rounded-2xl border border-dashed border-border">
                        <p className="text-sm font-semibold text-muted-foreground">No loans yet</p>
                        <Button
                            variant="link"
                            className="text-primary font-semibold mt-1"
                            onClick={() => router.push(`/loans/new?customer=${customer.id}`)}
                        >
                            Give the first loan
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {loans.map((loan: LoanSummary) => {
                            const lTotalDue = (loan.billingCycles || []).reduce((acc, c) => acc + parseFloat(c.totalDue), 0);
                            const lTotalPaid = (loan.billingCycles || []).reduce((acc, c) => acc + parseFloat(c.totalPaid), 0);
                            const rate = lTotalDue > 0 ? Math.min(100, (lTotalPaid / lTotalDue) * 100) : 0;
                            const outstandingLoan = Math.max(0, lTotalDue - lTotalPaid);
                            const isSettled = loan.status === "settled";
                            const isOverdue = loan.status === "overdue";
                            const accent = isSettled ? "bg-success" : isOverdue ? "bg-destructive" : "bg-primary";

                            return (
                                <Link
                                    key={loan.id}
                                    href={`/loans/${loan.id}`}
                                    className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 pl-5 transition-all hover:border-primary/20 hover:shadow-md active:scale-[0.99]"
                                >
                                    <div className={cn("absolute inset-y-0 left-0 w-1.5", accent)} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn(
                                                "h-5 rounded-full px-2 text-[9px] font-semibold uppercase border-none",
                                                isSettled ? "bg-success/15 text-success" : isOverdue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                                            )}>
                                                {loan.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{formatDate(loan.startDate)}</span>
                                        </div>
                                        <p className="text-sm font-semibold tabular-nums mt-1.5">
                                            {formatCurrency(parseFloat(loan.principalAmount))}
                                            <span className="text-xs font-medium text-muted-foreground ml-2">
                                                {outstandingLoan > 0 ? `${formatCurrency(outstandingLoan)} left` : "Cleared"}
                                            </span>
                                        </p>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2.5 max-w-[180px]">
                                            <div className={cn("h-full rounded-full", accent)} style={{ width: `${rate}%` }} />
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={cn(
                                            "text-base font-bold tabular-nums leading-none",
                                            rate >= 100 ? "text-success" : "text-primary",
                                        )}>
                                            {rate.toFixed(0)}%
                                        </p>
                                        <p className="text-[9px] font-semibold uppercase tracking-tight text-muted-foreground mt-1">Paid</p>
                                    </div>
                                    <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-muted-foreground shrink-0" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <CustomerForm
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                defaultValues={customerFormDefaults}
            />
        </div>
    );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
    return (
        <div className="px-3 text-center first:text-left first:pl-5 last:text-right last:pr-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <p className={cn("text-base sm:text-lg font-bold tabular-nums mt-1 truncate", tone ?? "text-foreground")}>{value}</p>
        </div>
    );
}

function Fact({ icon, label, children }: { icon: typeof TelephoneIcon; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3.5">
            <div className="flex items-center gap-3 text-muted-foreground">
                <HugeiconsIcon icon={icon} className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-right min-w-0">{children}</div>
        </div>
    );
}
