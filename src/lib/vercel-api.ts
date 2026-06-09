/**
 * Vercel API Integration
 * Deploy projects, check status, manage domains.
 */

const VERCEL_API = "https://api.vercel.com";

interface VercelDeployOptions {
  token: string;
  projectId: string;
  teamId?: string;
  target?: "production" | "preview";
}

interface VercelProjectOptions {
  token: string;
  name: string;
  teamId?: string;
  framework?: string;
}

/**
 * Trigger a new deployment on Vercel.
 */
export async function triggerDeployment(options: VercelDeployOptions) {
  const { token, projectId, teamId, target = "production" } = options;
  const url = new URL(`/v13/deployments`, VERCEL_API);
  if (teamId) url.searchParams.set("teamId", teamId);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectId,
      project: projectId,
      target,
      // Use git source if connected, else force a build
      gitSource: { type: "project-id", projectId },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Vercel deploy failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get deployment status.
 */
export async function getDeploymentStatus(deploymentId: string, token: string, teamId?: string) {
  const url = new URL(`/v13/deployments/${deploymentId}`, VERCEL_API);
  if (teamId) url.searchParams.set("teamId", teamId);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get deployment status: ${response.status}`);
  }

  return response.json();
}

/**
 * List deployments for a project.
 */
export async function listDeployments(projectId: string, token: string, teamId?: string, limit = 10) {
  const url = new URL("/v6/deployments", VERCEL_API);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("limit", String(limit));
  if (teamId) url.searchParams.set("teamId", teamId);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to list deployments: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new Vercel project.
 */
export async function createVercelProject(options: VercelProjectOptions) {
  const { token, name, teamId, framework = "nextjs" } = options;
  const url = new URL("/v10/projects", VERCEL_API);
  if (teamId) url.searchParams.set("teamId", teamId);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      framework,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    console.error("Vercel API error:", response.status, JSON.stringify(error));
    throw new Error(error.message || error.error?.message || `Failed to create project: ${response.status}`);
  }

  return response.json();
}

/**
 * Add a domain to a Vercel project.
 */
export async function addDomain(projectId: string, domain: string, token: string, teamId?: string) {
  const url = new URL(`/v10/projects/${projectId}/domains`, VERCEL_API);
  if (teamId) url.searchParams.set("teamId", teamId);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to add domain: ${response.status}`);
  }

  return response.json();
}