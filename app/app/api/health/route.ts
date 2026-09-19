import { NextResponse } from "next/server";

/** GET /health — public, kept from the Express app (index.ts:215-217). */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
