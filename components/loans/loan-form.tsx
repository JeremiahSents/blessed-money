"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CollateralUploader, CollateralFormData } from "../collateral/collateral-uploader";
import { useState } from "react";
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, UserIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { addMonths } from "date-fns";
import type { Customer } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

const loanSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    principalAmount: z.string().min(1, "Principal is required"),
    interestRate: z.string().min(1, "Interest rate is required"),
    startDate: z.string().min(1, "Start date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    notes: z.string().optional(),
});

type LoanFormValues = z.infer<typeof loanSchema>;

export function LoanForm() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [collateralItems, setCollateralItems] = useState<CollateralFormData[]>([]);
    const [isAddingCollateral, setIsAddingCollateral] = useState(false);

    const { data: customersData } = useQuery<{ data: Customer[] }>({
        queryKey: ['customers', '', 1],
        queryFn: async () => {
            const res = await fetch(`/api/customers?limit=100`);
            return res.json();
        }
    });

    const generateDefaultDueDate = (startDate: string) => {
        if (!startDate) return "";
        try {
            return addMonths(new Date(startDate), 1).toISOString().split('T')[0];
        } catch {
            return "";
        }
    }

    const form = useForm<LoanFormValues>({
        resolver: zodResolver(loanSchema),
        defaultValues: {
            customerId: "",
            principalAmount: "",
            interestRate: "0.20", // Default 20%
            startDate: new Date().toISOString().split('T')[0],
            dueDate: generateDefaultDueDate(new Date().toISOString().split('T')[0]),
            notes: "",
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: LoanFormValues) => {
            // Create loan first, then create collateral items (and upload images) against the loan.
            const res1 = await fetch(`/api/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, collateralItems: [] }),
            });

            if (!res1.ok) {
                const err = await res1.json();
                throw new Error(err.error || "Failed to create loan");
            }

            const loanData = await res1.json();
            const newLoanId = loanData.data.id;

            for (const item of collateralItems) {
                // Create item first
                const cRes = await fetch(`/api/loans/${newLoanId}/collateral`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        description: item.description,
                        estimatedValue: item.estimatedValue,
                        serialNumber: item.serialNumber,
                        notes: item.notes,
                    })
                });
                const cData = await cRes.json();

                // Upload files if any
                if (item.files.length > 0) {
                    const formData = new FormData();
                    item.files.forEach(f => formData.append("files", f));
                    await fetch(`/api/loans/${newLoanId}/collateral/${cData.data.id}/images`, {
                        method: "POST",
                        body: formData
                    });
                }
            }

            return newLoanId;
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            toast.success("Loan created successfully");
            router.push(`/loans/${id}`);
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        }
    });

    const onSubmit = (values: LoanFormValues) => {
        mutation.mutate(values);
    };

    const handleAddCollateral = (data: CollateralFormData) => {
        setCollateralItems([...collateralItems, data]);
        setIsAddingCollateral(false);
    };

    const removeCollateral = (index: number) => {
        setCollateralItems(collateralItems.filter((_, i) => i !== index));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Form {...form}>
                    <form id="loan-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-xl font-semibold mb-4">Loan Details</h2>

                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">Customer <span className="text-red-500">*</span></FormLabel>
                                    <Select
                                        onValueChange={(val) => {
                                            if (val === "__new__") {
                                                router.push("/customers/new?returnTo=/loans/new");
                                                return;
                                            }
                                            field.onChange(val);
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full h-11 px-3 gap-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all shadow-sm">
                                                <HugeiconsIcon icon={UserIcon} className="size-4 text-zinc-400 shrink-0" />
                                                <SelectValue placeholder="Select a customer" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700">
                                            <SelectGroup>
                                                <SelectItem
                                                    value="__new__"
                                                    className="mx-1 my-1 rounded-lg cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 focus:bg-emerald-100 dark:focus:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-semibold"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 shrink-0">
                                                            <HugeiconsIcon icon={PlusSignIcon} className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                        </span>
                                                        <span className="flex flex-col">
                                                            <span className="text-sm leading-tight">Add New Customer</span>
                                                            <span className="text-xs font-normal text-emerald-600/70 dark:text-emerald-500/70 leading-tight">Create a customer profile first</span>
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            </SelectGroup>
                                            {customersData?.data && customersData.data.length > 0 && (
                                                <>
                                                    <SelectSeparator />
                                                    <SelectGroup>
                                                        <SelectLabel className="px-3 py-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wide">Existing Customers</SelectLabel>
                                                        {customersData.data.map((c) => (
                                                            <SelectItem key={c.id} value={c.id} className="mx-1 rounded-lg">
                                                                <span className="flex flex-col">
                                                                    <span className="font-medium">{c.name}</span>
                                                                    {c.phone && <span className="text-xs text-zinc-400">{c.phone}</span>}
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="principalAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Principal Amount (UGX) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="5000.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="interestRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly Interest Rate (Decimal) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.001" placeholder="0.20" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-zinc-500">Ex: 0.20 is 20%</p>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} onChange={(e) => {
                                                field.onChange(e);
                                                form.setValue("dueDate", generateDefaultDueDate(e.target.value));
                                            }} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Payment Due <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Internal Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Purpose of loan, agreements..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Collateral</h2>
                        {!isAddingCollateral && (
                            <Button size="sm" variant="outline" onClick={() => setIsAddingCollateral(true)}>Add Item</Button>
                        )}
                    </div>

                    {isAddingCollateral && (
                        <CollateralUploader
                            onAdd={handleAddCollateral}
                            onCancel={() => setIsAddingCollateral(false)}
                        />
                    )}

                    {collateralItems.length === 0 && !isAddingCollateral && (
                        <p className="text-sm text-zinc-500 italic">No collateral added.</p>
                    )}

                    <div className="space-y-3">
                        {collateralItems.map((item, idx) => (
                            <div key={idx} className="p-3 border rounded-lg bg-zinc-50 relative group">
                                <h4 className="font-medium text-sm">{item.description}</h4>
                                <p className="text-xs text-zinc-500">Value: {item.estimatedValue ? `UGX ${Number(item.estimatedValue).toLocaleString()}` : "N/A"} • Files: {item.files.length}</p>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                                    onClick={() => removeCollateral(idx)}
                                >
                                    <HugeiconsIcon icon={Delete02Icon} className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <Button type="submit" form="loan-form" className="w-full text-lg py-6" disabled={mutation.isPending}>
                    {mutation.isPending ? "Processing..." : "Issue Loan & Start Cycle"}
                </Button>
            </div>
        </div>
    );
}
