import { NextResponse } from "next/server";
import { pbGetProjects, pbCreateProject } from "@/lib/pocketbase";
import { logActivity } from "@/lib/activity";
import { getCachedOrFetch, invalidateApiCache } from "@/lib/api-cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await getCachedOrFetch("projects", () => pbGetProjects(), 3000);
    return NextResponse.json({ projects: (result.items as unknown[]) || [] });
  } catch (e) {
    console.error("GET /api/projects:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const project = await pbCreateProject({
      name: body.name?.trim(),
      description: body.description?.trim() || "",
      status: body.status || "active",
      progress: 0,
      budget: Number(body.budget) || 0,
    });
    invalidateApiCache("projects");

    logActivity({
      action: "created",
      entity_type: "project",
      entity_id: (project as Record<string, unknown>).id as string,
      entity_name: body.name?.trim() || "Project",
      details: `Status: ${body.status || "active"}`,
    });

    return NextResponse.json({ project });
  } catch (e) {
    console.error("POST /api/projects:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
