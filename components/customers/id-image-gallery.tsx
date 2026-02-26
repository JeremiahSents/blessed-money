"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SignedImage } from "@/components/shared/signed-image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getErrorMessage } from "@/lib/errors";

export function IdImageGallery({ customerId, paths = [] }: { customerId: string, paths: string[] }) {
    const queryClient = useQueryClient();
    const [deletePath, setDeletePath] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: async (path: string) => {
            const res = await fetch(`/api/customers/${customerId}/id-images`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path }),
            });
            if (!res.ok) throw new Error("Failed to delete document");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
            toast.success("Document removed");
            setDeletePath(null);
        },
        onError: (err: unknown) => {
            toast.error(getErrorMessage(err));
            setDeletePath(null);
        }
    });

    if (paths.length === 0) {
        return <p className="text-sm text-zinc-500 italic">No ID documents uploaded yet.</p>;
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {paths.map((path) => (
                    <div key={path} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <SignedImage
                            bucket="customer-ids"
                            path={path}
                            className="w-full h-full object-cover"
                            alt="ID Document"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => setDeletePath(path)}
                            >
                                <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={!!deletePath}
                onOpenChange={(open: boolean) => !open && setDeletePath(null)}
                title="Delete Document"
                description="Are you sure you want to delete this document? This action cannot be undone."
                onConfirm={() => deletePath && deleteMutation.mutate(deletePath)}
                isLoading={deleteMutation.isPending}
                variant="destructive"
            />
        </>
    );
}
