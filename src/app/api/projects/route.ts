import { NextResponse } from "next/server";
import { pbGetProjects } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pbGetProjects();
    return NextResponse.json({ projects: (result.items as unknown[]) || [] });
  } catch (e) {
    console.error("GET /api/projects:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
