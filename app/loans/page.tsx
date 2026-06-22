"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    PlusSignIcon,
    Search01Icon,
    Cancel01Icon,
    MoneyReceive01Icon,
    Wallet01Icon,
    ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { PaymentForm } from "@/features/loans/components/payment-form";
import { NewLoanSheet } from "@/features/loans/components/new-loan-sheet";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { LoansPageSkeleton } from "@/components/shared/page-skeletons";
import { useRouter } from "next/navigation";
import type { LoanSummary, Customer, BillingCycle } from "@/lib/types";

type LoanWithCustomer = LoanSummary & {
    customer: Customer;
    billingCycles: BillingCycle[];
};

const nextDueTime = (loan: LoanWithCustomer) => {
    const nextCycle = (loan.billingCycles || []).find((c) => c.status !== "closed") || loan.billingCycles?.[0];
    const dateStr = nextCycle?.cycleEndDate || loan.dueDate;
    return dateStr ? new Date(dateStr).getTime() : Infinity;
};

export default function LoansPage() {
    const [selectedLoan, setSelectedLoan] = useState<LoanWithCustomer | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [windowDays, setWindowDays] = useState<7 | 30>(7);
    const [showSettled, setShowSettled] = useState(false);

    const { data, isLoading } = useQuery<{ data: LoanWithCustomer[] }>({
        queryKey: ["loans", "all"],
        queryFn: async () => {
            const res = await fetch("/api/loans?limit=100");
            if (!res.ok) throw new Error("Failed to fetch loans");
            return res.json();
        },
    });

    const { due, settled } = useMemo(() => {
        const q = search.trim().toLowerCase();
        const loans = (data?.data || []).filter(
            (l) => !q || (l.customer?.name || "").toLowerCase().includes(q),
        );
        const cutoff = Date.now() + windowDays * 86400000;

        const due: LoanWithCustomer[] = [];
        const settled: LoanWithCustomer[] = [];

        for (const loan of loans) {
            if (loan.status === "settled") settled.push(loan);
            else if (nextDueTime(loan) <= cutoff) due.push(loan);
        }

        due.sort((a, b) => nextDueTime(a) - nextDueTime(b));
        return { due, settled };
    }, [data, search, windowDays]);

    if (isLoading) return <LoansPageSkeleton />;

    const handleCollect = (loan: LoanWithCustomer) => {
        setSelectedLoan(loan);
        setIsPaymentOpen(true);
    };

    return (
        <div className="max-w-3xl mx-auto px-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 pt-2 md:pt-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Loans</h1>
                    <p className="text-sm text-muted-foreground mt-1 truncate">Who owes you, and when it&apos;s due.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="secondary"
                        size="icon"
                        aria-label="Search loans"
                        onClick={() => setIsSearchOpen(true)}
                        className="h-10 w-10 rounded-2xl border border-border bg-card"
                    >
                        <HugeiconsIcon icon={Search01Icon} className="w-5 h-5" />
                    </Button>
                    <Button
                        size="icon"
                        aria-label="Issue new loan"
                        onClick={() => setIsNewLoanOpen(true)}
                        className="h-10 w-10 rounded-2xl shadow-lg shadow-primary/20"
                    >
                        <HugeiconsIcon icon={PlusSignIcon} className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Window selector */}
            <div className="flex items-center gap-2">
                <div className="inline-flex p-1 rounded-2xl bg-muted">
                    {([7, 30] as const).map((d) => (
                        <button
                            key={d}
                            onClick={() => setWindowDays(d)}
                            className={cn(
                                "px-4 h-9 rounded-xl text-sm font-semibold transition-all",
                                windowDays === d
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            Next {d} days
                        </button>
                    ))}
                </div>
                {due.length > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {due.length} due
                    </span>
                )}
            </div>

            {search && (
                <p className="text-xs text-muted-foreground px-1 -mt-2">
                    Showing results for <span className="font-semibold text-foreground">{search}</span>
                </p>
            )}

            {/* Due list */}
            {due.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center rounded-2xl bg-muted border border-dashed border-border text-center">
                    <HugeiconsIcon icon={Wallet01Icon} className="w-9 h-9 text-muted-foreground mb-3" />
                    <p className="text-sm font-semibold text-foreground">Nothing due in the next {windowDays} days</p>
                    <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                    {due.map((loan) => (
                        <LoanRow key={loan.id} loan={loan} onCollect={() => handleCollect(loan)} />
                    ))}
                </div>
            )}

            {/* Settled, tucked away */}
            {settled.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowSettled((s) => !s)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-1"
                    >
                        <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            className={cn("w-4 h-4 transition-transform", showSettled && "rotate-180")}
                        />
                        {showSettled ? "Hide" : "Show"} settled ({settled.length})
                    </button>
                    {showSettled && (
                        <div className="mt-3 rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                            {settled.map((loan) => (
                                <LoanRow key={loan.id} loan={loan} settled />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedLoan && (
                <PaymentForm
                    loanId={selectedLoan.id}
                    open={isPaymentOpen}
                    onOpenChange={setIsPaymentOpen}
                    balance={selectedLoan.billingCycles?.[0] ? parseFloat(selectedLoan.billingCycles[0].balance) : 0}
                />
            )}

            <NewLoanSheet open={isNewLoanOpen} onOpenChange={setIsNewLoanOpen} showTrigger={false} />

            {/* Search modal */}
            <ResponsiveModal
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                title="Search loans"
                description="Find by borrower name."
            >
                <div className="relative mt-1">
                    <HugeiconsIcon
                        icon={Search01Icon}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                    />
                    <Input
                        autoFocus
                        placeholder="Search by borrower name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && setIsSearchOpen(false)}
                        className="pl-10 pr-10 h-12 rounded-2xl border-border bg-card focus-visible:ring-primary/20"
                    />
                    {search && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <Button className="w-full h-12 rounded-2xl mt-4 font-semibold" onClick={() => setIsSearchOpen(false)}>
                    Done
                </Button>
            </ResponsiveModal>
        </div>
    );
}

function LoanRow({
    loan,
    onCollect,
    settled,
}: {
    loan: LoanWithCustomer;
    onCollect?: () => void;
    settled?: boolean;
}) {
    const router = useRouter();
    const isOverdue = loan.status === "overdue";

    const nextCycle = (loan.billingCycles || []).find((c) => c.status !== "closed") || loan.billingCycles?.[0];
    const balance = nextCycle ? parseFloat(nextCycle.balance) : 0;
    const dueDateStr = nextCycle?.cycleEndDate || loan.dueDate;
    const daysLeft = dueDateStr ? Math.ceil((new Date(dueDateStr).getTime() - Date.now()) / 86400000) : null;

    const dueLabel = settled
        ? "Cleared"
        : daysLeft === null
            ? formatDate(loan.startDate)
            : daysLeft < 0
                ? `${formatDate(dueDateStr!)} · ${Math.abs(daysLeft)}d late`
                : daysLeft === 0
                    ? `Due today`
                    : `Due ${formatDate(dueDateStr!)}`;

    return (
        <div
            onClick={() => router.push(`/loans/${loan.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/loans/${loan.id}`);
                }
            }}
            className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/60 active:bg-muted"
        >
            <PersonAvatar seed={loan.customer?.id} name={loan.customer?.name || "Customer"} className="w-10 h-10 shrink-0" />

            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate capitalize">{loan.customer?.name}</p>
                <p className={cn(
                    "text-xs mt-0.5 truncate",
                    isOverdue ? "text-destructive font-semibold" : "text-muted-foreground",
                )}>
                    {dueLabel}
                </p>
            </div>

            <div className="text-right shrink-0">
                <p className={cn(
                    "text-sm font-bold tabular-nums leading-none",
                    settled ? "text-success" : isOverdue ? "text-destructive" : "text-foreground",
                )}>
                    {formatCurrency(settled ? parseFloat(loan.principalAmount) : balance)}
                </p>
                {onCollect ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onCollect(); }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-1.5 hover:underline"
                    >
                        <HugeiconsIcon icon={MoneyReceive01Icon} className="w-3.5 h-3.5" />
                        Collect
                    </button>
                ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-tight text-muted-foreground mt-1.5 inline-block">
                        Principal
                    </span>
                )}
            </div>
        </div>
    );
}
