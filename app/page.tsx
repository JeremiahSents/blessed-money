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
import { resolveBusinessForUser } from "@/core/services/business-service";
import { getDashboardData } from "@/core/services/dashboard-service";

export default async function DashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        redirect("/signin");
    }

    const business = await resolveBusinessForUser(session.user.id);
    if (!business) {
        redirect("/onboarding");
    }

    const { stats, activity, overdueLoansList } = await getDashboardData(business.id);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Mobile Quick Actions — horizontal scroll pill row */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:hidden scrollbar-hide">
                <Link href="/loans/new" className="shrink-0">
                    <Button size="sm" className="rounded-full whitespace-nowrap">
                        <PlusIcon className="w-4 h-4 mr-1.5" />
                        New Loan
                    </Button>
                </Link>
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

            {/* Desktop New Loan button */}
            <div className="hidden md:flex justify-end">
                <Link href="/loans/new">
                    <Button>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        New Loan
                    </Button>
                </Link>
            </div>

            {/* Stat cards — horizontally scrollable on mobile, grid on desktop */}
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-5 md:gap-4 scrollbar-hide">
                <div className="shrink-0 w-52 md:w-auto">
                    <StatCard
                        title="Working Capital"
                        value={formatCurrency(parseFloat(String(stats?.workingCapitalCurrent || 0)))}
                        icon={<HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />}
                        description={`Base: ${formatCurrency(parseFloat(String(stats?.workingCapitalBase || 0)))}`}
                    />
                </div>
                <div className="shrink-0 w-52 md:w-auto">
                    <StatCard
                        title="Active Loans"
                        value={stats?.activeLoans || 0}
                        icon={<HugeiconsIcon icon={PropertyEditIcon} className="w-4 h-4" />}
                        description={`${stats?.overdueLoans || 0} currently overdue`}
                    />
                </div>
                <div className="shrink-0 w-52 md:w-auto">
                    <StatCard
                        title="Capital Outstanding"
                        value={formatCurrency(parseFloat(String(stats?.capitalOutstanding || 0)))}
                        icon={<HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />}
                    />
                </div>
                <div className="shrink-0 w-52 md:w-auto">
                    <StatCard
                        title="Expected This Cycle"
                        value={formatCurrency(parseFloat(String(stats?.expectedThisCycle || 0)))}
                        icon={<HugeiconsIcon icon={Activity01Icon} className="w-4 h-4" />}
                        description="Total due across open cycles"
                    />
                </div>
                <div className="shrink-0 w-52 md:w-auto">
                    <StatCard
                        title="Collected This Month"
                        value={formatCurrency(parseFloat(String(stats?.collectedThisMonth || 0)))}
                        icon={<HugeiconsIcon icon={UserMultipleIcon} className="w-4 h-4" />}
                        description="Since start of month"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* Overdue panel always first — most urgent */}
                    <OverduePanel overdueLoans={overdueLoansList} />

                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Recent Activity</h2>
                            <Link href="/reports">
                                <Button variant="outline" size="sm">View Reports</Button>
                            </Link>
                        </div>
                        <ActivityFeed activity={activity} />
                    </div>
                </div>

                {/* Quick Actions — desktop sidebar only */}
                <div className="hidden lg:block lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                        <div className="flex flex-col gap-3">
                            <Link href="/customers" className="w-full">
                                <Button variant="outline" className="w-full justify-start text-left">
                                    <HugeiconsIcon icon={UserMultipleIcon} className="w-4 h-4 mr-3 text-zinc-500" />
                                    Manage Customers
                                </Button>
                            </Link>
                            <Link href="/payments" className="w-full">
                                <Button variant="outline" className="w-full justify-start text-left">
                                    <HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4 mr-3 text-zinc-500" />
                                    All Payments
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
