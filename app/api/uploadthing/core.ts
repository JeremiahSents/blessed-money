import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

export const ourFileRouter = {
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
