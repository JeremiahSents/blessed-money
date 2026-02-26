"use server";

import { getSignedUrl } from "@/lib/storage";
import { getErrorMessage } from "@/lib/errors";

export async function getSignedUrlAction(bucket: string, path: string) {
    try {
        const url = await getSignedUrl(bucket, path);
        return { url };
    } catch (e: unknown) {
        return { error: true, message: getErrorMessage(e) };
    }
}
