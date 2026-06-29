/**
 * Agent Worker Loop — Real Execution with Ollama AI + Review Reports
 *
 * Agents now generate real content via Ollama cloud models with human-readable review reports.
 *
 * Model routing:
 * - code/design    → qwen3-coder:480b-cloud (best for React/TS/CSS)
 * - content/planning/deploy → deepseek-v4-pro:cloud (fastest + creative)
 *
 * Each output includes:
 * - A REVIEW REPORT (human-readable summary of what was done)
 * - A DELIVERABLE (the actual code/CSS/content/config)
 *
 * All outputs go to review_notes for human approval.
 */

import { getAdminToken, apiCall } from "./pocketbase";
import { type Task, type Agent, type Project } from "@/types";
import { triggerDeployment } from "./vercel-api";
import { createFileInRepo } from "./github-api";
import {
  generateDesignCSS,
  generateCode,
  generateContent,
  generatePlan,
  generateShopConfig,
  generateDeployNotes,
} from "./ollama-agent";

const GITHUB_API = "https://api.github.com";

/* ───────── helpers ───────── */

async function getAuth(): Promise<string> {
  return getAdminToken();
}

async function getAgents(token: string): Promise<Agent[]> {
  const data = (await apiCall("/api/collections/agents/records?perPage=500", { token })) as { items: Agent[] };
  return (data.items || []).map((a: Agent) => ({
    ...a,
    skills: Array.isArray(a.skills) ? a.skills : [],
    department: a.department || "",
  }));
}

async function getPendingTasks(token: string): Promise<Task[]> {
  const data = (await apiCall("/api/collections/tasks/records?perPage=500", { token })) as { items: Task[] };
  const all = data.items || [];
  return all.filter((t: Task) => t.status === "todo" && t.assignee);
}

async function getProject(token: string, id: string): Promise<Project | null> {
  try {
    const data = await apiCall(`/api/collections/projects/records/${id}`, { token });
    return data as unknown as Project;
  } catch {
    return null;
  }
}

async function getCompanySettings(token: string): Promise<Record<string, string> | null> {
  try {
    const data = (await apiCall("/api/collections/company_settings/records?perPage=1", { token })) as {
      items: Record<string, string>[];
    };
    return data.items?.[0] || null;
  } catch {
    return null;
  }
}

async function updateTask(token: string, id: string, updates: Record<string, unknown>): Promise<void> {
  await apiCall(`/api/collections/tasks/records/${id}`, { method: "PATCH", token, body: updates });
}

async function updateAgent(token: string, id: string, updates: Record<string, unknown>): Promise<void> {
  await apiCall(`/api/collections/agents/records/${id}`, { method: "PATCH", token, body: updates });
}

async function logActivity(
  token: string,
  action: string,
  entityType: string,
  entityId: string,
  entityName: string,
  details: string
): Promise<void> {
  try {
    await apiCall("/api/collections/activity_logs/records", {
      method: "POST",
      token,
      body: { action, entity_type: entityType, entity_id: entityId, entity_name: entityName, details },
    });
  } catch {
    /* logging must never break the loop */
  }
}

/* ───────── real handlers with AI + review reports ───────── */

