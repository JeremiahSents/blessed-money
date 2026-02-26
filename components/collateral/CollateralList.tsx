"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollateralItemCard } from "./CollateralItemCard";
import { CollateralUploader, CollateralFormData } from "./CollateralUploader";
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CollateralItem } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

export function CollateralList({ loanId, items = [] }: { loanId: string; items: CollateralItem[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const queryClient = useQueryClient();

    const addMutation = useMutation({
        mutationFn: async (data: CollateralFormData) => {
            // 1. Upload files first if any
            if (data.files.length > 0) {
                // We'll call the direct image upload API for a dummy ID first, 
                // OR better: we create the item first, then upload images to it.
                const res1 = await fetch(`/api/loans/${loanId}/collateral`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        description: data.description,
                        estimatedValue: data.estimatedValue,
                        serialNumber: data.serialNumber,
                        notes: data.notes,
                        imagePaths: [] // Will insert later
                    })
                });
                if (!res1.ok) throw new Error("Failed to create collateral item");
                const newItem = await res1.json();

                // 2. Upload Images
                const formData = new FormData();
                data.files.forEach(f => formData.append("files", f));

                const res2 = await fetch(`/api/loans/${loanId}/collateral/${newItem.data.id}/images`, {
                    method: "POST",
                    body: formData
                });
                if (!res2.ok) throw new Error("Failed to upload files");

                return;
            }

            // No files, just create
            const res = await fetch(`/api/loans/${loanId}/collateral`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: data.description,
                    estimatedValue: data.estimatedValue,
                    serialNumber: data.serialNumber,
                    notes: data.notes,
                })
            });
            if (!res.ok) throw new Error("Failed to create collateral");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
            toast.success("Collateral added");
            setIsAdding(false);
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err))
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold tracking-tight">Collateral</h3>
                {!isAdding && (
                    <Button size="sm" onClick={() => setIsAdding(true)}>
                        <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white p-1 rounded-xl shadow-sm border border-zinc-200">
                    <CollateralUploader
                        onCancel={() => setIsAdding(false)}
                        onAdd={(data) => addMutation.mutate(data)}
                    />
                </div>
            )}

            {items.length === 0 && !isAdding ? (
                <div className="text-center py-8 border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                    <p className="text-sm text-zinc-500">No collateral recorded for this loan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(item => (
                        <CollateralItemCard key={item.id} item={item} loanId={loanId} />
                    ))}
                </div>
            )}
        </div>
    );
}
