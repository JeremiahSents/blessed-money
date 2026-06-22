import { withAuth } from "@/lib/api";
import { listPayments } from "@/features/payments/service";

export const GET = withAuth(async () => ({ data: await listPayments() }));
