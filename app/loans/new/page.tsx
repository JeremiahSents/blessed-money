"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { LoanForm } from "@/features/loans/components/loan-form";

export default function NewLoanPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-24 px-4 sm:px-6 pt-8">
            <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors"
            >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3.5 h-3.5 mr-2" />
                Back to dashboard
            </Link>

            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Give a loan</h1>
                <p className="text-zinc-500 mt-1">Pick a borrower and set the amount and terms.</p>
            </div>

            <LoanForm />
        </div>
    );
}
