/**
 * @deprecated  This module was the Supabase storage helper.
 * All file uploads now go through UploadThing.
 *
 *  - Upload:     use UploadButton / UploadDropzone from "@/lib/uploadthing"
 *  - Delete:     use UTApi from "uploadthing/server"
 *  - Access URL: use the public ufsUrl returned by onClientUploadComplete
 *                (format: https://<appId>.ufs.sh/f/<key>)
 *
 * This file is kept empty so existing imports don't break instantly;
 * remove it once all consumers have been updated.
 */
export { };
