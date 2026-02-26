import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSignedUrl } from "@/lib/storage";
import { getErrorMessage } from "@/lib/errors";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const bucket = searchParams.get("bucket");
        const path = searchParams.get("path");
        const expires = searchParams.get("expires");

        if (!bucket || !path) {
            return NextResponse.json({ error: "bucket and path are required" }, { status: 400 });
        }

        const expiresInSeconds = expires ? Number(expires) : undefined;
        if (expiresInSeconds !== undefined && (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0)) {
            return NextResponse.json({ error: "expires must be a positive number (seconds)" }, { status: 400 });
        }

        const url = await getSignedUrl(bucket, path, expiresInSeconds ?? 3600);
        return NextResponse.json({ url });
    } catch (e: unknown) {
        return NextResponse.json({ error: true, message: getErrorMessage(e) }, { status: 400 });
    }
}
