"use client";

import { useQuery } from "@tanstack/react-query";
import { HorizontalStats } from "@/components/dashboard/horizontal-stats";
import { OverduePanel } from "@/components/dashboard/overdue-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardPageSkeleton } from "@/components/shared/page-skeletons";
import { formatCurrency } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultipleIcon,
  Wallet01Icon,
  Activity01Icon,
  PropertyEditIcon,
  Book02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import type { ActivityItem, BillingCycle, Customer, LoanSummary } from "@/lib/types";

type OverdueLoan = LoanSummary & {
  customer: Pick<Customer, "name">;
  billingCycles?: BillingCycle[];
};

type DashboardResponse = {
  data: {
    stats: {
      workingCapitalCurrent?: string | number;
      workingCapitalBase?: string | number;
      capitalOutstanding?: string | number;
      activeLoans?: number;
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

  if (isLoading) {
    return <DashboardPageSkeleton />;
  }

  if (isError || !data?.data) {
    return (
      <div className="max-w-5xl mx-auto px-2 py-12 text-sm text-zinc-500">
        Failed to load dashboard.
      </div>
    );
  }

  const { stats, activity, overdueLoansList } = data.data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-0">
      <HorizontalStats
        stats={[
          {
            title: "Your Money",
            value: formatCurrency(parseFloat(String(stats?.workingCapitalCurrent || 0))),
            icon: <HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />,
            description: `Starting capital: ${formatCurrency(parseFloat(String(stats?.workingCapitalBase || 0)))}`,
          },
          {
            title: "Lent Out",
            value: formatCurrency(parseFloat(String(stats?.capitalOutstanding || 0))),
            icon: <HugeiconsIcon icon={PropertyEditIcon} className="w-4 h-4" />,
            description: `${stats?.activeLoans || 0} running loans`,
          },
          {
            title: "Coming Back",
            value: formatCurrency(parseFloat(String(stats?.expectedThisCycle || 0))),
            icon: <HugeiconsIcon icon={Activity01Icon} className="w-4 h-4" />,
            description: "Expected this month",
          },
          {
            title: "Collected",
            value: formatCurrency(parseFloat(String(stats?.collectedThisMonth || 0))),
            icon: <HugeiconsIcon icon={UserMultipleIcon} className="w-4 h-4" />,
            description: "Received this month",
          },
        ]}
      />

      <div className="grid grid-cols-4 gap-2 px-2 py-1">
        <Link href="/loans/new" className="flex flex-col items-center gap-1.5 group min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 ring-4 ring-primary/10 group-active:scale-90 transition-all duration-200">
            <PlusIcon className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <span className="text-[9px] font-semibold uppercase text-zinc-400 group-hover:text-primary transition-colors text-center truncate w-full">Give Loan</span>
        </Link>
        <Link href="/payments" className="flex flex-col items-center gap-1.5 group min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm group-active:scale-90 transition-all duration-200">
            <HugeiconsIcon icon={PropertyEditIcon} className="w-5 h-5 md:w-6 md:h-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <span className="text-[9px] font-semibold uppercase text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors text-center truncate w-full">Collect Payment</span>
        </Link>
        <Link href="/customers" className="flex flex-col items-center gap-1.5 group min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm group-active:scale-90 transition-all duration-200">
            <HugeiconsIcon icon={UserMultipleIcon} className="w-5 h-5 md:w-6 md:h-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <span className="text-[9px] font-semibold uppercase text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors text-center truncate w-full">Customers</span>
        </Link>
        <Link href="/reports" className="flex flex-col items-center gap-1.5 group min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm group-active:scale-90 transition-all duration-200">
            <HugeiconsIcon icon={Book02Icon} className="w-5 h-5 md:w-6 md:h-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <span className="text-[9px] font-semibold uppercase text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors text-center truncate w-full">Reports</span>
        </Link>
      </div>

      {overdueLoansList.length > 0 && (
        <OverduePanel overdueLoans={overdueLoansList} />
      )}

      <div className="bg-transparent rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-2 py-4">
          <h2 className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-600">Recent Activity</h2>
          <Link href="/reports">
            <Button variant="ghost" size="sm" className="text-[10px] font-semibold uppercase text-primary hover:bg-primary/5">
              Full Report
            </Button>
          </Link>
        </div>
        <div className="px-2 md:px-6 pb-2">
          <ActivityFeed activity={activity} />
        </div>
      </div>
    </div>
  );
}
