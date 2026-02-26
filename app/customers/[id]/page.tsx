"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";

import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, PencilEdit01Icon, ArrowLeft01Icon, Mail01Icon, TelephoneIcon } from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerForm } from "@/components/customers/customer-form";
import { IdDocumentUploader } from "@/components/customers/id-document-uploader";
import { IdImageGallery } from "@/components/customers/id-image-gallery";
import { LoanCard } from "@/components/loans/loan-card";
import type { Customer, LoanSummary } from "@/lib/types";

import { useState, use } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function CustomerDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data, isLoading } = useQuery<{ data: Customer }>({
        queryKey: ['customer', params.id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${params.id}`);
            if (!res.ok) throw new Error("Failed to fetch customer");
            return res.json();
        }
    });

    const generateStatement = () => {
        if (!data?.data) return;
        const doc = new jsPDF();
        const customer = data.data;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Customer Statement", 14, 22);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${customer.name}`, 14, 32);
        doc.text(`Phone: ${customer.phone || 'N/A'}`, 14, 38);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 44);

        const loansData = (customer.loans || []).map((loan: LoanSummary) => [
            loan.id.slice(0, 8),
            `$${parseFloat(loan.principalAmount).toFixed(2)}`,
            `${(parseFloat(loan.interestRate) * 100).toFixed(1)}%`,
            new Date(loan.startDate).toLocaleDateString(),
            loan.status,
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Loan ID', 'Principal', 'Rate', 'Started', 'Status']],
            body: loansData,
            theme: 'grid',
        });

        doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}.pdf`);
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><HugeiconsIcon icon={Loading02Icon} className="w-8 h-8 animate-spin text-zinc-400" /></div>;
    }

    const customer = data?.data;
    if (!customer) return <div className="p-12 text-center">Customer not found.</div>;

    const customerFormDefaults = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? undefined,
        email: customer.email ?? undefined,
        nationalIdType: customer.nationalIdType ?? undefined,
        nationalIdNumber: customer.nationalIdNumber ?? undefined,
        nationalIdExpiry: customer.nationalIdExpiry ?? undefined,
        notes: customer.notes ?? undefined,
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <Link href="/customers" className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white flex items-center mb-4 transition-colors">
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 mr-1" /> Back to Customers
                </Link>
                <PageHeader
                    title={customer.name}
                    description={`Customer since ${customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'unknown date'}`}
                    action={
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={generateStatement}>Export Statement</Button>
                            <Button onClick={() => setIsEditOpen(true)}>
                                <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2 mb-4">Contact Info</h3>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                                <HugeiconsIcon icon={TelephoneIcon} className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Phone</p>
                                <p className="font-medium text-sm">{customer.phone || "Not provided"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                                <HugeiconsIcon icon={Mail01Icon} className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Email</p>
                                <p className="font-medium text-sm">{customer.email || "Not provided"}</p>
                            </div>
                        </div>

                        {customer.notes && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Internal Notes</p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <Tabs defaultValue="loans" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="loans">Loans ({customer.loans?.length || 0})</TabsTrigger>
                            <TabsTrigger value="documents">ID Documents</TabsTrigger>
                        </TabsList>

                        <TabsContent value="loans" className="space-y-4">
                            <div className="flex justify-end mb-4">
                                <Link href={`/loans/new?customer=${customer.id}`}>
                                    <Button size="sm">Issue New Loan</Button>
                                </Link>
                            </div>
                            {customer.loans?.length === 0 ? (
                                <div className="text-center p-12 border border-dashed rounded-xl bg-zinc-50/50">
                                    <p className="text-zinc-500 text-sm">No loans issued for this customer yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {customer.loans?.map((loan: LoanSummary) => (
                                        <LoanCard key={loan.id} loan={loan} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-8">
                            <div className="bg-white p-6 border rounded-xl shadow-sm">
                                <div className="mb-4">
                                    <h3 className="font-semibold text-lg">National Identity</h3>
                                    <p className="text-sm text-zinc-500">
                                        {customer.nationalIdType ? `${customer.nationalIdType}: ${customer.nationalIdNumber}` : 'No ID typed recorded.'}
                                        {customer.nationalIdExpiry && ` • Expires: ${new Date(customer.nationalIdExpiry).toLocaleDateString()}`}
                                    </p>
                                </div>
                                <IdImageGallery customerId={customer.id} paths={customer.nationalIdImagePaths || []} />
                            </div>

                            <div>
                                <h4 className="font-medium mb-3 text-sm text-zinc-500 uppercase tracking-wider">Upload New Document</h4>
                                <IdDocumentUploader customerId={customer.id} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <CustomerForm
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                defaultValues={customerFormDefaults}
            />
        </div>
    );
}
