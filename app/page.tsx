import { StatCard } from "@/components/dashboard/stat-card";
import { OverduePanel } from "@/components/dashboard/overdue-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { formatCurrency } from "@/lib/utils";
import { HugeiconsIcon } from '@hugeicons/react';
import { UserMultipleIcon, Wallet01Icon, Activity01Icon, PropertyEditIcon, Book02Icon } from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/core/services/dashboard-service";

export default async function DashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        redirect("/signin");
    }

    const { stats, activity, overdueLoansList } = await getDashboardData();

    return (
        <div className="space-y-8 max-w-5xl mx-auto">

            {/* Page title + primary action */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Overview of your lending portfolio</p>
                </div>
                <Link href="/loans/new">
                    <Button>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        New Loan
                    </Button>
                </Link>
            </div>

            {/* Mobile quick-action pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:hidden scrollbar-hide">
                <Link href="/payments" className="shrink-0">
                    <Button size="sm" variant="outline" className="rounded-full whitespace-nowrap">
                        <HugeiconsIcon icon={PropertyEditIcon} className="w-4 h-4 mr-1.5" />
                        Record Payment
                    </Button>
                </Link>
                <Link href="/customers" className="shrink-0">
                    <Button size="sm" variant="outline" className="rounded-full whitespace-nowrap">
                        <HugeiconsIcon icon={UserMultipleIcon} className="w-4 h-4 mr-1.5" />
                        Customers
                    </Button>
                </Link>
                <Link href="/reports" className="shrink-0">
                    <Button size="sm" variant="outline" className="rounded-full whitespace-nowrap">
                        <HugeiconsIcon icon={Book02Icon} className="w-4 h-4 mr-1.5" />
                        Reports
                    </Button>
                </Link>
            </div>

            {/* Stat cards — 2-col on tablet, 4-col on desktop, scroll on mobile */}
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-5 scrollbar-hide">
                <div className="shrink-0 w-48 md:w-auto">
                    <StatCard
                        title="Working Capital"
                        value={formatCurrency(parseFloat(String(stats?.workingCapitalCurrent || 0)))}
                        icon={<HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />}
                        description={`Base: ${formatCurrency(parseFloat(String(stats?.workingCapitalBase || 0)))}`}
                    />
                </div>
                <div className="shrink-0 w-48 md:w-auto">
                    <StatCard
                        title="Active Loans"
                        value={stats?.activeLoans || 0}
                        icon={<HugeiconsIcon icon={PropertyEditIcon} className="w-4 h-4" />}
                        description={`${stats?.overdueLoans || 0} overdue`}
                    />
                </div>
                <div className="shrink-0 w-48 md:w-auto">
                    <StatCard
                        title="Expected This Cycle"
                        value={formatCurrency(parseFloat(String(stats?.expectedThisCycle || 0)))}
                        icon={<HugeiconsIcon icon={Activity01Icon} className="w-4 h-4" />}
                        description="Total due across open cycles"
                    />
                </div>
                <div className="shrink-0 w-48 md:w-auto">
                    <StatCard
                        title="Collected This Month"
                        value={formatCurrency(parseFloat(String(stats?.collectedThisMonth || 0)))}
                        icon={<HugeiconsIcon icon={UserMultipleIcon} className="w-4 h-4" />}
                        description="Since start of month"
                    />
                </div>
            </div>

            {/* Overdue panel — full width, only shown when there are overdues */}
            {overdueLoansList.length > 0 && (
                <OverduePanel overdueLoans={overdueLoansList} />
            )}

            {/* Recent Activity — full width, clean */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="font-semibold">Recent Activity</h2>
                    <Link href="/reports">
                        <Button variant="ghost" size="sm" className="text-zinc-500">View Reports</Button>
                    </Link>
                </div>
                <div className="p-6">
                    <ActivityFeed activity={activity} />
                </div>
            </div>
        </div>
    );
}
