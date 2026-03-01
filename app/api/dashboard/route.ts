import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/errors";
import { getDashboardData } from "@/core/services/dashboard-service";
import { resolveBusinessForUser } from "@/core/services/business-service";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const business = await resolveBusinessForUser(session.user.id);
        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
        const data = await getDashboardData(business.id);
        return NextResponse.json({ data });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}
