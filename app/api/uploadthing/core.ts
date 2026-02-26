import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

export const ourFileRouter = {
    /**
     * Customer national ID documents.
     * Accepts images (JPG/PNG) and PDFs up to 5 MB, max 5 files at a time.
     * Input carries the customer ID so it can be persisted server-side after upload.
     */
    customerIdUploader: f({
        image: { maxFileSize: "4MB", maxFileCount: 5 },
        "application/pdf": { maxFileSize: "4MB", maxFileCount: 5 },
    })
        .middleware(async () => {
            const session = await auth.api.getSession({ headers: await headers() });
            if (!session?.user) throw new UploadThingError("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // Return the public URL so the client can persist it in the database
            return { url: file.ufsUrl, key: file.key, uploadedBy: metadata.userId };
        }),

    /**
     * Collateral document images.
     * Accepts images (JPG/PNG) and PDFs up to 10 MB, max 10 files at a time.
     */
    collateralUploader: f({
        image: { maxFileSize: "8MB", maxFileCount: 10 },
        "application/pdf": { maxFileSize: "8MB", maxFileCount: 10 },
    })
        .middleware(async () => {
            const session = await auth.api.getSession({ headers: await headers() });
            if (!session?.user) throw new UploadThingError("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.ufsUrl, key: file.key, uploadedBy: metadata.userId };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
