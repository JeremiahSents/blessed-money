"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { LoanForm } from "@/features/loans/components/loan-form";

/**
 * The primary "Give a loan" action. Opens a bottom sheet (mobile) / side sheet
 * (desktop) containing the loan form. On success the form navigates to the new
 * loan, which closes the sheet.
 */
export function NewLoanSheet({
    open: controlledOpen,
    onOpenChange,
    showTrigger = true,
}: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showTrigger?: boolean;
} = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    return (
        <>
            {showTrigger && (
                <Button
                    onClick={() => setOpen(true)}
                    className="h-14 w-full sm:w-auto px-6 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
                >
                    <HugeiconsIcon icon={PlusSignIcon} className="w-5 h-5 mr-2" />
                    Give a loan
                </Button>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="bottom"
                    className="max-h-[92vh] overflow-y-auto rounded-t-3xl sm:max-w-none"
                >
                    <SheetHeader className="text-left">
                        <SheetTitle>Give a loan</SheetTitle>
                        <SheetDescription>
                            Pick a borrower and set the amount and terms.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-8 pt-2">
                        <LoanForm />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
