import { withAuth } from "@/lib/api";
import { getCustomer, updateCustomerWithAudit } from "@/features/customers/service";

export const GET = withAuth(async ({ params }) => {
    const customer = await getCustomer(params.id);
    if (!customer) throw new Error("Customer not found");
    return { data: customer };
});

export const PUT = withAuth(async ({ req, params, user }) => {
    const body = await req.json();
    const data = await updateCustomerWithAudit(
        params.id,
        { name: body.name, phone: body.phone, notes: body.notes },
        user.id,
    );
    return { data };
}, 400);
