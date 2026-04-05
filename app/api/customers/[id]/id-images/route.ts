import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json({ error: "Customer ID image uploads have been removed" }, { status: 410 });
}

export async function DELETE() {
    return NextResponse.json({ error: "Customer ID image uploads have been removed" }, { status: 410 });
}
