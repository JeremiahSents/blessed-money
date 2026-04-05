"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SignedImage } from "@/components/shared/signed-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HugeiconsIcon } from '@hugeicons/react';
import { 
    CheckmarkCircle02Icon, 
    Delete02Icon, 
    PropertyEditIcon, 
    File01Icon, 
    Link01Icon, 
    ViewIcon, 
    InformationCircleIcon
} from '@hugeicons/core-free-icons';
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import type { CollateralItem } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

export function CollateralItemCard({ item, loanId }: { item: CollateralItem; loanId: string }) {
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReturning, setIsReturning] = useState(false);

    const updateMutation = useMutation({
        mutationFn: async (payload: { markReturned: true } | Partial<Pick<CollateralItem, "description" | "estimatedValue" | "serialNumber" | "notes">>) => {
            const res = await fetch(`/api/loans/${loanId}/collateral/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
            toast.success("Collateral updated");
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
        onSettled: () => setIsReturning(false)
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/loans/${loanId}/collateral/${item.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
            toast.success("Collateral deleted");
            setIsDeleting(false);
        },
        onError: (err: unknown) => {
            toast.error(getErrorMessage(err));
            setIsDeleting(false);
        }
    });

    const isReturned = !!item.returnedAt;

    return (
        <>
            <div className="group relative bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all duration-200 overflow-hidden">
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate uppercase">
                                {item.description}
                            </h4>
                            {item.serialNumber && (
                                <p className="text-[10px] font-semibold text-zinc-400 mt-1 uppercase bg-zinc-100 dark:bg-zinc-900 w-fit px-1.5 py-0.5 rounded-md">
                                    SN: {item.serialNumber}
                                </p>
                            )}
                        </div>
                        <Badge 
                            variant={isReturned ? "secondary" : "outline"}
                            className={cn(
                                "text-[9px] px-2 py-0 h-4 font-semibold uppercase border-none",
                                isReturned 
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            )}
                        >
                            {isReturned ? "Returned" : "Held"}
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-zinc-400 uppercase text-[9px] font-semibold">Estimated Value</span>
                            <span className="text-zinc-900 dark:text-white font-semibold tabular-nums">
                                {item.estimatedValue ? formatCurrency(parseFloat(item.estimatedValue)) : "Unknown"}
                            </span>
                        </div>

                        {isReturned && (
                            <div className="flex items-center justify-between text-xs font-medium px-2 py-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10">
                                <span className="text-emerald-600/70 uppercase text-[9px] font-semibold">Returned On</span>
                                <span className="text-emerald-600 font-semibold tabular-nums">{formatDate(item.returnedAt!)}</span>
                            </div>
                        )}

                        {item.notes && (
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <HugeiconsIcon icon={InformationCircleIcon} className="w-3 h-3 text-zinc-400" />
                                    <span className="text-[9px] font-semibold uppercase text-zinc-400">Notes</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium italic">
                                    "{item.notes}"
                                </p>
                            </div>
                        )}

                        {item.imagePaths && item.imagePaths.length > 0 && (
                            <div className="pt-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <HugeiconsIcon icon={File01Icon} className="w-3 h-3 text-zinc-400" />
                                    <span className="text-[9px] font-semibold uppercase text-zinc-400">Files ({item.imagePaths.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {item.imagePaths.map((path: string, i: number) => {
                                        const isPdf = path.toLowerCase().endsWith(".pdf");
                                        return (
                                            <a 
                                                key={path} 
                                                href={`/api/storage/download?path=${encodeURIComponent(path)}`}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="group/file relative flex shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 items-center justify-center hover:border-primary transition-all shadow-sm"
                                            >
                                                {isPdf ? (
                                                    <div className="flex flex-col items-center">
                                                        <HugeiconsIcon icon={PropertyEditIcon} className="w-4 h-4 text-red-500" />
                                                        <span className="text-[6px] font-semibold uppercase text-red-600">PDF</span>
                                                    </div>
                                                ) : (
                                                    <SignedImage bucket="collateral-docs" path={path} className="w-full h-full object-cover opacity-80 group-hover/file:opacity-100 transition-opacity" alt={`Doc ${i+1}`} />
                                                )}
                                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/file:opacity-100 flex items-center justify-center transition-all">
                                                    <HugeiconsIcon icon={ViewIcon} className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="h-8 rounded-lg px-2 text-[10px] font-semibold uppercase text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            onClick={() => setIsDeleting(true)}
                        >
                            <HugeiconsIcon icon={Delete02Icon} className="w-3 h-3 mr-1.5" />
                            Delete
                        </Button>

                        {!isReturned && (
                            <Button
                                variant="secondary"
                                className="h-8 rounded-xl px-4 text-[10px] font-semibold uppercase flex-1 max-w-[120px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-all"
                                onClick={() => setIsReturning(true)}
                            >
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3 h-3 mr-1.5" />
                                Return
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={isDeleting}
                onOpenChange={setIsDeleting}
                title="Delete Collateral"
                description="Are you sure you want to delete this collateral item? All associated files will also be permanently deleted."
                onConfirm={() => deleteMutation.mutate()}
                isLoading={deleteMutation.isPending}
                variant="destructive"
            />

            <ConfirmDialog
                open={isReturning}
                onOpenChange={setIsReturning}
                title="Mark as Returned"
                description="Confirm that you have returned this item to the customer. This action will record today's date."
                onConfirm={() => updateMutation.mutate({ markReturned: true })}
                isLoading={updateMutation.isPending}
            />
        </>
    );
}
