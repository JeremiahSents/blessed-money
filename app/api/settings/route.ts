import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/errors";
import { getAppSettings, updateAppSettings } from "@/core/services/settings-service";
import { resolveBusinessForUser } from "@/core/services/business-service";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const business = await resolveBusinessForUser(session.user.id);
    const data = await getAppSettings(business.id);
    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const business = await resolveBusinessForUser(session.user.id);
    const data = await updateAppSettings(business.id, body);
    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
