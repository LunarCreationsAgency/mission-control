import { NextResponse } from "next/server";
import { pbUpdateProject, pbDeleteProject } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const project = await pbUpdateProject(id, body);
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
    await pbDeleteProject(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/projects/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
