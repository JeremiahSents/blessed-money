import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/errors";
import { updateCollateralItem, removeCollateral } from "@/core/services/collateral-service";

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string; cId: string }> }
) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();

        const updatedItem = await updateCollateralItem(
            params.id,
            params.cId,
            {
                markReturned: body.markReturned,
                description: body.description,
                estimatedValue: body.estimatedValue
                    ? Number(body.estimatedValue).toFixed(2)
                    : null,
                serialNumber: body.serialNumber,
                notes: body.notes,
            },
            session.user.id
        );

        return NextResponse.json({ data: updatedItem });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string; cId: string }> }
) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await removeCollateral(params.id, params.cId, session.user.id);
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
    }
}
