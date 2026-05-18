import { NextResponse } from "next/server";
import { pbUpdateTask, pbDeleteTask, pbGetTasks } from "@/lib/pocketbase";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const task = await pbUpdateTask(id, body);

    const taskName = (task as Record<string, unknown>).title as string || "Task";
    const action = body.status === "done" ? "completed" : "updated";

    logActivity({
      action,
      entity_type: "task",
      entity_id: id,
      entity_name: taskName,
      details: body.status ? `Status changed to ${body.status}` : "Updated",
    });

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

    // Try to fetch task name before deleting
    let taskName = "Task";
    try {
      const result = await pbGetTasks();
      const tasks = (result.items as Record<string, unknown>[]) || [];
      const task = tasks.find((t) => t.id === id);
      if (task) taskName = (task.title as string) || "Task";
    } catch {
      // ignore
    }

    await pbDeleteTask(id);

    logActivity({
      action: "deleted",
      entity_type: "task",
      entity_id: id,
      entity_name: taskName,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/tasks/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
