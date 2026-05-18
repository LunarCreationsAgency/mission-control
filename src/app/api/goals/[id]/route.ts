import { NextResponse } from "next/server";
import { pbUpdateGoal, pbDeleteGoal } from "@/lib/pocketbase";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const goal = await pbUpdateGoal(id, body);

    const goalName = (goal as Record<string, unknown>).name as string || "Goal";
    const action = body.status === "completed" ? "completed" : "updated";

    logActivity({
      action,
      entity_type: "goal",
      entity_id: id,
      entity_name: goalName,
      details: body.status ? `Status changed to ${body.status}` : "Updated",
    });

    return NextResponse.json({ goal });
  } catch (e) {
    console.error("PATCH /api/goals/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pbDeleteGoal(id);

    logActivity({
      action: "deleted",
      entity_type: "goal",
      entity_id: id,
      entity_name: "Goal",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/goals/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
