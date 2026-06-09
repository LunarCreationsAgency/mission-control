/**
 * GitHub API Integration
 * Create repos, link to Vercel projects.
 */

const GITHUB_API = "https://api.github.com";

interface CreateRepoOptions {
  token: string;
  name: string;
  description?: string;
  private?: boolean;
  org?: string; // If creating in an org, otherwise user repo
}

/**
 * Create a new GitHub repository.
 */
export async function createGitHubRepo(options: CreateRepoOptions) {
  const { token, name, description = "", private: isPrivate = true, org } = options;
  const url = org
    ? `${GITHUB_API}/orgs/${org}/repos`
    : `${GITHUB_API}/user/repos`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: true, // Create README
      gitignore_template: "Node",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `GitHub repo creation failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Link a GitHub repo to a Vercel project.
 * Uses Vercel's API to connect a git provider.
 */
export async function linkGitHubToVercel(
  vercelProjectId: string,
  githubRepoFullName: string,
  vercelToken: string,
  productionBranch = "main"
) {
  // Note: Vercel requires OAuth or a pre-configured git credential to link repos.
  // This API endpoint may fail with 400 if no OAuth connection exists.
  // In that case, the user links manually via Vercel dashboard.
  const url = `https://api.vercel.com/v9/projects/${vercelProjectId}/link`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "github",
      repo: githubRepoFullName,
      productionBranch,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    console.error("Vercel link error:", response.status, JSON.stringify(error));
    throw new Error(error.message || `Failed to link repo: ${response.status}`);
  }

  return response.json();
}

/**
 * Get authenticated user info (to determine org or user repo).
 */
export async function getGitHubUser(token: string) {
  const response = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get GitHub user: ${response.status}`);
  }

  return response.json();
}