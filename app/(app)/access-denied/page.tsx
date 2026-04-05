"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlertIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function AccessDeniedPage() {
    const { data: session } = useQuery({
        queryKey: ["session"],
        queryFn: async () => {
            const { data } = await authClient.getSession();
            return data;
        },
    });

    const handleSignOut = async () => {
        await authClient.signOut();
        window.location.href = "/signin";
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                        <ShieldAlertIcon className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Access Pending
                    </h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Your account has been created successfully, but you don&apos;t have admin access yet.
                    </p>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Logged in as:
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {session?.user?.email || "Loading..."}
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Please contact your administrator to request access to this application.
                    </p>
                    <Button
                        onClick={handleSignOut}
                        variant="outline"
                        className="w-full"
                    >
                        Sign Out
                    </Button>
                </div>
            </Card>
        </div>
    );
}
