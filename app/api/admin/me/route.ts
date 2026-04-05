import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isUserAdmin } from "@/core/services/business-service";

// GET /api/admin/me — check if current user is admin
export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ isAdmin: false });

    const admin = await isUserAdmin(session.user.id);
    return NextResponse.json({ isAdmin: admin });
}
