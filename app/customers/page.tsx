"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { useState } from "react";

export default function CustomersPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);

    return (
        <div className="max-w-6xl mx-auto">
            <PageHeader
                title="Customers"
                description="Manage your client base and view their profiles."
                action={
                    <Button onClick={() => setIsFormOpen(true)}>
                        <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                        Add Customer
                    </Button>
                }
            />

            <CustomerTable />

            <CustomerForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />
        </div>
    );
}
