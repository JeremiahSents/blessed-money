"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center">
                        <HugeiconsIcon icon={Alert02Icon} className="w-8 h-8 text-warning" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Access Pending
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your account has been created successfully, but you don&apos;t have admin access yet.
                    </p>
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-2">
                    <p className="text-xs font-medium text-foreground">
                        Logged in as:
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                        {session?.user?.email || "Loading..."}
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground">
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
