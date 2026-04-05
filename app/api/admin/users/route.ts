import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/errors";
import { isUserAdmin, listAllUsers, setUserAdminRole } from "@/core/services/business-service";

// GET /api/admin/users — list all users (admin only)
export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await isUserAdmin(session.user.id);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const users = await listAllUsers();
        return NextResponse.json({ data: users });
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}

// PATCH /api/admin/users — assign/revoke admin role
export async function PATCH(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await isUserAdmin(session.user.id);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const { userId, isAdmin } = await req.json();
        if (!userId || typeof isAdmin !== "boolean") {
            return NextResponse.json({ error: "userId and isAdmin (boolean) are required" }, { status: 400 });
        }
        // Prevent self-demotion
        if (userId === session.user.id && !isAdmin) {
            return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
        }
        const updated = await setUserAdminRole(userId, isAdmin);
        return NextResponse.json({ data: updated });
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}
