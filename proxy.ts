import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
    const forwardedProto = request.headers.get("x-forwarded-proto") || "";
    const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1");

    const derivedBaseUrl = (() => {
        if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
        const proto = isLocalHost ? "http" : (forwardedProto || request.nextUrl.protocol.replace(":", ""));
        return `${proto}://${host}`;
    })();

    let session: Session | null = null;
    try {
        const res = await betterFetch<Session>(
            "/api/auth/get-session",
            {
                baseURL: derivedBaseUrl,
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
            },
        );
        session = res.data ?? null;
    } catch {
        session = null;
    }

    const isHomeRoute = request.nextUrl.pathname === '/';
    const isAuthRoute = request.nextUrl.pathname.startsWith('/signin');
    const isProtectedRoute = isHomeRoute ||
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/customers') ||
        request.nextUrl.pathname.startsWith('/loans') ||
        request.nextUrl.pathname.startsWith('/payments') ||
        request.nextUrl.pathname.startsWith('/reports') ||
        request.nextUrl.pathname.startsWith('/settings');

    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL("/signin", request.url));
    }

    if (isAuthRoute && session) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
