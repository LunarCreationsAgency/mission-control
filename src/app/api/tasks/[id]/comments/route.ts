import { NextRequest, NextResponse } from "next/server";
import { apiCall, getAdminToken } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/tasks/[id]/comments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAdminToken();
    const result = await apiCall(`/api/collections/task_comments/records?filter=(task='${id}')&sort=created&perPage=500`, { token });
    return NextResponse.json({ comments: (result.items as unknown[]) || [] });
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
  let record: Record<string, unknown> | null = null;

  try {
    const { id } = await params;
    const body = await req.json();
    const token = await getAdminToken();

    // Step 1: Create the comment
    record = await apiCall("/api/collections/task_comments/records", {
      method: "POST",
      body: {
        task: id,
        author: body.author,
        author_type: body.author_type,
        content: body.content,
        comment_type: body.comment_type || "feedback",
      },
      token,
    });

    // Step 2: Update task's last_comment_at (best effort, don't fail if this errors)
    try {
      await apiCall(`/api/collections/tasks/records/${id}`, {
        method: "PATCH",
        body: { last_comment_at: new Date().toISOString() },
        token,
      });
    } catch (updateErr) {
      console.warn("Failed to update last_comment_at:", updateErr);
      // Don't fail the whole request if just the timestamp update fails
    }

    return NextResponse.json({ comment: record });
  } catch (error) {
    console.error("Failed to create task comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
