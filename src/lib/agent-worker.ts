/**
 * Agent Worker Loop — Fast Execution
 *
 * Worker creates structured output WITHOUT AI calls (avoids timeouts).
 * AI generation is available via manual "Generate with AI" button on task detail page.
 *
 * Task outputs:
 * - deploy  → Deployment checklist + Vercel API trigger
 * - code    → Component scaffold + GitHub file creation
 * - design  → CSS tokens from project design system
 * - content → Structured content template
 * - shop    → E-commerce config template
 * - planning→ Project plan template
 */

import { getAdminToken, apiCall } from "./pocketbase";
import { type Task, type Agent, type Project } from "@/types";
import { triggerDeployment } from "./vercel-api";
import { createFileInRepo } from "./github-api";

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

/* ───────── fast handlers (no AI calls) ───────── */

const handlers: Record<string, (task: Task, agent: Agent, token: string) => Promise<{ output: string; notes: string }>> = {
  /** DEPLOY — Trigger Vercel deployment */
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

    try {
      const deploy = await triggerDeployment({
        token: vercelToken,
        projectId: project.vercel_project_id,
        teamId: project.vercel_team_id || settings?.vercel_team_id || undefined,
        target: "production",
      });

      const deployUrl = deploy.url ? `https://${deploy.url}` : "Deploy triggered";
      return {
        output: JSON.stringify({ deploymentId: deploy.id, url: deployUrl }, null, 2),
        notes: `Agent ${agent.name} triggered a production deployment for "${project.name}".\n\nDeployment ID: ${deploy.id}\nURL: ${deployUrl}\n\nReview the deployment status before approving.`,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        output: `Deploy failed: ${msg}`,
        notes: `Agent ${agent.name} attempted to deploy "${project.name}" but encountered an error: ${msg}. Check the Vercel connection.`,
      };
    }
  },

  /** CODE — Create React component scaffold in GitHub repo */
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

    const componentName = task.title.replace(/[^a-zA-Z0-9]/g, "");
    const codeContent = `// Component: ${task.title}\n// Generated by Agent ${agent.name}\n// Task: ${task.description || "Implementation"}\n// Status: review\n\nexport default function ${componentName}Page() {\n  return (\n    \u003cdiv className="p-8"\u003e\n      \u003ch1 className="text-2xl font-bold"\u003e${task.title}\u003c/h1\u003e\n      \u003cp className="text-gray-600"\u003e${task.description || "Implementation goes here."}\u003c/p\u003e\n      \u003cdiv className="mt-4"\u003e\n        \u003c!-- Add your component logic here --\u003e\n      \u003c/div\u003e\n    \u003c/div\u003e\n  );\n}\n`;

    try {
      await createFileInRepo(githubToken, owner, repo, filePath, codeContent, `feat: ${task.title} [agent: ${agent.name}]`, branch);
      return {
        output: codeContent,
        notes: `Agent ${agent.name} created \`${filePath}\` in ${project.github_repo}.\n\nThe component scaffold is ready with basic structure. Click "Generate with AI" on the task detail page to enhance it with full TypeScript types, Tailwind CSS classes, and accessibility features.\n\nReview the code before approving.`,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        output: `File creation failed: ${msg}`,
        notes: `Agent ${agent.name} attempted to write \`${filePath}\` but failed: ${msg}. Check GitHub token permissions (needs \`repo\` scope).`,
      };
    }
  },

  /** DESIGN — Generate CSS from project design tokens */
  async design(task, agent, token) {
    const project = task.project ? await getProject(token, task.project) : null;
    const css = `/* Design System: ${task.title} */\n/* Generated by Agent ${agent.name} */\n/* Project: ${project?.name || "unknown"} */\n\n:root {\n  --color-primary: ${project?.color_primary || "#3b82f6"};\n  --color-secondary: ${project?.color_secondary || "#64748b"};\n  --color-accent: ${project?.color_accent || "#f59e0b"};\n  --color-background: ${project?.color_background || "#0a0a0f"};\n  --font-heading: ${project?.font_heading || "Inter, sans-serif"};\n  --font-body: ${project?.font_body || "Inter, sans-serif"};\n  --design-vibe: ${project?.design_vibe || "modern"};\n}\n\n/* Base */\nbody {\n  background-color: var(--color-background);\n  font-family: var(--font-body);\n  color: #e2e8f0;\n}\n\n/* Glass Morphism */\n.glass {\n  background: rgba(255, 255, 255, 0.05);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n}\n\n/* Button */\n.btn-primary {\n  background: var(--color-primary);\n  color: white;\n  padding: 0.75rem 1.5rem;\n  border-radius: 0.5rem;\n  transition: opacity 0.2s;\n}\n.btn-primary:hover { opacity: 0.9; }\n`;

    return {
      output: css,
      notes: `Agent ${agent.name} generated CSS design tokens for "${project?.name || task.title}".\n\nThe design system includes the brand's color palette, typography, and glass morphism utilities. Click "Generate with AI" on the task detail page to expand it with full component styles, responsive breakpoints, and accessibility features.\n\nReview the colors, fonts, and vibe before approving.`,
    };
  },

  /** CONTENT — Structured content template */
  async content(task, agent, token) {
    const content = `# ${task.title}\n\n${task.description || ""}\n\n---\nGenerated by Agent ${agent.name}\nStatus: review\n\nTip: Click "Generate with AI" on the task detail page to enhance this with creative copywriting.\n`;
    return {
      output: content,
      notes: `Agent ${agent.name} drafted content for "${task.title}".\n\nA structured content template is ready. Click "Generate with AI" on the task detail page to rewrite it with creative, engaging copy that matches your brand tone.\n\nReview tone, accuracy, and completeness before approving.`,
    };
  },

  /** SHOP — Shop configuration template */
  async shop(task, agent, token) {
    const project = task.project ? await getProject(token, task.project) : null;
    const config = {
      project: project?.name || task.title,
      generated_by: agent.name,
      timestamp: new Date().toISOString(),
      sections: {
        products: { categories: ["General"], variants_enabled: true, inventory_tracking: true },
        payments: { stripe: { enabled: false, test_mode: true }, paypal: { enabled: false }, bank_transfer: { enabled: false } },
        shipping: { flat_rate: { enabled: true, cost: "5.00" }, free_shipping_threshold: "50.00" },
        taxes: { vat_enabled: true, vat_rate: "19%", included_in_price: true },
        checkout: { guest_checkout: true, cart_abandonment: true, email_notifications: true },
      },
      recommendations: ["Enable Stripe for card payments", "Set up shipping zones", "Configure tax rules per region", "Add product categories"],
    };

    return {
      output: JSON.stringify(config, null, 2),
      notes: `Agent ${agent.name} generated e-commerce configuration for "${project?.name || task.title}".\n\nA structured shop config template is ready covering payments, shipping, and taxes. Review each section before approving and going live.`,
    };
  },

  /** PLANNING — Planning document template */
  async planning(task, agent, token) {
    const project = task.project ? await getProject(token, task.project) : null;
    const plan = {
      project: project?.name || task.title,
      generated_by: agent.name,
      timestamp: new Date().toISOString(),
      phases: [
        { name: "Discovery", duration: "3-5 days", deliverables: ["Requirements doc", "User stories", "Tech stack decision"], status: "pending" },
        { name: "Design", duration: "5-7 days", deliverables: ["Wireframes", "Visual design", "Design system"], status: "pending" },
        { name: "Development", duration: "2-4 weeks", deliverables: ["Frontend", "Backend", "APIs", "Database"], status: "pending" },
        { name: "Testing", duration: "3-5 days", deliverables: ["Unit tests", "Integration tests", "Bug fixes"], status: "pending" },
        { name: "Deployment", duration: "1-2 days", deliverables: ["CI/CD setup", "Production deploy", "Domain config"], status: "pending" },
        { name: "Launch", duration: "1 day", deliverables: ["Go-live", "Monitoring", "Analytics"], status: "pending" },
      ],
      milestones: [
        { name: "Design Approval", target: "Week 2", blocker: false },
        { name: "MVP Complete", target: "Week 4", blocker: true },
        { name: "Soft Launch", target: "Week 5", blocker: false },
      ],
      risks: [
        "Scope creep — define MVP strictly",
        "Integration delays — test early",
        "Performance — optimize before launch",
      ],
    };

    return {
      output: JSON.stringify(plan, null, 2),
      notes: `Agent ${agent.name} created a project plan for "${project?.name || task.title}".\n\nA structured plan template is ready with phases, milestones, and risk analysis. Click "Generate with AI" on the task detail page to customize it with project-specific details.\n\nReview phases, milestones, and risk mitigations before approving.`,
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

    // Execute tasks sequentially (fast, no AI calls)
    for (const task of tasks) {
      try {
        const agent = task.assignee ? agentMap.get(task.assignee) : undefined;
        if (!agent) {
          errors.push(`Task ${task.id}: no agent found for assignee ${task.assignee}`);
          continue;
        }
        if (agent.paused) {
          errors.push(`Task ${task.id}: agent ${agent.name} is paused`);
          continue;
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

        // Execute (fast, no AI calls)
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
          `Agent ${agent.name} finished "${task.title}" (${taskType}) and submitted for review.`
        );

        reviewCount++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Task ${task.id}: ${msg}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Worker cycle failed: ${msg}`);
  }

  return { executed, review_count: reviewCount, errors };
}
