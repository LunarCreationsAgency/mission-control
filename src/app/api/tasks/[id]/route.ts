import { NextResponse } from "next/server";
import { pbUpdateTask, pbDeleteTask } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const task = await pbUpdateTask(id, body);
    return NextResponse.json({ task });
  } catch (e) {
    console.error("PATCH /api/tasks/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pbDeleteTask(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/tasks/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
