import { NextResponse } from "next/server";
import { pbGetAgents } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pbGetAgents();
    return NextResponse.json({ agents: (result.items as unknown[]) || [] });
  } catch (e) {
    console.error("GET /api/agents:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
