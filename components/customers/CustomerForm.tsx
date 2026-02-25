"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEffect } from "react";

const customerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    nationalIdType: z.string().optional(),
    nationalIdNumber: z.string().optional(),
    nationalIdExpiry: z.string().optional(), // YYYY-MM-DD
    notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: Partial<CustomerFormValues> & { id?: string };
}

export function CustomerForm({ open, onOpenChange, defaultValues }: CustomerFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!defaultValues?.id;

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: "",
            nationalIdType: "",
            nationalIdNumber: "",
            nationalIdExpiry: "",
            notes: "",
            ...defaultValues,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: defaultValues?.name || "",
                phone: defaultValues?.phone || "",
                email: defaultValues?.email || "",
                nationalIdType: defaultValues?.nationalIdType || "",
                nationalIdNumber: defaultValues?.nationalIdNumber || "",
                nationalIdExpiry: defaultValues?.nationalIdExpiry ? new Date(defaultValues.nationalIdExpiry).toISOString().split('T')[0] : "",
                notes: defaultValues?.notes || "",
            });
        }
    }, [open, defaultValues, form]);

    const mutation = useMutation({
        mutationFn: async (values: CustomerFormValues) => {
            const url = isEditing ? `/api/customers/${defaultValues.id}` : '/api/customers';
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save customer");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            if (isEditing) {
                queryClient.invalidateQueries({ queryKey: ['customer', defaultValues.id] });
            }
            toast.success(isEditing ? "Customer updated" : "Customer created");
            onOpenChange(false);
            if (!isEditing) form.reset();
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const onSubmit = (values: CustomerFormValues) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Customer" : "New Customer"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update customer details below." : "Enter the details for the new customer."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1 234 567 890" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john@example.com" type="email" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nationalIdType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID Type</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Passport, Driver's License, etc." {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nationalIdNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="AB1234567" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nationalIdExpiry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID Expiry</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} value={field.value || ""} />
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
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any additional information..." {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Saving..." : "Save Customer"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
