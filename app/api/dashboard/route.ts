import { withAuth } from "@/lib/api";
import { getDashboardData } from "@/features/dashboard/service";

export const GET = withAuth(async () => ({ data: await getDashboardData() }));
