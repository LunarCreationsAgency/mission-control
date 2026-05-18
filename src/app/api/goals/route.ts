import { NextResponse } from "next/server";
import { pbGetGoals, pbCreateGoal } from "@/lib/pocketbase";
import { logActivity } from "@/lib/activity";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const goal = await pbCreateGoal({
      name: body.name?.trim(),
      description: body.description?.trim() || "",
      status: body.status || "active",
      progress: Number(body.progress) || 0,
      target_date: body.target_date || null,
    });

    logActivity({
      action: "created",
      entity_type: "goal",
      entity_id: (goal as Record<string, unknown>).id as string,
      entity_name: body.name?.trim() || "Goal",
      details: `Status: ${body.status || "active"}, Progress: ${body.progress || 0}%`,
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (e) {
    console.error("POST /api/goals:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
