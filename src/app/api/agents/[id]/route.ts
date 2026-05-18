import { NextResponse } from "next/server";
import { pbUpdateAgent } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const agent = await pbUpdateAgent(id, body);
    return NextResponse.json({ agent });
  } catch (e) {
    console.error("PATCH /api/agents/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
