"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from '@hugeicons/react';
import { Logout03Icon, Settings01Icon, Alert01Icon } from '@hugeicons/core-free-icons';
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { AdminPanel } from "@/features/admin/components/admin-panel";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

export default function SettingsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isSigningOut, setIsSigningOut] = useState(false);

    // Fetch settings and admin status using useQuery
    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await fetch("/api/settings");
            if (!res.ok) throw new Error("Failed to load settings");
            return res.json();
        }
    });

    const { data: adminData } = useQuery({
        queryKey: ["admin-me"],
        queryFn: async () => {
            const res = await fetch("/api/admin/me");
            if (!res.ok) return { isAdmin: false };
            return res.json();
        }
    });

    const [workingCapital, setWorkingCapital] = useState("");

    const formatNumber = (val: string) => {
        if (!val) return "";
        const raw = val.replace(/,/g, '');
        const parts = raw.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    // Update local state when query finishes
    useEffect(() => {
        if (settingsData?.data?.workingCapital) {
            setWorkingCapital(formatNumber(String(settingsData.data.workingCapital)));
        }
    }, [settingsData]);

    const saveMutation = useMutation({
        mutationFn: async (val: string) => {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workingCapital: val.replace(/,/g, ''),
                }),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => null);
                throw new Error(json?.error || "Failed to save settings");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            toast.success("Settings saved successfully.");
        },
        onError: (err: Error) => {
            toast.error(err.message);
        }
    });

    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            await authClient.signOut();
            router.push("/signin");
        } catch {
            toast.error("Failed to sign out");
            setIsSigningOut(false);
        }
    };

    if (settingsLoading) return <DetailPageSkeleton />;

    const isAdmin = adminData?.isAdmin ?? false;

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-32 pt-8 px-4 sm:px-6">
            <PageHeader
                title="Settings"
                description="Manage your capital and account."
            />

            <div className="space-y-10">
                {/* Lending Preferences */}
                <section className="space-y-4">
                    <SectionHeading icon={Settings01Icon} title="Your money" description="Your starting cash. We subtract loans you give and add payments you collect to track your balance." />
                    <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Working capital (UGX)</Label>
                        <Input
                            type="text"
                            inputMode="decimal"
                            value={workingCapital}
                            onChange={(e) => setWorkingCapital(formatNumber(e.target.value))}
                            placeholder="Enter starting capital..."
                            className="h-12 rounded-xl border-border focus-visible:ring-primary/20 font-semibold tabular-nums max-w-sm"
                        />
                        <div>
                            <Button
                                onClick={() => saveMutation.mutate(workingCapital)}
                                disabled={saveMutation.isPending}
                                className="mt-2 h-11 px-8 rounded-xl bg-primary text-primary-foreground font-semibold transition-all active:scale-[0.98]"
                            >
                                {saveMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Admin Panel — only visible to admins */}
                {isAdmin && (
                    <section className="border-t border-border pt-8">
                        <AdminPanel />
                    </section>
                )}

                {/* Security / sign out */}
                <section className="space-y-4 border-t border-border pt-8">
                    <SectionHeading icon={Alert01Icon} title="Security" description="Manage your active session." tone="text-destructive" />
                    <Button
                        variant="destructive"
                        onClick={handleSignOut}
                        className="h-11 px-8 rounded-xl bg-destructive hover:bg-destructive text-primary-foreground font-semibold transition-all active:scale-[0.98] shadow-lg shadow-destructive/20"
                    >
                        {!isSigningOut && (
                            <HugeiconsIcon icon={Logout03Icon} className="w-4 h-4 mr-2" />
                        )}
                        {isSigningOut ? "Signing out..." : "Sign Out Account"}
                    </Button>
                </section>
            </div>
        </div>
    );
}

function SectionHeading({
    icon,
    title,
    description,
    tone = "text-foreground",
}: {
    icon: typeof Settings01Icon;
    title: string;
    description: string;
    tone?: string;
}) {
    return (
        <div>
            <div className={`flex items-center gap-2.5 ${tone}`}>
                <HugeiconsIcon icon={icon} className="w-5 h-5" />
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
        </div>
    );
}
