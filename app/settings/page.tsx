"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from '@hugeicons/react';
import { Logout03Icon, Book02Icon } from '@hugeicons/core-free-icons';
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPanel } from "@/components/admin/admin-panel";

export default function SettingsPage() {
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [workingCapital, setWorkingCapital] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    const formatNumber = (val: string) => {
        if (!val) return "";
        const rawMatch = val.replace(/,/g, '').match(/^-?\d*\.?\d*/);
        if (!rawMatch) return val;
        const parts = rawMatch[0].split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    useEffect(() => {
        (async () => {
            try {
                const [settingsRes, adminRes] = await Promise.all([
                    fetch("/api/settings"),
                    fetch("/api/admin/me"),
                ]);
                if (settingsRes.ok) {
                    const json = await settingsRes.json();
                    setWorkingCapital(formatNumber(String(json?.data?.workingCapital ?? "0")));
                }
                if (adminRes.ok) {
                    const adminJson = await adminRes.json();
                    setIsAdmin(adminJson?.isAdmin ?? false);
                }
            } catch {
                return;
            }
        })();
    }, []);

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

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workingCapital: workingCapital.replace(/,/g, ''),
                }),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                throw new Error(json?.error || "Failed to save settings");
            }

            toast.success("Settings saved successfully.");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeader
                title="Settings"
                description="Manage your preferences."
            />

            <div className="grid grid-cols-1 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Configure your lending defaults.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Monthly Interest Rate (%)</Label>
                            <Input type="number" defaultValue="20" />
                        </div>
                        <div className="space-y-2">
                            <Label>Your Money (UGX)</Label>
                            <Input
                                type="text"
                                value={workingCapital}
                                onChange={(e) => setWorkingCapital(formatNumber(e.target.value))}
                            />
                        </div>
                        <Button onClick={handleSave}>Save Preferences</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Manage your email alerts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm">Daily Late Loans Summary</p>
                                <p className="text-xs text-zinc-500">Receive a daily summary of loans that went overdue.</p>
                            </div>
                            <Switch checked={true} />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div>
                                <p className="font-medium text-sm">Payment Confirmed</p>
                                <p className="text-xs text-zinc-500">Receive an email when a payment is marked deposited.</p>
                            </div>
                            <Switch checked={false} />
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Panel — only visible to admins */}
                {isAdmin && <AdminPanel />}

                {/* Reports — visible on mobile (not in bottom nav) */}
                <Card className="md:hidden">
                    <CardHeader>
                        <CardTitle>Reports</CardTitle>
                        <CardDescription>View monthly portfolio performance reports.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/reports">
                            <Button variant="outline">
                                <HugeiconsIcon icon={Book02Icon} className="w-4 h-4 mr-2" />
                                View Reports
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-900/50">
                    <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" onClick={handleSignOut}>
                            {isSigningOut ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <HugeiconsIcon icon={Logout03Icon} className="w-4 h-4 mr-2" />
                            )}
                            {isSigningOut ? "Signing out..." : "Sign Out"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
