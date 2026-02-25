"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOutIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
            router.push("/signin");
        } catch (e) {
            toast.error("Failed to sign out");
        }
    };

    const handleSave = () => {
        toast.success("Settings saved successfully.");
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeader
                title="Settings"
                description="Configure your LendTrack environment."
            />

            <div className="grid grid-cols-1 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Business Information</CardTitle>
                        <CardDescription>Details displayed on customer statements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Business Name</Label>
                            <Input defaultValue="Blessed Money Lending" />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Email</Label>
                            <Input defaultValue="support@blessedmoney.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Default Monthly Interest Rate (%)</Label>
                            <Input type="number" defaultValue="20" />
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
                                <p className="font-medium text-sm">Automated Rollover Report</p>
                                <p className="text-xs text-zinc-500">Receive a daily summary of accounts that rolled over.</p>
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

                <Card className="border-red-200 dark:border-red-900/50">
                    <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" onClick={handleSignOut}>
                            <LogOutIcon className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
