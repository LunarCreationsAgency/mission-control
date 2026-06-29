/**
 * Agent Worker Loop
 * 
 * Polls PocketBase for assigned tasks, executes them based on type,
 * updates status, and logs activity.
 * 
 * Can be run standalone (node scripts/run-worker.js) or imported.
 */

import { getAdminToken, apiCall } from "./pocketbase";
import { type Task, type Agent } from "@/types";

// Task execution handlers — expand as we add real capabilities
const handlers: Record<string, (task: Task, agent: Agent) => Promise<string>> = {
  async code(task, agent) {
    // TODO: integrate with code generation API (Gemini, Ollama)
    return `Agent ${agent.name} implemented code task: ${task.title}`;
  },
  async design(task, agent) {
    return `Agent ${agent.name} created design for: ${task.title}`;
  },
  async content(task, agent) {
    return `Agent ${agent.name} wrote content for: ${task.title}`;
  },
  async deploy(task, agent) {
    return `Agent ${agent.name} prepared deployment for: ${task.title}`;
  },
  async planning(task, agent) {
    return `Agent ${agent.name} completed planning: ${task.title}`;
  },
  async shop(task, agent) {
    return `Agent ${agent.name} configured shop: ${task.title}`;
  },
};

async function getAuth(): Promise<string> {
  return getAdminToken();
}

async function getAgents(token: string): Promise<Agent[]> {
  const data = await apiCall("/api/collections/agents/records?perPage=500", { token }) as { items: Agent[] };
  return (data.items || []).map((a: Agent) => ({
    ...a,
    skills: Array.isArray(a.skills) ? a.skills : [],
    department: a.department || "",
  }));
}

async function getPendingTasks(token: string): Promise<Task[]> {
  // Fetch all tasks, filter in-memory (avoids URL encoding complexity)
  const data = await apiCall("/api/collections/tasks/records?perPage=500", { token }) as { items: Task[] };
  const allTasks = data.items || [];
  return allTasks.filter((t: Task) => t.status === "todo" && t.assignee);
}

async function updateTask(token: string, id: string, updates: Record<string, unknown>): Promise<void> {
  await apiCall(`/api/collections/tasks/records/${id}`, {
    method: "PATCH",
    token,
    body: updates,
  });
}

async function updateAgent(token: string, id: string, updates: Record<string, unknown>): Promise<void> {
  await apiCall(`/api/collections/agents/records/${id}`, {
    method: "PATCH",
    token,
    body: updates,
  });
}

async function logActivity(token: string, action: string, entityType: string, entityId: string, entityName: string, details: string): Promise<void> {
  try {
    await apiCall("/api/collections/activity_logs/records", {
      method: "POST",
      token,
      body: { action, entity_type: entityType, entity_id: entityId, entity_name: entityName, details },
    });
  } catch {
    // Don't let logging break the loop
  }
}

export async function runWorkerCycle(): Promise<{ executed: number; errors: string[] }> {
  const errors: string[] = [];
  let executed = 0;

  try {
    const token = await getAuth();
    const agents = await getAgents(token);
    const tasks = await getPendingTasks(token);

    // Create agent lookup map
    const agentMap = new Map(agents.map((a) => [a.id, a]));

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

        // Determine task type
        const taskType = task.type || "planning";
        const handler = handlers[taskType] || handlers.planning;

        // Mark in progress
        await updateTask(token, task.id, { status: "in_progress", updated: new Date().toISOString() });
        await updateAgent(token, agent.id, { status: "working", current_task: task.id });

        // Execute
        const result = await handler(task, agent);

        // Mark done
        await updateTask(token, task.id, { status: "done", updated: new Date().toISOString() });
        await updateAgent(token, agent.id, { status: "idle", current_task: null });

        // Log
        await logActivity(token, "completed", "task", task.id, task.title, result);

        executed++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Task ${task.id}: ${msg}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Worker cycle failed: ${msg}`);
  }

  return { executed, errors };
}
