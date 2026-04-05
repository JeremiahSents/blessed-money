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
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, UserIcon, PlusSignIcon, Coins01Icon, Calendar01Icon, MoneyBag01Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { addMonths } from "date-fns";
import type { Customer } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";
import { CustomerForm } from "@/components/customers/customer-form";

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
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);

    const searchParams = useSearchParams();
    const preselectedCustomer = searchParams.get("customer") || "";

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
            interestRate: "20",
            startDate: new Date().toISOString().split('T')[0],
            dueDate: generateDefaultDueDate(new Date().toISOString().split('T')[0]),
            notes: "",
        },
    });

    useEffect(() => {
        if (preselectedCustomer && customersData?.data) {
            const match = customersData.data.find(c => c.id === preselectedCustomer);
            if (match) form.setValue("customerId", match.id);
        }
    }, [customersData, preselectedCustomer, form]);

    const mutation = useMutation({
        mutationFn: async (values: LoanFormValues) => {
            const interestRateDecimal = (parseFloat(values.interestRate) / 100).toFixed(4);

            const res1 = await fetch(`/api/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, interestRate: interestRateDecimal, collateralItems: [] }),
            });

            if (!res1.ok) {
                const err = await res1.json();
                throw new Error(err.error || "Failed to create loan");
            }

            const loanData = await res1.json();
            const newLoanId = loanData.data.id;

            for (const item of collateralItems) {
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
            toast.success("Loan successfully issued!");
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

    const handleCustomerSuccess = (data: any) => {
        const newCustId = data?.data?.id || data?.id;
        if (newCustId) {
            form.setValue("customerId", newCustId);
            toast.success("Customer created and selected.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <CustomerForm 
                open={isCustomerModalOpen} 
                onOpenChange={setCustomerModalOpen} 
                onSuccess={handleCustomerSuccess} 
            />

            <Form {...form}>
                <form id="loan-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* Card 1: Borrower Information */}
                    <div className="bg-white dark:bg-zinc-950/80 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-primary/10"></div>
                        
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                                <HugeiconsIcon icon={UserIcon} className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Borrower Information</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Select an existing customer or create a new one.</p>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Select
                                                onValueChange={(val) => {
                                                    if (val === "__new__") {
                                                        setCustomerModalOpen(true);
                                                        return;
                                                    }
                                                    field.onChange(val);
                                                }}
                                                value={field.value}
                                            >
                                                <SelectTrigger className="w-full h-14 px-4 gap-3 text-base border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all shadow-sm">
                                                    <span className="flex-1 text-left truncate font-medium">
                                                        {field.value
                                                            ? (customersData?.data?.find(c => c.id === field.value)?.name ?? field.value)
                                                            : <span className="text-zinc-400 dark:text-zinc-500 font-normal">Choose a borrower...</span>
                                                        }
                                                    </span>
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl shadow-xl border-zinc-200 dark:border-zinc-800 max-h-[300px]">
                                                    <div className="p-2 sticky top-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md z-10 border-b border-zinc-100 dark:border-zinc-800/50">
                                                        <Button 
                                                            variant="default" 
                                                            className="w-full justify-start h-10 px-3 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setCustomerModalOpen(true);
                                                                // Close the select dropdown by clicking body or managing state, but selecting __new__ handles it gracefully via onValueChange
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white/20 dark:bg-black/20 shrink-0">
                                                                    <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
                                                                </div>
                                                                <span className="font-semibold text-sm">Add New Customer</span>
                                                            </div>
                                                        </Button>
                                                    </div>
                                                    
                                                    {customersData?.data && customersData.data.length > 0 && (
                                                        <SelectGroup className="p-1">
                                                            <SelectLabel className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Existing Customers</SelectLabel>
                                                            {customersData.data.map((c) => (
                                                                <SelectItem key={c.id} value={c.id} className="mx-1 my-0.5 rounded-xl cursor-pointer">
                                                                    <div className="flex flex-col py-0.5">
                                                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.name}</span>
                                                                        {c.phone && <span className="text-xs text-zinc-500">{c.phone}</span>}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage className="ml-1 mt-2" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Card 2: Loan Configuration */}
                    <div className="bg-white dark:bg-zinc-950/80 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md">
                        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-blue-500/10"></div>
                        
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <HugeiconsIcon icon={MoneyBag01Icon} className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Loan Structure</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Define the core terms of the loan.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <FormField
                                control={form.control}
                                name="principalAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Principal Amount (UGX) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-zinc-500 sm:text-sm font-medium">UGX</span>
                                                </div>
                                                <Input 
                                                    type="number" 
                                                    step="1" 
                                                    placeholder="50,000" 
                                                    className="pl-12 h-12 text-lg font-medium rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                                    {...field} 
                                                />
                                            </div>
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
                                        <FormLabel className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Interest Rate / Month <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input 
                                                    type="number" 
                                                    step="1" 
                                                    placeholder="20" 
                                                    className="pr-10 h-12 text-lg font-medium rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                                    {...field} 
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    <span className="text-zinc-500 sm:text-sm font-semibold">%</span>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                            <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 text-zinc-400" />
                                            Start Date <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="date" 
                                                className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-colors"
                                                {...field} 
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    form.setValue("dueDate", generateDefaultDueDate(e.target.value));
                                                }} 
                                            />
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
                                        <FormLabel className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                            <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 text-zinc-400" />
                                            First Payment Due <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="date" 
                                                className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Additional Notes</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Specify loan purpose, agreements, or special conditions..." 
                                                    className="resize-none min-h-[100px] rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Security & Collateral */}
                    <div className="bg-white dark:bg-zinc-950/80 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-500/5 blur-[120px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-orange-500/10"></div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                    <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Collateral Items</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Record items secured against this loan.</p>
                                </div>
                            </div>
                            
                            {!isAddingCollateral && (
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline" 
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                                    onClick={() => setIsAddingCollateral(true)}
                                >
                                    <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-1.5" />
                                    Add Security Item
                                </Button>
                            )}
                        </div>

                        <div className="relative z-10">
                            {isAddingCollateral && (
                                <div className="mb-4">
                                    <CollateralUploader
                                        onAdd={handleAddCollateral}
                                        onCancel={() => setIsAddingCollateral(false)}
                                    />
                                </div>
                            )}

                            {collateralItems.length === 0 && !isAddingCollateral ? (
                                <div className="py-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30">
                                    <HugeiconsIcon icon={Shield01Icon} className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No security items added</p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Add items to lower lending risk</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {collateralItems.map((item, idx) => (
                                        <div key={idx} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 relative group transition-all hover:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-500/5">
                                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{item.description}</h4>
                                            <div className="mt-2 space-y-1">
                                                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                                    Value: {item.estimatedValue ? `UGX ${Number(item.estimatedValue).toLocaleString()}` : "N/A"}
                                                </p>
                                                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                                    Files attached: {item.files.length}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-3 right-3 w-7 h-7 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all rounded-full shadow-sm"
                                                onClick={() => removeCollateral(idx)}
                                            >
                                                <HugeiconsIcon icon={Delete02Icon} className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end">
                        <Button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="w-full sm:w-auto h-14 px-8 text-base font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xl shadow-black/10 dark:shadow-white/10 transition-all active:scale-[0.98]"
                        >
                            {mutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></div>
                                    Processing Loan...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <HugeiconsIcon icon={Coins01Icon} className="w-5 h-5" />
                                    Confirm & Give Loan
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
