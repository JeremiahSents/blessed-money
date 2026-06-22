import { withAuth } from "@/lib/api";
import { listCustomers, createCustomerWithAudit } from "@/features/customers/service";

export const GET = withAuth(async ({ req }) => {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);
    const { data, total } = await listCustomers({
        search: searchParams.get("search") ?? "",
        page,
        limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
});

export const POST = withAuth(async ({ req, user }) => {
    const body = await req.json();
    const data = await createCustomerWithAudit({
        userId: user.id,
        name: body.name,
        phone: body.phone,
        notes: body.notes,
    });
    return { data };
}, 400);
