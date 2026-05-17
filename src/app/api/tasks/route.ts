import { NextResponse } from "next/server";
import { pbGetTasks, pbCreateTask } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pbGetTasks();
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
    const task = await pbCreateTask({
      title: body.title?.trim(),
      description: body.description?.trim() || null,
      status: body.status || "todo",
      priority: body.priority || "medium",
      project: body.project || null,
      goal: body.goal || null,
      due_date: body.due_date || null,
      assignee: body.assignee || null,
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
