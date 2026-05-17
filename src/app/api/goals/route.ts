import { NextResponse } from "next/server";
import { pbGetGoals } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pbGetGoals();
    return NextResponse.json({ goals: (result.items as unknown[]) || [] });
  } catch (e) {
    console.error("GET /api/goals:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
