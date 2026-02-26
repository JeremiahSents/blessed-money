import { NextResponse } from "next/server";

/**
 * @deprecated  Supabase signed URLs are no longer used.
 * UploadThing files are served from a public CDN at https://<appId>.ufs.sh/f/<key>.
 * No signing is required. This endpoint is kept to avoid 404s on any cached requests.
 */
export async function GET() {
    return NextResponse.json(
        { error: "This endpoint is deprecated. UploadThing files are public CDN URLs and do not require signing." },
        { status: 410 }
    );
}
