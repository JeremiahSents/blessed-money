import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { loans } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const loan = await db.query.loans.findFirst({
            where: eq(loans.id, params.id),
            with: {
                customer: true,
                collateral: true,
                billingCycles: {
                    orderBy: (cycles, { asc }) => [asc(cycles.cycleNumber)],
                },
                payments: {
                    orderBy: (payments, { desc }) => [desc(payments.paidAt)],
                }
            }
        });

        if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ data: loan });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
