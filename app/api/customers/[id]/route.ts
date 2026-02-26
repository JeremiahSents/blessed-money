import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCustomer, updateCustomerWithAudit } from "@/core/services/customer-service";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const customer = await getCustomer(params.id);
        if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ data: customer });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();

        const updatedCustomer = await updateCustomerWithAudit(
            params.id,
            {
                name: body.name,
                phone: body.phone,
                email: body.email,
                nationalIdType: body.nationalIdType,
                nationalIdNumber: body.nationalIdNumber,
                nationalIdExpiry: body.nationalIdExpiry
                    ? new Date(body.nationalIdExpiry).toISOString().split("T")[0]
                    : null,
                notes: body.notes,
            },
            session.user.id
        );

        return NextResponse.json({ data: updatedCustomer });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
