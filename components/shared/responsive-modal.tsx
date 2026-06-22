"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface ResponsiveModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function ResponsiveModal({ open, onOpenChange, title, description, children, className }: ResponsiveModalProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto overflow-x-hidden px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
                    <SheetHeader className="px-0 pt-0 pb-2">
                        <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
                        {description && <SheetDescription>{description}</SheetDescription>}
                    </SheetHeader>
                    <div className={`pb-2 ${className ?? ""}`}>
                        {children}
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-2xl ${className ?? ""}`}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
