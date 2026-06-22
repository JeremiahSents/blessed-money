import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";

/**
 * Context passed to every authenticated route handler.
 * - `user`   the signed-in user
 * - `req`    the incoming request (read query params, JSON body, etc.)
 * - `params` dynamic route params, e.g. `{ id }` for /api/loans/[id]
 */
type Ctx = {
    user: { id: string };
    req: NextRequest;
    params: Record<string, string>;
};

/**
 * Wraps an API route handler with the two things every route needs:
 *   1. a session check (returns 401 if the user is not signed in)
 *   2. uniform error handling (returns `{ error }` on a thrown error)
 *
 * Your handler just returns plain data and it gets sent as JSON:
 *
 *   export const GET = withAuth(async ({ req }) => {
 *     const data = await listThings();
 *     return { data };
 *   });
 */
export function withAuth(
    handler: (ctx: Ctx) => Promise<unknown>,
    errorStatus = 500,
) {
    return async (
        req: NextRequest,
        route?: { params: Promise<Record<string, string>> },
    ) => {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const params = route ? await route.params : {};
            const data = await handler({ user: session.user, req, params });
            return NextResponse.json(data);
        } catch (err) {
            return NextResponse.json({ error: getErrorMessage(err) }, { status: errorStatus });
        }
    };
}