const handlers: Record<string, (task: Task, agent: Agent, token: string) => Promise<{ output: string; notes: string }>> = {
  /** DEPLOY — AI deploy notes + trigger Vercel deployment */
  async deploy(task, agent, token) {
    const settings = await getCompanySettings(token);
    const vercelToken = settings?.vercel_token;

    if (!task.project) {
      return {
        output: "No project linked to this task.",
        notes: `Agent ${agent.name} attempted to deploy but the task has no associated project.`,
      };
    }

    const project = await getProject(token, task.project);
    if (!project?.vercel_project_id) {
      return {
        output: "No Vercel project configured.",
        notes: `Agent ${agent.name} attempted to deploy "${project?.name || "project"}" but no Vercel project ID is set.`,
      };
    }

    if (!vercelToken) {
      return {
        output: "No Vercel token configured.",
        notes: `Agent ${agent.name} attempted to deploy but the company has no Vercel API token.`,
      };
    }

    const aiStart = Date.now();
    const { review, deliverable } = await generateDeployNotes(task.title, task.description || "");
    const aiElapsed = Date.now() - aiStart;

    try {
      const deploy = await triggerDeployment({
        token: vercelToken,
        projectId: project.vercel_project_id,
        teamId: project.vercel_team_id || settings?.vercel_team_id || undefined,
        target: "production",
      });

      const deployUrl = deploy.url ? `https://${deploy.url}` : "Deploy triggered";
      return {
        output: `${deliverable}\n\n--- Deployment Info ---\n${JSON.stringify({ deploymentId: deploy.id, url: deployUrl }, null, 2)}`,
        notes: `Agent ${agent.name} generated deploy notes via AI (${aiElapsed}ms) and triggered production deployment for "${project.name}".\n\n${review}`,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        output: `Deploy failed: ${msg}\n\n--- Generated Notes ---\n${deliverable}`,
        notes: `Agent ${agent.name} generated deploy notes via AI (${aiElapsed}ms) but encountered an error: ${msg}.`,
      };
    }
  },

  /** CODE — AI React component + create GitHub file */
  async code(task, agent, token) {
    const settings = await getCompanySettings(token);
    const githubToken = settings?.github_token;

    if (!task.project) {
      return {
        output: "No project linked.",
        notes: `Agent ${agent.name} attempted to write code but the task has no associated project.`,
      };
    }

    const project = await getProject(token, task.project);
    if (!project?.github_repo) {
      return {
        output: "No GitHub repo configured.",
        notes: `Agent ${agent.name} attempted to write code for "${project?.name || "project"}" but no GitHub repo is linked.`,
      };
    }

    if (!githubToken) {
      return {
        output: "No GitHub token configured.",
        notes: `Agent ${agent.name} attempted to write code but the company has no GitHub token.`,
      };
    }

    const repoMatch = project.github_repo.match(/^([^\/]+)\/([^\/]+)$/);
    if (!repoMatch) {
      return {
        output: "Invalid repo format.",
        notes: `Agent ${agent.name} found github_repo "${project.github_repo}" but it's not in "owner/repo" format.`,
      };
    }
    const [, owner, repo] = repoMatch;

    const aiStart = Date.now();
    const { review, deliverable } = await generateCode(task.title, task.description || "");
    const aiElapsed = Date.now() - aiStart;

    let branch = "main";
    try {
      const repoInfoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github.v3+json" },
      });
      if (repoInfoRes.ok) {
        const repoInfo = await repoInfoRes.json();
        branch = repoInfo.default_branch || "main";
      }
    } catch { /* fallback to main */ }

    const fileName = task.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".tsx";
    const filePath = `src/app/${fileName}`;

    try {
      await createFileInRepo(githubToken, owner, repo, filePath, deliverable, `feat: ${task.title} [agent: ${agent.name}]`, branch);
      return {
        output: deliverable,
        notes: `Agent ${agent.name} generated React component via AI (${aiElapsed}ms) and created \`${filePath}\` in ${project.github_repo}.\n\n${review}`,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        output: `File creation failed: ${msg}\n\n--- Generated Code ---\n${deliverable}`,
        notes: `Agent ${agent.name} generated code via AI (${aiElapsed}ms) but failed to push to GitHub: ${msg}.`,
      };
    }
  },

  /** DESIGN — AI CSS design system generation */
  async design(task, agent, token) {
    const project = task.project ? await getProject(token, task.project) : null;
    const tokens = {
      color_primary: project?.color_primary,
      color_secondary: project?.color_secondary,
      color_accent: project?.color_accent,
      color_background: project?.color_background,
      font_heading: project?.font_heading,
      font_body: project?.font_body,
      design_vibe: project?.design_vibe,
    };

    const start = Date.now();
    const { review, deliverable } = await generateDesignCSS(task.title, task.description || "", tokens);
    const elapsed = Date.now() - start;

    return {
      output: deliverable,
      notes: `Agent ${agent.name} generated CSS design tokens via AI (${elapsed}ms) for "${project?.name || task.title}".\n\n${review}`,
    };
  },

  /** CONTENT — AI copywriting */
  async content(task, agent, token) {
    const project = task.project ? await getProject(token, task.project) : null;
    const start = Date.now();
    const { review, deliverable } = await generateContent(task.title, task.description || "", project?.name);
    const elapsed = Date.now() - start;

    return {
      output: deliverable,
      notes: `Agent ${agent.name} generated content via AI (${elapsed}ms) for "${project?.name || task.title}".\n\n${review}`,
    };
  },

  /** PLANNING — AI project plan generation */
  async planning(task, agent, token) {
    const project = task.project ? await getProject(token, task.project) : null;
    const start = Date.now();
    const { review, deliverable } = await generatePlan(task.title, task.description || "", project?.name);
    const elapsed = Date.now() - start;

    return {
      output: deliverable,
      notes: `Agent ${agent.name} generated project plan via AI (${elapsed}ms) for "${project?.name || task.title}".\n\n${review}`,
    };
  },

  /** SHOP — AI e-commerce config generation */
  async shop(task, agent, token) {
    const project = task.project ? await getProject(token, task.project) : null;
    const start = Date.now();
    const { review, deliverable } = await generateShopConfig(task.title, task.description || "", project?.name);
    const elapsed = Date.now() - start;

    return {
      output: deliverable,
      notes: `Agent ${agent.name} generated e-commerce config via AI (${elapsed}ms) for "${project?.name || task.title}".\n\n${review}`,
    };
  },
};

