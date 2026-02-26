import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { rolloverOverdueCycles } from "@/core/services/cron-service";

export async function POST(req: NextRequest) {
    // Secured by CRON_SECRET
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const count = await rolloverOverdueCycles();
        return NextResponse.json({ message: "Rollover complete", count });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}
