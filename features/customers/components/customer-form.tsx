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
import { getErrorMessage } from "@/lib/errors";

const customerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().optional(),
    notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: Partial<CustomerFormValues> & { id?: string };
    onSuccess?: (data: any) => void;
}

export function CustomerForm({ open, onOpenChange, defaultValues, onSuccess }: CustomerFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!defaultValues?.id;

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: "",
            phone: "",
            notes: "",
            ...defaultValues,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: defaultValues?.name || "",
                phone: defaultValues?.phone || "",
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
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            if (isEditing) {
                queryClient.invalidateQueries({ queryKey: ['customer', defaultValues.id] });
            }
            toast.success(isEditing ? "Customer updated" : "Customer created");
            if (onSuccess) {
                onSuccess(data);
            }
            onOpenChange(false);
            if (!isEditing) form.reset();
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        }
    });

    const onSubmit = (values: CustomerFormValues) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {isEditing ? "Edit customer" : "New customer"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update customer details below." : "Enter the details for the new customer."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
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
                        <div className="flex gap-2 pt-1">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={mutation.isPending}
                                className="flex-1 h-11 rounded-xl font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                                className="flex-1 h-11 rounded-xl font-semibold"
                            >
                                {mutation.isPending ? "Saving..." : isEditing ? "Save" : "Save customer"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
