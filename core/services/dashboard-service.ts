import {
    getDashboardStats,
    getRecentActivity,
    getOverdueList,
} from "@/core/repositories/dashboard-repository";

export async function getDashboardData(businessId: string) {
    const [stats, { recentPayments, recentLoans }, overdueLoansList] =
        await Promise.all([
            getDashboardStats(businessId),
            getRecentActivity(businessId),
            getOverdueList(businessId),
        ]);

    const activity = [
        ...recentPayments.map((p) => ({ type: "PAYMENT", date: p.createdAt, data: p })),
        ...recentLoans.map((l) => ({ type: "LOAN", date: l.createdAt, data: l })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    return { stats, activity, overdueLoansList };
}
