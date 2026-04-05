import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/errors";
import { listCustomers, createCustomerWithAudit } from "@/core/services/customer-service";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    try {
        const { data, total } = await listCustomers({ search, page, limit });

        return NextResponse.json({
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();

        const newCustomer = await createCustomerWithAudit({
            userId: session.user.id,
            name: body.name,
            phone: body.phone,
            email: body.email,
            nationalIdType: body.nationalIdType,
            nationalIdNumber: body.nationalIdNumber,
            nationalIdExpiry: body.nationalIdExpiry
                ? new Date(body.nationalIdExpiry).toISOString().split("T")[0]
                : null,
            notes: body.notes,
            nationalIdImagePaths: body.nationalIdImagePaths || [],
        });

        return NextResponse.json({ data: newCustomer });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
    }
}
