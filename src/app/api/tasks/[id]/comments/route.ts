import { NextRequest, NextResponse } from "next/server";
import { pbAdmin } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/tasks/[id]/comments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const records = await pbAdmin.collection("task_comments").getFullList({
      filter: `task = "${id}"`,
      sort: "created",
    });
    return NextResponse.json({ comments: records });
  } catch (error) {
    console.error("Failed to fetch task comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const record = await pbAdmin.collection("task_comments").create({
      task: id,
      author: body.author,
      author_type: body.author_type,
      content: body.content,
      comment_type: body.comment_type || "feedback",
    });

    // Update task's last_comment_at
    await pbAdmin.collection("tasks").update(id, {
      last_comment_at: new Date().toISOString(),
    });

    return NextResponse.json({ comment: record });
  } catch (error) {
    console.error("Failed to create task comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
