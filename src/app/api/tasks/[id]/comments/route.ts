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
  try {
    const { id } = await params;
    const body = await req.json();
    const token = await getAdminToken();

    const record = await apiCall("/api/collections/task_comments/records", {
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

    // Update task's last_comment_at
    await apiCall(`/api/collections/tasks/records/${id}`, {
      method: "PATCH",
      body: { last_comment_at: new Date().toISOString() },
      token,
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
