"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollateralItemCard } from "./collateral-item-card";
import { CollateralUploader, CollateralFormData } from "./collateral-uploader";
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Shield01Icon } from '@hugeicons/core-free-icons';
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
            {!isAdding ? (
                <div className="flex justify-end">
                    <Button 
                        size="sm" 
                        variant="secondary"
                        className="h-9 rounded-xl text-xs font-semibold px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                        onClick={() => setIsAdding(true)}
                    >
                        <HugeiconsIcon icon={PlusSignIcon} className="w-3.5 h-3.5 mr-2" />
                        Add Security Item
                    </Button>
                </div>
            ) : (
                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
                    <CollateralUploader
                        onCancel={() => setIsAdding(false)}
                        onAdd={(data) => addMutation.mutate(data)}
                    />
                </div>
            )}

            {items.length === 0 && !isAdding ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-200 dark:text-zinc-800 mb-4">
                        <HugeiconsIcon icon={Shield01Icon} className="w-12 h-12" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">No security items found</p>
                    <p className="text-xs text-zinc-400 font-medium max-w-[200px] mx-auto">Add items like logbooks or electronics to secure this loan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {items.map(item => (
                        <CollateralItemCard key={item.id} item={item} loanId={loanId} />
                    ))}
                </div>
            )}
        </div>
    );
}
