"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SignedImage } from "@/components/shared/signed-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, Delete02Icon, PropertyEditIcon } from '@hugeicons/core-free-icons';
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
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

    return (
        <>
            <Card className="overflow-hidden">
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-base font-semibold">{item.description}</CardTitle>
                            {item.serialNumber && (
                                <p className="text-xs text-zinc-500 mt-1">SN: {item.serialNumber}</p>
                            )}
                        </div>
                        {item.returnedAt ? (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                                Returned
                            </Badge>
                        ) : (
                            <Badge variant="outline">Held</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-zinc-500">Value</div>
                        <div className="font-medium text-right">{item.estimatedValue ? formatCurrency(parseFloat(item.estimatedValue)) : "-"}</div>

                        {item.returnedAt && (
                            <>
                                <div className="text-zinc-500">Returned On</div>
                                <div className="font-medium text-right text-emerald-600">{formatDate(item.returnedAt)}</div>
                            </>
                        )}

                        {item.notes && (
                            <div className="col-span-2 mt-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                {item.notes}
                            </div>
                        )}
                    </div>

                    {item.imagePaths && item.imagePaths.length > 0 && (
                        <div className="space-y-2 mt-4">
                            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Documents</h4>
                            <div className="flex flex-wrap gap-2">
                                {item.imagePaths.map((path: string) => {
                                    const isPdf = path.toLowerCase().endsWith(".pdf");
                                    return (
                                        <div key={path} className="w-16 h-16 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-50 flex items-center justify-center cursor-pointer group hover:border-black transition-colors">
                                            {isPdf ? (
                                                <HugeiconsIcon icon={PropertyEditIcon} className="w-6 h-6 text-zinc-400 group-hover:text-black transition-colors" />
                                            ) : (
                                                <SignedImage bucket="collateral-docs" path={path} className="w-full h-full object-cover" alt="Collateral Document" />
                                            )}
                                            <a href={`/api/storage/download?path=${encodeURIComponent(path)}`} className="absolute inset-0" target="_blank" rel="noopener noreferrer">
                                                <span className="sr-only">View</span>
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setIsDeleting(true)}
                    >
                        <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4 mr-2" />
                        Delete
                    </Button>

                    {!item.returnedAt && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsReturning(true)}
                        >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 mr-2" />
                            Mark Returned
                        </Button>
                    )}
                </CardFooter>
            </Card>

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
