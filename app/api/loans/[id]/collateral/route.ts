import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { addCollateral } from "@/core/services/collateral-service";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();

        const newCollateral = await addCollateral(
            params.id,
            {
                description: body.description,
                estimatedValue: body.estimatedValue
                    ? Number(body.estimatedValue).toFixed(2)
                    : null,
                serialNumber: body.serialNumber,
                imagePaths: body.imagePaths || [],
                notes: body.notes,
            },
            session.user.id
        );

        return NextResponse.json({ data: newCollateral });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
