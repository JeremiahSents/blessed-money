"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OverduePanel } from "@/components/dashboard/overdue-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardPageSkeleton } from "@/components/shared/page-skeletons";
import { cn, formatCompactCurrency, getGreeting } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultipleIcon,
  Coins01Icon,
  PlusSignIcon,
  ArrowRight01Icon,
  Wallet01Icon,
  CheckmarkCircle02Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { format } from "date-fns";
import { authClient } from "@/lib/auth-client";
import type { ActivityItem, BillingCycle, Customer, LoanSummary } from "@/lib/types";

type OverdueLoan = LoanSummary & {
  customer: Pick<Customer, "name" | "phone">;
  billingCycles?: BillingCycle[];
};

type DashboardResponse = {
  data: {
    stats: {
      workingCapitalCurrent?: string | number;
      workingCapitalBase?: string | number;
      capitalOutstanding?: string | number;
      activeLoans?: number;
      overdueLoans?: number;
      collectedThisMonth?: string | number;
      lentThisMonth?: string | number;
      remainingThisMonth?: string | number;
      netWorth?: string | number;
    };
    activity: ActivityItem[];
    overdueLoansList: OverdueLoan[];
  };
};

type ActivityTab = "all" | "payments" | "loans";

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/signin";
        }
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await authClient.getSession();
      return data;
    },
  });

  const fullName = session?.user?.name?.trim() || "";
  const firstName = fullName.split(/\s+/)[0] || "";

  const [activityTab, setActivityTab] = useState<ActivityTab>("all");

  const filteredActivity = useMemo(() => {
    const list = data?.data?.activity ?? [];
    let filtered = list;
    if (activityTab === "payments") filtered = list.filter((a) => a.type === "PAYMENT");
    else if (activityTab === "loans") filtered = list.filter((a) => a.type === "LOAN");
    return filtered.slice(0, 10);
  }, [data, activityTab]);

  if (isLoading) {
    return <DashboardPageSkeleton />;
  }

  if (isError || !data?.data) {
    return (
      <div className="max-w-5xl mx-auto px-2 py-12 text-sm text-muted-foreground">
        Failed to load dashboard.
      </div>
    );
  }

  const { stats, overdueLoansList } = data.data;

  const activeLoans = stats?.activeLoans || 0;
  const overdueLoans = stats?.overdueLoans || 0;
  const netWorth = parseFloat(String(stats?.netWorth || 0));
  const lentThisMonth = parseFloat(String(stats?.lentThisMonth || 0));
  const collected = parseFloat(String(stats?.collectedThisMonth || 0));
  const remainingThisMonth = parseFloat(String(stats?.remainingThisMonth || 0));

  const quickActions = [
    {
      href: "/loans/new",
      label: "New Loan",
      icon: PlusSignIcon,
      primary: true,
    },
    {
      href: "/loans?status=due-this-week",
      label: "Due This Week",
      icon: Calendar01Icon,
      primary: false,
      badge: overdueLoans > 0 ? overdueLoans : undefined,
    },
    {
      href: "/payments",
      label: "Collect",
      icon: Coins01Icon,
      primary: false,
    },
    {
      href: "/customers",
      label: "Customers",
      icon: UserMultipleIcon,
      primary: false,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-8 px-2 md:px-0 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 md:pt-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-0.5 truncate">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}{" "}
          </h1>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground -mt-3 md:-mt-5">
        Your business at a glance
      </p>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-fr gap-3 md:gap-4">
        {/* Hero — Net Worth (lifetime, spans 2x2 on desktop) */}
        <Card className="col-span-2 md:col-span-2 md:row-span-2 rounded-2xl bg-linear-to-br from-primary to-primary/85 text-primary-foreground border-0 overflow-hidden relative">
          <div
            aria-hidden
            className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-white/5 blur-3xl"
          />
          <CardContent className="p-5 md:p-7 relative flex flex-col h-full">
            <div className="flex items-center gap-2 text-primary-foreground/85">
              <HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />
              <p className="text-sm font-medium">Net Worth</p>
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-white/15 backdrop-blur rounded-full px-2 py-0.5">
                Lifetime
              </span>
            </div>
            <p className="text-3xl md:text-5xl font-bold mt-2 md:mt-3 tabular-nums leading-tight">
              {formatCompactCurrency(netWorth)}
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                {activeLoans} active
              </span>
              {overdueLoans > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                  {overdueLoans} overdue
                </span>
              )}
            </div>
            <div className="mt-auto pt-4 hidden md:block">
              <p className="text-xs text-primary-foreground/75">
                Cash on hand plus outstanding receivables
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Lent Out (this month) — wide tile on desktop */}
        <Card className="col-span-2 md:col-span-2 rounded-2xl">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
              <p className="text-sm font-medium">Total Lent Out</p>
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                This month
              </span>
            </div>
            <p className="text-2xl md:text-4xl font-bold mt-2 tabular-nums text-foreground">
              {formatCompactCurrency(lentThisMonth)}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              New loans issued in {format(new Date(), "MMMM")}
            </p>
          </CardContent>
        </Card>

        {/* Collected (this month) */}
        <Card className="col-span-1 rounded-2xl">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4" />
              <p className="text-xs md:text-sm font-medium">Collected</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground mt-2 tabular-nums">
              {formatCompactCurrency(collected)}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        {/* Remaining Balance (this month) */}
        <Card className="col-span-1 rounded-2xl">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4" />
              <p className="text-xs md:text-sm font-medium">Remaining</p>
            </div>
            <p
              className={cn(
                "text-xl md:text-2xl font-bold mt-2 tabular-nums",
                remainingThisMonth > 0 ? "text-amber-600 dark:text-amber-500" : "text-foreground",
              )}
            >
              {formatCompactCurrency(remainingThisMonth)}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              Still due this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-1.5 md:gap-2 group min-w-0"
              >
                <div
                  className={cn(
                    "relative w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 group-active:scale-90 group-hover:-translate-y-0.5",
                    action.primary
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/10"
                      : "bg-zinc-100/70 dark:bg-zinc-900 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800",
                  )}
                >
                  <HugeiconsIcon
                    icon={action.icon}
                    className={cn(
                      "w-6 h-6 md:w-7 md:h-7",
                      action.primary ? "" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {action.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-card">
                      {action.badge}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[9px] md:text-xs font-semibold uppercase tracking-wide text-center truncate w-full transition-colors",
                    action.primary
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Needs Attention + Recent Activity — side by side on desktop */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {overdueLoansList.length > 0 ? (
          <Card className="rounded-2xl min-w-0">
            <CardContent className="p-5 md:p-6">
              <h2 className="text-sm font-semibold text-foreground mb-1">
                Needs Attention
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Customers with overdue payments
              </p>
              <OverduePanel overdueLoans={overdueLoansList} />
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl min-w-0">
            <CardContent className="p-5 md:p-6 flex flex-col items-center justify-center text-center min-h-[140px]">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <p className="text-sm font-semibold text-foreground">All caught up</p>
              <p className="text-xs text-muted-foreground mt-1">
                No overdue payments right now
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl min-w-0">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">
                  Recent Activity
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing latest 10
                </p>
              </div>
              <Link
                href="/payments"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                View all
                <HugeiconsIcon icon={ArrowRight01Icon} className="w-3.5 h-3.5" />
              </Link>
            </div>

            <Tabs
              value={activityTab}
              onValueChange={(v) => setActivityTab((v as ActivityTab) ?? "all")}
            >
              <TabsList className="w-full grid grid-cols-3 mb-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="loans">Loans</TabsTrigger>
              </TabsList>
              <TabsContent value={activityTab}>
                <ActivityFeed
                  activity={filteredActivity}
                  emptyLabel={
                    activityTab === "payments"
                      ? "No recent payments"
                      : activityTab === "loans"
                        ? "No recent loans"
                        : "No activity yet"
                  }
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
