import { NextResponse } from "next/server";
import db from "@/src/index";
import { payments } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { desc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/errors";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await db.query.payments.findMany({
            orderBy: [desc(payments.paidAt), desc(payments.createdAt)],
            with: {
                loan: {
                    with: {
                        customer: true
                    }
                }
            }
        });

        return NextResponse.json({ data });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}
