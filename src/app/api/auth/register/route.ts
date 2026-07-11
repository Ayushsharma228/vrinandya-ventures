import { NextResponse } from "next/server";

// This endpoint has been disabled for security.
// Use /api/auth/signup for new seller registrations.
export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
