import { NextResponse } from "next/server";
import { pbGetActivityLogs } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pbGetActivityLogs();
    return NextResponse.json({ logs: (result.items as unknown[]) || [] });
  } catch (e) {
    console.error("GET /api/activity-logs:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
