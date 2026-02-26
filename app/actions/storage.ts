"use server";

/**
 * UploadThing files are served from a public CDN at:
 *   https://<appId>.ufs.sh/f/<fileKey>
 *
 * The URL returned by onClientUploadComplete (file.ufsUrl) is already the
 * permanent, public URL — no signing or proxying is required.
 *
 * This action is kept for backwards compatibility but simply returns the
 * URL unchanged.  If you later need signed/expiring URLs for private
 * UploadThing files, use UTApi.generateSignedURL() here instead.
 */
export async function getSignedUrlAction(url: string): Promise<{ url: string } | { error: true; message: string }> {
    if (!url) return { error: true, message: "url is required" };
    return { url };
}
