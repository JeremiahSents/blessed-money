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
    Alert02Icon,
    Alert01Icon,
    TickDouble02Icon,
    Coins01Icon,
} from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardPageSkeleton } from "@/components/shared/page-skeletons";
import { NewLoanSheet } from "@/features/loans/components/new-loan-sheet";
import { PaymentForm } from "@/features/loans/components/payment-form";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { cn, formatCurrency, formatDate, getGreeting } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { buildActivityFeed, type ActivityKind, type FeedItem } from "@/features/dashboard/lib/activity";

type DashboardResponse = {
    data: {
        stats: {
            capitalOutstanding?: string | number;
            collectedThisMonth?: string | number;
            lentThisMonth?: string | number;
            remainingThisMonth?: string | number;
            workingCapitalCurrent?: string | number;
            activeLoans?: number;
            overdueLoans?: number;
        };
        activity?: Parameters<typeof buildActivityFeed>[0]["activity"];
        overdueLoansList?: Parameters<typeof buildActivityFeed>[0]["overdueLoansList"];
    };
};

// Visual identity for each activity type so the feed is scannable at a glance.
const KIND_STYLE: Record<ActivityKind, { icon: typeof Coins01Icon; chip: string; dot: string }> = {
    disbursed: { icon: Coins01Icon, chip: "bg-primary/10 text-primary", dot: "Loaned out" },
    payment: { icon: TickDouble02Icon, chip: "bg-success/10 text-success", dot: "Payment" },
    late: { icon: Alert02Icon, chip: "bg-warning/15 text-warning", dot: "Late" },
    missed: { icon: Alert01Icon, chip: "bg-destructive/10 text-destructive", dot: "Missed" },
    milestone: { icon: CheckmarkCircle02Icon, chip: "bg-success/10 text-success", dot: "Milestone" },
};

const PAGE_SIZE = 6;

