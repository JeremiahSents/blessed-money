import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { customers, auditLogs } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { uploadFile, deleteFile as deleteStorageFile } from "@/lib/storage";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const uploadedPaths: string[] = [];

        // Validations & Uploads
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                throw new Error(`File ${file.name} exceeds 5MB limit`);
            }
            if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
                throw new Error(`File ${file.name} has invalid type ${file.type}`);
            }

            const ext = file.name.split('.').pop();
            const timestamp = Date.now();
            const path = `${session.user.id}/${params.id}/id-${timestamp}.${ext}`;

            const uploadedPath = await uploadFile('customer-ids', path, file);
            uploadedPaths.push(uploadedPath);
        }

        // Update customer in transaction
        const updatedCustomer = await db.transaction(async (tx) => {
            const customer = await tx.query.customers.findFirst({
                where: eq(customers.id, params.id)
            });

            if (!customer) throw new Error("Customer not found");

            const newPaths = [...(customer.nationalIdImagePaths || []), ...uploadedPaths];

            const [afterState] = await tx.update(customers)
                .set({ nationalIdImagePaths: newPaths })
                .where(eq(customers.id, params.id))
                .returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "CUSTOMER_ID_UPLOADED",
                entityType: "customer",
                entityId: params.id,
                metadata: { addedPaths: uploadedPaths, after: afterState }
            });

            return afterState;
        });

        return NextResponse.json({ data: updatedCustomer });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { path } = await req.json();
        if (!path) return NextResponse.json({ error: "Path to delete is required" }, { status: 400 });

        // First delete from storage bucket
        await deleteStorageFile('customer-ids', path);

        // Then update database
        const updatedCustomer = await db.transaction(async (tx) => {
            const customer = await tx.query.customers.findFirst({
                where: eq(customers.id, params.id)
            });
            if (!customer) throw new Error("Customer not found");

            const newPaths = (customer.nationalIdImagePaths || []).filter(p => p !== path);

            const [afterState] = await tx.update(customers)
                .set({ nationalIdImagePaths: newPaths })
                .where(eq(customers.id, params.id))
                .returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "CUSTOMER_ID_DELETED",
                entityType: "customer",
                entityId: params.id,
                metadata: { deletedPath: path, after: afterState }
            });

            return afterState;
        });

        return NextResponse.json({ data: updatedCustomer });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
