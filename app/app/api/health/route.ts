import { NextResponse } from "next/server";

/** GET /api/health: public liveness check. */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
