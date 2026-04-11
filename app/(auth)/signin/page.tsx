"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function SignIn() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/"
            });
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm border-0 ring-0 bg-transparent shadow-none mx-auto">
            <CardHeader className="text-center px-0 pb-6">
                <div className="mx-auto bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                    <Image src="/blessed.png" alt="Blessed" width={20} height={20} priority />
                </div>
                <CardTitle className="text-4xl sm:text-3xl font-bold tracking-tight">Welcome back</CardTitle>
                <CardDescription className="text-sm text-zinc-500 mt-2">
                    Sign in to manage your classes and bookings.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
                <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
                    <div className="space-y-2 text-left">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" className="h-11 rounded-xl" />
                    </div>

                    <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold">
                        Login with Email
                    </Button>
                </form>

                <div className="my-4 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    <span>Or</span>
                    <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>

                <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border-zinc-200 dark:border-zinc-800"
                    onClick={handleSignIn}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                        </span>
                    ) : (
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Sign in with Google</span>
                        </div>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
