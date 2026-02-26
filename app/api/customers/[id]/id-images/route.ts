import { NextRequest, NextResponse } from "next/server";
import db from "@/core/db/index";
import { customers, auditLogs } from "@/core/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * POST /api/customers/[id]/id-images
 * Body: { urls: string[] }  — public UploadThing URLs returned from onClientUploadComplete
 * Persists the UploadThing file URLs into the customer's nationalIdImagePaths array.
 */
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json() as { urls: string[] };
        const { urls } = body;

        if (!urls || urls.length === 0) {
            return NextResponse.json({ error: "No file URLs provided" }, { status: 400 });
        }

        const updatedCustomer = await db.transaction(async (tx) => {
            const customer = await tx.query.customers.findFirst({
                where: eq(customers.id, params.id),
            });

            if (!customer) throw new Error("Customer not found");

            const newPaths = [...(customer.nationalIdImagePaths || []), ...urls];

            const [afterState] = await tx
                .update(customers)
                .set({ nationalIdImagePaths: newPaths })
                .where(eq(customers.id, params.id))
                .returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "CUSTOMER_ID_UPLOADED",
                entityType: "customer",
                entityId: params.id,
                metadata: { addedUrls: urls, after: afterState },
            });

            return afterState;
        });

        return NextResponse.json({ data: updatedCustomer });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

/**
 * DELETE /api/customers/[id]/id-images
 * Body: { url: string }  — the UploadThing URL to remove
 * Deletes the file from UploadThing and removes the URL from the DB.
 */
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { url } = await req.json() as { url: string };
        if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

        // Extract the file key from the UploadThing URL  (<appId>.ufs.sh/f/<key>)
        const key = url.split("/f/").at(-1);
        if (!key) return NextResponse.json({ error: "Invalid UploadThing URL" }, { status: 400 });

        // Delete from UploadThing storage
        await utapi.deleteFiles([key]);

        // Remove from database
        const updatedCustomer = await db.transaction(async (tx) => {
            const customer = await tx.query.customers.findFirst({
                where: eq(customers.id, params.id),
            });
            if (!customer) throw new Error("Customer not found");

            const newPaths = (customer.nationalIdImagePaths || []).filter((u) => u !== url);

            const [afterState] = await tx
                .update(customers)
                .set({ nationalIdImagePaths: newPaths })
                .where(eq(customers.id, params.id))
                .returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "CUSTOMER_ID_DELETED",
                entityType: "customer",
                entityId: params.id,
                metadata: { deletedUrl: url, after: afterState },
            });

            return afterState;
        });

        return NextResponse.json({ data: updatedCustomer });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
