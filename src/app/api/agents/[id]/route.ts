import { NextResponse } from "next/server";
import { pbUpdateAgent } from "@/lib/pocketbase";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const agent = await pbUpdateAgent(id, body);

    const agentName = (agent as Record<string, unknown>).name as string || "Agent";
    const isPaused = body.paused === true;
    const isResumed = body.paused === false;

    if (isPaused) {
      logActivity({
        action: "paused",
        entity_type: "agent",
        entity_id: id,
        entity_name: agentName,
      });
    } else if (isResumed) {
      logActivity({
        action: "resumed",
        entity_type: "agent",
        entity_id: id,
        entity_name: agentName,
      });
    } else {
      logActivity({
        action: "updated",
        entity_type: "agent",
        entity_id: id,
        entity_name: agentName,
      });
    }

    return NextResponse.json({ agent });
  } catch (e) {
    console.error("PATCH /api/agents/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
