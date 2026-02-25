import { createClient } from "@supabase/supabase-js";

// Uses the service role key so this should ONLY ever be called from Server Actions or API routes.
// DO NOT EXPOSE TO CLIENT.
export const storageClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Uploads a file to a specific storage bucket and path.
 * Returns the storage path.
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File
): Promise<string> {
    const { data, error } = await storageClient.storage
        .from(bucket)
        .upload(path, file, {
            upsert: true,
            contentType: file.type,
        });

    if (error) {
        throw new Error(`Failed to upload file to ${bucket}/${path}: ${error.message}`);
    }

    return data.path;
}

/**
 * Gets a signed URL for secure short-term access to a file.
 * Requires the file path and bucket name.
 */
export async function getSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number = 3600 // 1 hour default
): Promise<string> {
    const { data, error } = await storageClient.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
        throw new Error(`Failed to generate signed URL for ${bucket}/${path}: ${error?.message}`);
    }

    return data.signedUrl;
}

/**
 * Deletes a file from storage.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await storageClient.storage.from(bucket).remove([path]);
    if (error) {
        throw new Error(`Failed to delete file ${bucket}/${path}: ${error.message}`);
    }
}
