import { NextResponse } from "next/server";
import { apiCall, getAdminToken } from "@/lib/pocketbase";
import { triggerDeployment, listDeployments, createVercelProject, addDomain, getDeploymentStatus } from "@/lib/vercel-api";
import { createGitHubRepo, linkGitHubToVercel, getGitHubUser } from "@/lib/github-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, projectId, deploymentId, domain } = body;

    // Fetch tokens from company settings
    const token = await getAdminToken();
    const rawSettings = await apiCall("/api/collections/company_settings/records?perPage=1", { token });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settingsResult = rawSettings as any;
    const settings = settingsResult.items?.[0];
    const vercelToken: string | undefined = settings?.vercel_token;
    const githubToken: string | undefined = settings?.github_token;

    // Get project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let project: any = null;
    if (projectId) {
      try {
        const rawProject = await apiCall(`/api/collections/projects/records/${projectId}`, { token });
        project = rawProject;
      } catch {
        // ignore
      }
    }

    const vercelProjectId: string | undefined = project?.vercel_project_id;

    switch (action) {
      case "deploy": {
        if (!vercelToken) {
          return NextResponse.json({ error: "Vercel token not configured. Go to Settings and add your token." }, { status: 400 });
        }
        if (!vercelProjectId) {
          return NextResponse.json({ error: "Project not linked to Vercel. Create a Vercel project first." }, { status: 400 });
        }
        const deploy = await triggerDeployment({ token: vercelToken, projectId: vercelProjectId });
        return NextResponse.json({ deployment: deploy });
      }

      case "status": {
        if (!vercelToken) {
          return NextResponse.json({ error: "Vercel token not configured" }, { status: 400 });
        }
        if (!deploymentId) {
          return NextResponse.json({ error: "deploymentId required" }, { status: 400 });
        }
        const status = await getDeploymentStatus(deploymentId, vercelToken);
        return NextResponse.json({ status });
      }

      case "list": {
        if (!vercelToken) {
          return NextResponse.json({ error: "Vercel token not configured" }, { status: 400 });
        }
        if (!vercelProjectId) {
          return NextResponse.json({ error: "Project not linked to Vercel" }, { status: 400 });
        }
        const list = await listDeployments(vercelProjectId, vercelToken);
        return NextResponse.json({ deployments: list });
      }

      case "create-project": {
        if (!vercelToken) {
          return NextResponse.json({ error: "Vercel token not configured" }, { status: 400 });
        }
        const { name } = body;
        if (!name) {
          return NextResponse.json({ error: "name required" }, { status: 400 });
        }
        const created = await createVercelProject({ token: vercelToken, name });
        if (project && projectId) {
          await apiCall(`/api/collections/projects/records/${projectId}`, {
            method: "PATCH",
            token,
            body: { vercel_project_id: created.id },
          });
        }
        return NextResponse.json({ project: created });
      }

      case "create-repo": {
        if (!githubToken) {
          return NextResponse.json({ error: "GitHub token not configured. Go to Settings and add your token." }, { status: 400 });
        }
        const { name, description = "", private: isPrivate = true, org } = body;
        if (!name) {
          return NextResponse.json({ error: "name required" }, { status: 400 });
        }
        const repo = await createGitHubRepo({ token: githubToken, name, description, private: isPrivate, org });
        const fullName = repo.full_name; // "owner/repo"

        // Save repo name to project
        if (project && projectId) {
          await apiCall(`/api/collections/projects/records/${projectId}`, {
            method: "PATCH",
            token,
            body: { github_repo: fullName },
          });
        }

        // If Vercel project exists, link the repo
        let linkResult = null;
        if (vercelProjectId && vercelToken) {
          try {
            linkResult = await linkGitHubToVercel(vercelProjectId, fullName, vercelToken);
          } catch (e) {
            console.error("Failed to link repo to Vercel:", e);
            // Non-fatal: repo created, link can be done manually
          }
        }

        return NextResponse.json({ repo, linked: !!linkResult });
      }

      case "link-repo": {
        if (!vercelToken || !githubToken) {
          return NextResponse.json({ error: "Both Vercel and GitHub tokens required" }, { status: 400 });
        }
        const { repo } = body;
        if (!repo || !vercelProjectId) {
          return NextResponse.json({ error: "repo name and vercel project required" }, { status: 400 });
        }
        const result = await linkGitHubToVercel(vercelProjectId, repo, vercelToken);
        return NextResponse.json({ link: result });
      }

      case "add-domain": {
        if (!vercelToken) {
          return NextResponse.json({ error: "Vercel token not configured" }, { status: 400 });
        }
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
