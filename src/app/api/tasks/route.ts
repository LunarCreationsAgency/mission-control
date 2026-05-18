import { NextResponse } from "next/server";
import { pbGetTasks, pbCreateTask } from "@/lib/pocketbase";
import { logActivity } from "@/lib/activity";
import { getCachedOrFetch, invalidateApiCache } from "@/lib/api-cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await getCachedOrFetch("tasks", () => pbGetTasks(), 3000);
    return NextResponse.json({ tasks: (result.items as unknown[]) || [] });
  } catch (e) {
    console.error("GET /api/tasks:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload: Record<string, unknown> = {
      title: body.title?.trim(),
      status: body.status || "todo",
      priority: body.priority || "medium",
    };
    if (body.description) payload.description = body.description.trim();
    if (body.project) payload.project = body.project;
    if (body.goal) payload.goal = body.goal;
    if (body.due_date) payload.due_date = body.due_date;
    if (body.assignee) payload.assignee = body.assignee;

    const task = await pbCreateTask(payload);
    invalidateApiCache("tasks");

    logActivity({
      action: "created",
      entity_type: "task",
      entity_id: (task as Record<string, unknown>).id as string,
      entity_name: body.title?.trim() || "Task",
      details: `Priority: ${body.priority || "medium"}, Status: ${body.status || "todo"}`,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (e) {
    console.error("POST /api/tasks:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