export default function DashboardPage() {
    const [payingLoan, setPayingLoan] = useState<{ loanId: string; balance: number } | null>(null);
    const [visible, setVisible] = useState(PAGE_SIZE);

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

    const { data: session } = useQuery({
        queryKey: ["session"],
        queryFn: async () => (await authClient.getSession()).data,
    });

    if (isLoading) return <DashboardPageSkeleton />;

    const stats = dash?.data?.stats ?? {};
    const owed = parseFloat(String(stats.capitalOutstanding || 0));
    const collected = parseFloat(String(stats.collectedThisMonth || 0));
    const dueThisMonth = parseFloat(String(stats.remainingThisMonth || 0));
    const cashOnHand = parseFloat(String(stats.workingCapitalCurrent || 0));
    const activeCount = stats.activeLoans || 0;
    const overdueCount = stats.overdueLoans || 0;

    const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "";

    const feed = buildActivityFeed({
        activity: dash?.data?.activity,
        overdueLoansList: dash?.data?.overdueLoansList,
    });

    return (
        <div className="max-w-3xl mx-auto px-1 space-y-6">
            {/* Greeting */}
            <div className="pt-2 md:pt-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {getGreeting()}{firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Here&apos;s what people owe you.
                </p>
            </div>

            {/* Bento: the headline number on top, four equal stat tiles below */}
            <div className="grid grid-cols-2 gap-3">
                {/* Owed to you — headline, full width */}
                <Card className="col-span-2 rounded-3xl bg-linear-to-br from-primary to-primary/85 text-primary-foreground border-0 overflow-hidden relative">
                    <div aria-hidden className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary-foreground/10 blur-2xl" />
                    <CardContent className="p-6 relative">
                        <div className="flex items-center gap-2 text-primary-foreground/85">
                            <HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />
                            <p className="text-sm font-medium">Owed to you</p>
                        </div>
                        <p className="text-4xl font-bold mt-2 tabular-nums">{formatCurrency(owed)}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-foreground/15 rounded-full px-2.5 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                {activeCount} active
                            </span>
                            {overdueCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-foreground/15 rounded-full px-2.5 py-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                                    {overdueCount} late
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Four equal tiles */}
                <StatTile icon={CheckmarkCircle02Icon} label="Collected this month" value={formatCurrency(collected)} accent />
                <StatTile icon={Coins01Icon} label="Due this month" value={formatCurrency(dueThisMonth)} />
                <StatTile icon={Wallet01Icon} label="Cash on hand" value={formatCurrency(cashOnHand)} />
                <StatTile icon={MoneyReceive01Icon} label="Lent this month" value={formatCurrency(parseFloat(String(stats.lentThisMonth || 0)))} />
            </div>

            {/* Primary action */}
            <NewLoanSheet />

            {/* Recent activity — typed, scannable, paginated */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
                    <Link href="/loans" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
                        View loans <HugeiconsIcon icon={ArrowRight01Icon} className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {feed.length === 0 ? (
                    <Card className="rounded-3xl">
                        <CardContent className="p-8 text-center">
                            <div className="w-10 h-10 mx-auto rounded-full bg-success/15 flex items-center justify-center mb-2">
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-5 h-5 text-success" />
                            </div>
                            <p className="text-sm font-semibold">Nothing yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Give your first loan to get started.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-2.5">
                            {feed.slice(0, visible).map((item) => (
                                <ActivityRow
                                    key={item.id}
                                    item={item}
                                    onCollect={
                                        item.kind === "late" || item.kind === "missed"
                                            ? () => setPayingLoan({ loanId: item.loanId, balance: item.amount ?? 0 })
                                            : undefined
                                    }
                                />
                            ))}
                        </div>
                        {visible < feed.length && (
                            <Button
                                variant="outline"
                                className="w-full mt-3 h-11 rounded-2xl font-semibold"
                                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                            >
                                Show more
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Record payment sheet (shared, driven by the selected loan) */}
            {payingLoan && (
                <PaymentForm
                    loanId={payingLoan.loanId}
                    open={!!payingLoan}
                    onOpenChange={(open) => !open && setPayingLoan(null)}
                    balance={payingLoan.balance}
                />
            )}
        </div>
    );
}

function StatTile({
    icon,
    label,
    value,
    accent,
}: {
    icon: typeof Coins01Icon;
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className="rounded-3xl border border-border bg-card p-4 flex flex-col justify-between min-h-[104px]">
            <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                    icon={icon}
                    className={cn("w-4 h-4 shrink-0", accent ? "text-success" : "text-muted-foreground")}
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">
                    {label}
                </p>
            </div>
            <p className="text-base font-bold tabular-nums text-foreground leading-none mt-2">
                {value}
            </p>
        </div>
    );
}

function ActivityRow({ item, onCollect }: { item: FeedItem; onCollect?: () => void }) {
    const style = KIND_STYLE[item.kind];
    return (
        <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-3.5 flex items-start gap-3">
                <Link href={item.href} className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                        <PersonAvatar seed={item.customerId ?? item.name} name={item.name} className="w-11 h-11" />
                        <span className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-card",
                            style.chip,
                        )}>
                            <HugeiconsIcon icon={style.icon} className="w-3 h-3" />
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm capitalize leading-snug line-clamp-2">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                        {item.date && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{formatDate(item.date)}</p>
                        )}
                    </div>
                </Link>
                {onCollect ? (
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-9 rounded-xl shrink-0 font-semibold"
                        onClick={onCollect}
                    >
                        <HugeiconsIcon icon={MoneyReceive01Icon} className="w-4 h-4 mr-1.5" />
                        Collect
                    </Button>
                ) : item.amount !== null ? (
                    <span className={cn(
                        "text-sm font-semibold tabular-nums shrink-0",
                        item.kind === "payment" ? "text-success"
                            : item.kind === "disbursed" ? "text-muted-foreground"
                                : "text-foreground",
                    )}>
                        {item.sign}{formatCurrency(item.amount)}
                    </span>
                ) : null}
            </CardContent>
        </Card>
    );
}
