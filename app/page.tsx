import { StatCard } from "@/components/dashboard/stat-card";
import { OverduePanel } from "@/components/dashboard/overdue-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { formatCurrency } from "@/lib/utils";
import { HugeiconsIcon } from '@hugeicons/react';
import { UserMultipleIcon, Wallet01Icon, Activity01Icon, PropertyEditIcon } from '@hugeicons/core-free-icons';
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
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-end mb-8">
                <Link href="/loans/new">
                    <Button>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        New Loan
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Working Capital"
                    value={formatCurrency(parseFloat(String(stats?.workingCapitalCurrent || 0)))}
                    icon={<HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />}
                    description={`Base: ${formatCurrency(parseFloat(String(stats?.workingCapitalBase || 0)))}`}
                />
                <StatCard
                    title="Active Loans"
                    value={stats?.activeLoans || 0}
                    icon={<HugeiconsIcon icon={PropertyEditIcon} className="w-4 h-4" />}
                    description={`${stats?.overdueLoans || 0} currently overdue`}
                />
                <StatCard
                    title="Capital Outstanding"
                    value={formatCurrency(parseFloat(String(stats?.capitalOutstanding || 0)))}
                    icon={<HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />}
                />
                <StatCard
                    title="Expected This Cycle"
                    value={formatCurrency(parseFloat(String(stats?.expectedThisCycle || 0)))}
                    icon={<HugeiconsIcon icon={Activity01Icon} className="w-4 h-4" />}
                    description="Total due across open cycles"
                />
                <StatCard
                    title="Collected This Month"
                    value={formatCurrency(parseFloat(String(stats?.collectedThisMonth || 0)))}
                    icon={<HugeiconsIcon icon={UserMultipleIcon} className="w-4 h-4" />}
                    description="Since start of month"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
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

                <div className="lg:col-span-1 space-y-6">
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
