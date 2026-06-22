import { withAuth } from "@/lib/api";
import { listLoans, createLoanWithCycleAndAudit } from "@/features/loans/service";

export const GET = withAuth(async ({ req }) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "active" | "overdue" | "settled" | null;
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);
    const { data, total } = await listLoans({ status, page, limit });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
});

export const POST = withAuth(async ({ req, user }) => {
    const body = await req.json();
    return { data: await createLoanWithCycleAndAudit(body, user.id) };
}, 400);
