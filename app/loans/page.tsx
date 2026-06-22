"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Wallet01Icon,
    MoneyReceive01Icon,
    PlusSignIcon,
    Calendar04Icon,
    Coins01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PaymentForm } from "@/features/loans/components/payment-form";
import { formatCurrency, formatDate, displayStatus, cn } from "@/lib/utils";
import { LoansPageSkeleton } from "@/components/shared/page-skeletons";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

    const { dueThisWeek, current, finished } = useMemo(() => {
        const loans = data?.data || [];
        const weekFromNow = new Date().getTime() + 7 * 86400000;

        const getNextDueTime = (loan: LoanWithCustomer) => {
            const nextCycle = (loan.billingCycles || []).find(c => c.status !== "closed");
            const dateStr = nextCycle?.cycleEndDate || loan.dueDate;
            return dateStr ? new Date(dateStr).getTime() : Infinity;
        };

        const dueThisWeek: LoanWithCustomer[] = [];
        const current: LoanWithCustomer[] = [];
        const finished: LoanWithCustomer[] = [];

        for (const loan of loans) {
            if (loan.status === "settled") {
                finished.push(loan);
            } else if (getNextDueTime(loan) <= weekFromNow) {
                dueThisWeek.push(loan);
            } else {
                current.push(loan);
            }
        }

        dueThisWeek.sort((a, b) => getNextDueTime(a) - getNextDueTime(b));

        return { dueThisWeek, current, finished };
    }, [data]);

    const defaultTab =
        dueThisWeek.length > 0 ? "due" :
        current.length > 0 ? "current" :
        "finished";

    if (isLoading) return <LoansPageSkeleton />;

    const handleCollect = (loan: LoanWithCustomer) => {
        setSelectedLoan(loan);
        setIsPaymentOpen(true);
    };

    const renderList = (loans: LoanWithCustomer[], emptyText: string) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.length > 0 ? (
                loans.map((loan) => (
                    <LoanListItem
                        key={loan.id}
                        loan={loan}
                        onCollect={() => handleCollect(loan)}
                    />
                ))
            ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-3xl bg-muted border border-dashed border-border">
                    <HugeiconsIcon icon={Wallet01Icon} className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-tight">{emptyText}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32 pt-8 px-4 sm:px-6">
            {/* Header Area */}
            <div className="flex flex-col gap-6 pb-2 border-b border-border">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-primary">
                            <HugeiconsIcon icon={Wallet01Icon} className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-semibold text-foreground tracking-tight">Loan Portfolio</h1>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium ml-1">Track active cycles and manage settled records.</p>
                </div>
                <Link href="/loans/new" className="block w-full">
                    <Button className="w-full h-12 px-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.99]">
                        <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                        Issue New Loan
                    </Button>
                </Link>
            </div>

            {/* Tabbed groups */}
            <Tabs defaultValue={defaultTab} className="gap-6">
                <TabsList className="w-full h-auto p-1.5 rounded-3xl bg-muted shadow-sm dark:shadow-none">
                    <TabsTrigger value="due" className="rounded-2xl text-sm md:text-[15px] font-semibold gap-2 px-4 md:px-5 py-3 min-h-12">
                        Due This Week
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive/10 px-2 text-[11px] font-bold text-destructive">
                            {dueThisWeek.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="current" className="rounded-2xl text-sm md:text-[15px] font-semibold gap-2 px-4 md:px-5 py-3 min-h-12">
                        Current
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-success/10 px-2 text-[11px] font-bold text-success">
                            {current.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="finished" className="rounded-2xl text-sm md:text-[15px] font-semibold gap-2 px-4 md:px-5 py-3 min-h-12">
                        Finished
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-[11px] font-bold text-muted-foreground">
                            {finished.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="due">
                    {renderList(dueThisWeek, "Nothing due in the next 7 days")}
                </TabsContent>
                <TabsContent value="current">
                    {renderList(current, "No other active loans")}
                </TabsContent>
                <TabsContent value="finished">
                    {renderList(finished, "No settled records yet")}
                </TabsContent>
            </Tabs>

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

function LoanListItem({ loan, onCollect }: { loan: LoanWithCustomer, onCollect: () => void }) {
    const router = useRouter();
    const isSettled = loan.status === "settled";
    const isOverdue = loan.status === "overdue";

    const handleCardClick = () => {
        router.push(`/loans/${loan.id}`);
    };

    const handleCollectClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCollect();
    };

    return (
        <div
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick();
                }
            }}
            className={cn(
                "group relative p-6 rounded-[32px] border transition-all duration-300 cursor-pointer",
                isSettled
                    ? "bg-muted border-border opacity-70 hover:opacity-90"
                    : "bg-card border-border hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.99]"
            )}
        >
            {/* Top Bar: Customer & Status */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <PersonAvatar seed={loan.customer?.id} name={loan.customer?.name || "Customer"} className="w-11 h-11 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p
                            title={loan.customer?.name}
                            className="text-base font-semibold capitalize text-foreground block truncate"
                        >
                            {loan.customer?.name}
                        </p>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                            {formatDate(loan.startDate)}
                        </span>
                    </div>
                </div>
                <Badge className={cn(
                    "px-2 py-0.5 text-[9px] font-bold border-none shadow-none uppercase tracking-wider shrink-0",
                    loan.status === 'active' ? "bg-success/10 text-success" :
                    isOverdue ? "bg-destructive text-primary-foreground shadow-lg shadow-destructive/20" :
                    "bg-muted text-muted-foreground"
                )}>
                    {displayStatus(loan.status)}
                </Badge>
            </div>

            {/* Mid: Stats */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                        <HugeiconsIcon icon={Coins01Icon} className="w-3.5 h-3.5 opacity-60" />
                        Principal
                    </div>
                    <p className="text-lg font-semibold text-foreground tabular-nums tracking-tight">
                        {formatCurrency(parseFloat(loan.principalAmount))}
                    </p>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                        <HugeiconsIcon icon={Calendar04Icon} className="w-3.5 h-3.5 opacity-60" />
                        Issued
                    </div>
                    <p className="text-lg font-semibold text-muted-foreground tabular-nums tracking-tight">
                        {formatDate(loan.startDate)}
                    </p>
                </div>
            </div>

            {/* Bottom Action */}
            <div className="pt-5 border-t border-border">
                {isSettled ? (
                    <div className="flex items-center justify-center h-11 text-[10px] font-bold text-muted-foreground uppercase border border-dashed border-border rounded-xl">
                        Fully Settled
                    </div>
                ) : (
                    <Button
                        onClick={handleCollectClick}
                        className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-xs font-semibold uppercase shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
                    >
                        <HugeiconsIcon icon={MoneyReceive01Icon} className="w-4 h-4 mr-2" />
                        Collect Payment
                    </Button>
                )}
            </div>
        </div>
    );
}
