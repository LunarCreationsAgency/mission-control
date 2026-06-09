import { NextResponse } from "next/server";
import { apiCall, getAdminToken } from "@/lib/pocketbase";
import { triggerDeployment, listDeployments, createVercelProject, addDomain, getDeploymentStatus } from "@/lib/vercel-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/deploy
 * Body: { action: "deploy" | "status" | "list" | "create-project" | "add-domain", projectId, ... }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, projectId, deploymentId, domain } = body;

    // Fetch Vercel token from company settings
    const token = await getAdminToken();
    const rawSettings = await apiCall("/api/collections/company_settings/records?perPage=1", { token });
    const settingsResult = rawSettings as { items?: Array<{ vercel_token?: string }> };
    const settings = settingsResult.items?.[0];
    const vercelToken = settings?.vercel_token;

    if (!vercelToken) {
      return NextResponse.json({ error: "Vercel token not configured. Go to Settings and add your token." }, { status: 400 });
    }

    let project: { vercel_project_id?: string } | null = null;
    if (projectId) {
      try {
        const rawProject = await apiCall(`/api/collections/projects/records/${projectId}`, { token });
        project = rawProject as { vercel_project_id?: string };
      } catch {
        // Project not found
      }
    }

    const vercelProjectId = project?.vercel_project_id as string | undefined;

    switch (action) {
      case "deploy": {
        if (!vercelProjectId) {
          return NextResponse.json({ error: "Project not linked to Vercel. Create a Vercel project first." }, { status: 400 });
        }
        const deploy = await triggerDeployment({ token: vercelToken, projectId: vercelProjectId as string });
        return NextResponse.json({ deployment: deploy });
      }

      case "status": {
        if (!deploymentId) {
          return NextResponse.json({ error: "deploymentId required" }, { status: 400 });
        }
        const status = await getDeploymentStatus(deploymentId, vercelToken);
        return NextResponse.json({ status });
      }

      case "list": {
        if (!vercelProjectId) {
          return NextResponse.json({ error: "Project not linked to Vercel" }, { status: 400 });
        }
        const list = await listDeployments(vercelProjectId, vercelToken);
        return NextResponse.json({ deployments: list });
      }

      case "create-project": {
        const { name } = body;
        if (!name) {
          return NextResponse.json({ error: "name required" }, { status: 400 });
        }
        const created = await createVercelProject({ token: vercelToken, name });

        // Link to our project if projectId provided
        if (project) {
          await apiCall(`/api/collections/projects/records/${projectId}`, {
            method: "PATCH",
            token,
            body: { vercel_project_id: created.id },
          });
        }

        return NextResponse.json({ project: created });
      }

      case "add-domain": {
        if (!vercelProjectId || !domain) {
          return NextResponse.json({ error: "vercelProjectId and domain required" }, { status: 400 });
        }
        const result = await addDomain(vercelProjectId, domain, vercelToken);
        return NextResponse.json({ domain: result });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (e) {
    console.error("Deploy API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Deploy failed" },
      { status: 500 }
    );
  }
}