/* ───────── main cycle ───────── */

export async function runWorkerCycle(): Promise<{ executed: number; review_count: number; errors: string[] }> {
  const errors: string[] = [];
  let executed = 0;
  let reviewCount = 0;

  try {
    const token = await getAuth();
    const agents = await getAgents(token);
    const tasks = await getPendingTasks(token);
    const agentMap = new Map(agents.map((a) => [a.id, a]));

    // Execute ALL tasks in parallel (not sequential) to fit within Vercel timeout
    const results = await Promise.all(
      tasks.map(async (task) => {
        try {
          const agent = task.assignee ? agentMap.get(task.assignee) : undefined;
          if (!agent) {
            return { task, error: `No agent found for assignee ${task.assignee}` };
          }
          if (agent.paused) {
            return { task, error: `Agent ${agent.name} is paused` };
          }

          const taskType = task.type || "planning";
          const handler = handlers[taskType] || handlers.planning;

          // Mark in_progress + agent working
          await updateTask(token, task.id, {
            status: "in_progress",
            updated: new Date().toISOString(),
          });
          await updateAgent(token, agent.id, {
            status: "working",
            current_task: task.id,
          });

          // Execute
          const { output, notes } = await handler(task, agent, token);

          // Move to review
          await updateTask(token, task.id, {
            status: "review",
            review_notes: `${notes}\n\n--- Output ---\n${output}`.substring(0, 5000),
            updated: new Date().toISOString(),
          });
          await updateAgent(token, agent.id, {
            status: "idle",
            current_task: null,
          });

          await logActivity(
            token,
            "review",
            "task",
            task.id,
            task.title,
            `Agent ${agent.name} finished "${task.title}" (${taskType}) via AI and submitted for review.`
          );

          return { task, success: true };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return { task, error: msg };
        }
      })
    );

    // Collect results
    for (const result of results) {
      if (result.error) {
        errors.push(`Task ${result.task.id}: ${result.error}`);
      } else {
        reviewCount++;
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Worker cycle failed: ${msg}`);
  }

  return { executed, review_count: reviewCount, errors };
}
