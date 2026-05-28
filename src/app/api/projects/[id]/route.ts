import { NextResponse } from "next/server";
import { pbGetProject, pbUpdateProject, pbDeleteProject, pbGetTasks, pbDeleteTask } from "@/lib/pocketbase";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await pbGetProject(id);
    return NextResponse.json({ project });
  } catch (e) {
    console.error("GET /api/projects/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const project = await pbUpdateProject(id, body);

    const projectName = (project as Record<string, unknown>).name as string || "Project";
    const action = body.status === "completed" ? "completed" : "updated";

    logActivity({
      action,
      entity_type: "project",
      entity_id: id,
      entity_name: projectName,
      details: body.status ? `Status changed to ${body.status}` : "Updated",
    });

    return NextResponse.json({ project });
  } catch (e) {
    console.error("PATCH /api/projects/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { id: projectId } = await params;

    // Cascade: delete all tasks belonging to this project first
    const tasksResult = await pbGetTasks();
    const tasks = (tasksResult.items || []) as Array<Record<string, unknown>>;
    const projectTasks = tasks.filter((t) => t.project === projectId);
    for (const task of projectTasks) {
      try {
        await pbDeleteTask(task.id as string);
      } catch (taskErr) {
        console.error(`Failed to delete task ${task.id} during project cascade:`, taskErr);
      }
    }

    await pbDeleteProject(id);

    logActivity({
      action: "deleted",
      entity_type: "project",
      entity_id: id,
      entity_name: "Project",
      details: `Deleted ${projectTasks.length} associated tasks`,
    });

    return NextResponse.json({ success: true, tasksDeleted: projectTasks.length });
  } catch (e) {
    console.error("DELETE /api/projects/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
