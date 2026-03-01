import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createInitialBusiness } from "@/core/services/onboarding-service";
import { getErrorMessage } from "@/lib/errors";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, workingCapital } = body;

        if (!name || workingCapital === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const business = await createInitialBusiness(session.user.id, {
            name,
            workingCapital: String(workingCapital),
        });

        return NextResponse.json({
            success: true,
            business,
        });
    } catch (error) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
