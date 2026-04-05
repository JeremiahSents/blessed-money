"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from '@hugeicons/react';
import { Logout03Icon, Book02Icon, Settings01Icon, Notification03Icon, Alert01Icon } from '@hugeicons/core-free-icons';
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPanel } from "@/components/admin/admin-panel";
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
                description="Manage your business configuration and preferences."
            />

            <div className="grid grid-cols-1 gap-8">
                {/* Lending Preferences */}
                <Card className="rounded-[32px] border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <HugeiconsIcon icon={Settings01Icon} className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-xl font-semibold">Lending Preferences</CardTitle>
                        </div>
                        <CardDescription className="font-medium text-zinc-500">Configure your default lending parameters and capital.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Default Interest Rate (%)</Label>
                                <Input 
                                    type="number" 
                                    defaultValue="20" 
                                    className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Your Money (UGX)</Label>
                                <Input
                                    type="text"
                                    value={workingCapital}
                                    onChange={(e) => setWorkingCapital(formatNumber(e.target.value))}
                                    placeholder="Enter starting capital..."
                                    className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 font-semibold tabular-nums"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button 
                                onClick={() => saveMutation.mutate(workingCapital)} 
                                disabled={saveMutation.isPending}
                                className="h-11 px-8 rounded-xl bg-primary text-white font-semibold transition-all active:scale-[0.98]"
                            >
                                {saveMutation.isPending ? "Saving..." : "Save Preferences"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="rounded-[32px] border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                                <HugeiconsIcon icon={Notification03Icon} className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Notifications</CardTitle>
                        </div>
                        <CardDescription className="font-medium text-zinc-500">Stay updated with automated alerts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-0 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        <div className="flex items-center justify-between py-5">
                            <div className="space-y-1">
                                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">Daily Summary</p>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-sm">Receive a daily breakdown of overdue installments every morning.</p>
                            </div>
                            <Switch checked={true} className="data-[state=checked]:bg-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between py-5">
                            <div className="space-y-1">
                                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">Payment Reports</p>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-sm">Get real-time alerts whenever a customer deposits a payment.</p>
                            </div>
                            <Switch checked={false} />
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Panel — only visible to admins */}
                {isAdmin && <AdminPanel />}

                {/* Mobile Reports Link */}
                <Card className="md:hidden rounded-[32px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Reports</CardTitle>
                        <CardDescription className="text-xs font-medium">View monthly portfolio performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/reports">
                            <Button variant="outline" className="w-full h-11 rounded-xl font-semibold border-zinc-200 dark:border-zinc-800">
                                <HugeiconsIcon icon={Book02Icon} className="w-4 h-4 mr-2" />
                                Portfolio Reports
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Sign Out Card */}
                <Card className="rounded-[32px] border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/5 overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <HugeiconsIcon icon={Alert01Icon} className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-rose-600 dark:text-rose-400">Security</CardTitle>
                        </div>
                        <CardDescription className="font-medium text-rose-600/60 dark:text-rose-400/60">Manage your active session.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            variant="destructive" 
                            onClick={handleSignOut}
                            className="h-11 px-8 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20"
                        >
                            {!isSigningOut && (
                                <HugeiconsIcon icon={Logout03Icon} className="w-4 h-4 mr-2" />
                            )}
                            {isSigningOut ? "Signing out..." : "Sign Out Account"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
