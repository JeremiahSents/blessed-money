"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Wallet01Icon,
    CheckmarkCircle02Icon,
    ArrowRight01Icon,
    MoneyReceive01Icon,
    UserMultipleIcon,
    Alert02Icon,
} from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardPageSkeleton } from "@/components/shared/page-skeletons";
import { NewLoanSheet } from "@/features/loans/components/new-loan-sheet";
import { PaymentForm } from "@/features/loans/components/payment-form";
import { cn, formatCurrency, getGreeting } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

type DashboardResponse = {
    data: {
        stats: {
            capitalOutstanding?: string | number;
            collectedThisMonth?: string | number;
            activeLoans?: number;
            overdueLoans?: number;
        };
    };
};

type ActiveLoan = {
    id: string;
    principalAmount: string;
    status: "active" | "overdue" | "settled";
    customer: { id: string; name: string; phone: string | null };
    billingCycles: Array<{ balance: string }>;
};

export default function DashboardPage() {
    const [payingLoan, setPayingLoan] = useState<ActiveLoan | null>(null);

    const { data: dash, isLoading } = useQuery<DashboardResponse>({
        queryKey: ["dashboard"],
        queryFn: async () => {
            const res = await fetch("/api/dashboard");
            if (res.status === 401 && typeof window !== "undefined") {
                window.location.href = "/signin";
            }
            if (!res.ok) throw new Error("Failed to fetch dashboard");
            return res.json();
        },
    });

    const { data: loansRes } = useQuery<{ data: ActiveLoan[] }>({
        queryKey: ["loans", "open"],
        queryFn: async () => {
            const res = await fetch("/api/loans?limit=50");
            if (!res.ok) throw new Error("Failed to fetch loans");
            return res.json();
        },
    });

    const { data: session } = useQuery({
        queryKey: ["session"],
        queryFn: async () => (await authClient.getSession()).data,
    });

    if (isLoading) return <DashboardPageSkeleton />;

    const stats = dash?.data?.stats ?? {};
    const owed = parseFloat(String(stats.capitalOutstanding || 0));
    const collected = parseFloat(String(stats.collectedThisMonth || 0));
    const activeCount = stats.activeLoans || 0;
    const overdueCount = stats.overdueLoans || 0;

    const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "";
    // Show loans people still owe on (active + overdue), late ones first.
    const loans = (loansRes?.data ?? [])
        .filter((l) => l.status !== "settled")
        .sort((a, b) => Number(b.status === "overdue") - Number(a.status === "overdue"));

    const balanceOf = (loan: ActiveLoan) =>
        parseFloat(loan.billingCycles?.[0]?.balance || "0");

    return (
        <div className="max-w-3xl mx-auto pb-28 md:pb-10 px-1 space-y-6">
            {/* Greeting */}
            <div className="pt-2 md:pt-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {getGreeting()}{firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Here&apos;s what people owe you.
                </p>
            </div>

            {/* The two numbers that matter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="rounded-3xl bg-linear-to-br from-primary to-primary/85 text-primary-foreground border-0 overflow-hidden relative">
                    <div aria-hidden className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                    <CardContent className="p-6 relative">
                        <div className="flex items-center gap-2 text-primary-foreground/85">
                            <HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />
                            <p className="text-sm font-medium">Owed to you</p>
                        </div>
                        <p className="text-4xl font-bold mt-2 tabular-nums">{formatCurrency(owed)}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 rounded-full px-2.5 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                                {activeCount} active
                            </span>
                            {overdueCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 rounded-full px-2.5 py-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                                    {overdueCount} late
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4" />
                            <p className="text-sm font-medium">Collected this month</p>
                        </div>
                        <p className="text-4xl font-bold mt-2 tabular-nums text-foreground">
                            {formatCurrency(collected)}
                        </p>
                        <Link
                            href="/customers"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-3"
                        >
                            <HugeiconsIcon icon={UserMultipleIcon} className="w-3.5 h-3.5" />
                            View borrowers
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Primary action */}
            <NewLoanSheet />

            {/* Active loans — who owes what, with one-tap payment */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-semibold text-foreground">Active loans</h2>
                    <Link href="/loans" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
                        View all <HugeiconsIcon icon={ArrowRight01Icon} className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {loans.length === 0 ? (
                    <Card className="rounded-3xl">
                        <CardContent className="p-8 text-center">
                            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-sm font-semibold">No active loans</p>
                            <p className="text-xs text-muted-foreground mt-1">Give your first loan to get started.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2.5">
                        {loans.map((loan) => {
                            const balance = balanceOf(loan);
                            const isLate = loan.status === "overdue";
                            return (
                                <Card key={loan.id} className="rounded-2xl overflow-hidden">
                                    <CardContent className="p-3.5 flex items-center gap-3">
                                        <Link href={`/loans/${loan.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={cn(
                                                "w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-semibold shrink-0 uppercase",
                                                isLate ? "bg-amber-500" : "bg-primary",
                                            )}>
                                                {loan.customer.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate capitalize flex items-center gap-1.5">
                                                    {loan.customer.name}
                                                    {isLate && (
                                                        <HugeiconsIcon icon={Alert02Icon} className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground tabular-nums">
                                                    {formatCurrency(balance)} owed
                                                </p>
                                            </div>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="h-9 rounded-xl shrink-0 font-semibold"
                                            onClick={() => setPayingLoan(loan)}
                                        >
                                            <HugeiconsIcon icon={MoneyReceive01Icon} className="w-4 h-4 mr-1.5" />
                                            Pay
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Record payment sheet (shared, driven by the selected loan) */}
            {payingLoan && (
                <PaymentForm
                    loanId={payingLoan.id}
                    open={!!payingLoan}
                    onOpenChange={(open) => !open && setPayingLoan(null)}
                    balance={balanceOf(payingLoan)}
                />
            )}
        </div>
    );
}
