"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, TrendingUp, Building2, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [businessName, setBusinessName] = useState("");
    const [workingCapital, setWorkingCapital] = useState("");

    const formatNumber = (val: string) => {
        if (!val) return "";
        const rawMatch = val.replace(/,/g, '').match(/^-?\d*\.?\d*/);
        if (!rawMatch) return val;
        const parts = rawMatch[0].split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessName || !workingCapital) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: businessName, workingCapital: workingCapital.replace(/,/g, '') }),
            });

            if (!res.ok) throw new Error("Failed to setup business");

            toast.success("Welcome to Blessed!");
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
            <Card className="w-full max-w-md rounded-3xl shadow-xl border-zinc-200 dark:border-zinc-800">
                <CardHeader className="text-center space-y-1">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-primary">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">Let's get started</CardTitle>
                    <CardDescription className="text-zinc-500 text-base">
                        Set up your lending business profile to continue.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="business-name" className="text-sm font-semibold flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-zinc-400" />
                                Business Name
                            </Label>
                            <Input
                                id="business-name"
                                placeholder="e.g. Blessed Microfinance"
                                className="rounded-xl h-12"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="working-capital" className="text-sm font-semibold flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-zinc-400" />
                                Initial Working Capital (UGX)
                            </Label>
                            <Input
                                id="working-capital"
                                placeholder="e.g. 5,000,000"
                                className="rounded-xl h-12"
                                type="text"
                                value={workingCapital}
                                onChange={(e) => setWorkingCapital(formatNumber(e.target.value))}
                                disabled={isLoading}
                            />
                            <p className="text-[10px] text-zinc-400">
                                This is the total cash you have available to lend.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8 pt-4">
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-base font-bold transition-all hover:scale-[1.02]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Creating Business...
                                </>
                            ) : (
                                "Complete Setup"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
