import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getLoan } from "@/core/services/loan-service";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const loan = await getLoan(params.id);
        if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ data: loan });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
