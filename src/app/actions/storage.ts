"use server";

import { getSignedUrl } from "@/lib/storage";

export async function getSignedUrlAction(bucket: string, path: string) {
    try {
        const url = await getSignedUrl(bucket, path);
        return { url };
    } catch (e: any) {
        return { error: true, message: e.message };
    }
}
