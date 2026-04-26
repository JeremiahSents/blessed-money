"use client";

import { useQuery } from "@tanstack/react-query";
import { OverduePanel } from "@/components/dashboard/overdue-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardPageSkeleton } from "@/components/shared/page-skeletons";
import {
  cn,
  formatCompactCurrency,
  getAvatarColor,
  getGreeting,
  getInitials,
} from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultipleIcon,
  Coins01Icon,
  Alert02Icon,
  PlusSignIcon,
  ArrowRight01Icon,
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
      expectedThisCycle?: string | number;
      collectedThisMonth?: string | number;
    };
    activity: ActivityItem[];
    overdueLoansList: OverdueLoan[];
  };
};

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
  const initials = fullName ? getInitials(fullName) : "";

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

  const { stats, activity, overdueLoansList } = data.data;

  const activeLoans = stats?.activeLoans || 0;
  const overdueLoans = stats?.overdueLoans || 0;
  const totalLent = parseFloat(String(stats?.capitalOutstanding || 0));
  const yourCapital = parseFloat(String(stats?.workingCapitalCurrent || 0));
  const collected = parseFloat(String(stats?.collectedThisMonth || 0));

  const quickActions = [
    {
      href: "/loans/new",
      label: "Give Loan",
      icon: PlusSignIcon,
      primary: true,
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
    {
      href: "/loans?status=overdue",
      label: "Follow Up",
      icon: Alert02Icon,
      primary: false,
      badge: overdueLoans > 0 ? overdueLoans : undefined,
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
            <span aria-hidden="true">&#x1F44B;</span>
          </h1>
        </div>
        <Link href="/settings" aria-label="Settings" className="shrink-0">
          <Avatar className="w-10 h-10 md:w-11 md:h-11 ring-2 ring-border hover:ring-primary/40 transition">
            <AvatarFallback
              className={cn(
                "text-sm font-semibold",
                fullName ? getAvatarColor(fullName) : "bg-muted text-muted-foreground",
              )}
            >
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* Hero + Stats grid */}
      <div className="grid gap-3 md:gap-5 md:grid-cols-3">
        {/* Hero Stat — Total Lent Out (spans 2 cols on desktop) */}
        <Card className="md:col-span-2 rounded-2xl border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 overflow-hidden relative">
          <div
            aria-hidden
            className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -right-20 bottom-0 w-56 h-56 rounded-full bg-white/5 blur-3xl"
          />
          <CardContent className="p-5 md:p-7 relative">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/80">
              Total Lent Out
            </p>
            <p className="text-3xl md:text-5xl font-bold mt-1.5 tabular-nums">
              {formatCompactCurrency(totalLent)}
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                {activeLoans} active loan{activeLoans !== 1 ? "s" : ""}
              </span>
              {overdueLoans > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                  {overdueLoans} overdue
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side stats — stacked on desktop, 2-up on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-5">
          <Card className="rounded-2xl">
            <CardContent className="p-4 md:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your Capital
              </p>
              <p
                className={cn(
                  "text-lg md:text-2xl font-bold mt-1 tabular-nums",
                  yourCapital < 0 ? "text-destructive" : "text-foreground",
                )}
              >
                {formatCompactCurrency(yourCapital)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 md:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Collected This Month
              </p>
              <p className="text-lg md:text-2xl font-bold text-foreground mt-1 tabular-nums">
                {formatCompactCurrency(collected)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
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
                  : "bg-card border shadow-sm group-hover:border-primary/30 group-hover:shadow-md",
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
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
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

      {/* Needs Attention + Recent Activity — side by side on desktop */}
      <div className="grid gap-6 md:gap-8 md:grid-cols-2">
        <div className="space-y-3 min-w-0">
          <OverduePanel overdueLoans={overdueLoansList} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recent Activity
            </h2>
            <Link
              href="/payments"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5"
            >
              View all
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ActivityFeed activity={activity} />
        </div>
      </div>
    </div>
  );
}
