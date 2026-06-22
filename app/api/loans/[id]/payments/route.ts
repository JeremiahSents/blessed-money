import { withAuth } from "@/lib/api";
import { recordPayment } from "@/features/payments/service";

export const POST = withAuth(async ({ req, params, user }) => {
    const body = await req.json();
    return { data: await recordPayment(params.id, body, user.id) };
}, 400);
