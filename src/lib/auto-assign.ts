/**
 * Auto-Assignment Engine v2 — Workload-aware with specialist preference.
 * Design tasks go to Pixel, code to Architect, deploy to Forge.
 * Generalist tasks (planning, content) distribute across the team.
 */

import { pbGetAgents, pbGetTasks, pbUpdateTask } from "@/lib/pocketbase";

interface Agent {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  skills?: string[];
  current_task?: string;
}

interface Task {
  id: string;
  assignee?: string;
  type?: string;
}

/**
 * Count how many tasks each agent currently owns.
 */
async function getAgentWorkloads(): Promise<Record<string, number>> {
  try {
    const result = await pbGetTasks();
    const tasks = (result.items || []) as Task[];
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      if (task.assignee) {
        counts[task.assignee] = (counts[task.assignee] || 0) + 1;
      }
    }
    return counts;
  } catch {
    return {};
  }
}

/**
 * Score an agent for a specific task type.
 */
function scoreAgent(agent: Agent, taskType: string, workload: number): number {
  let score = 0;
  const skills = agent.skills || [];

  // ─── SKILL MATCH ───
  if (skills.includes(taskType)) {
    score += 25; // Direct specialist match
  } else if (
    (taskType === "code" && skills.includes("development")) ||
    (taskType === "design" && skills.includes("creative")) ||
    (taskType === "content" && skills.includes("copywriting")) ||
    (taskType === "deploy" && skills.includes("devops")) ||
    (taskType === "planning" && skills.includes("strategy")) ||
    (taskType === "shop" && skills.includes("ecommerce"))
  ) {
    score += 12; // Related skill match
  } else {
    score += 1; // Generalist fallback (barely)
  }

  // ─── WORKLOAD PENALTY ───
  if (workload === 0) {
    score += 8; // Fresh agent — eager
  } else if (workload <= 3) {
    score += 3; // Light load — fine
  } else if (workload <= 6) {
    score -= 5; // Getting busy
  } else if (workload <= 10) {
    score -= 15; // Heavy load — avoid
  } else {
    score -= 30; // Overloaded — only if no one else can do it
  }

  // ─── STATUS ───
  if (agent.status === "idle") {
    score += 4;
  } else if (agent.status === "working") {
    score -= 2;
  }

  // ─── GENERALIST BONUS ───
  // For planning/content tasks, spread the load — generalists get a boost
  if ((taskType === "planning" || taskType === "content") && skills.includes("planning")) {
    score += 5;
  }

  return score;
}

/**
 * Find the best agent for a task. Returns agent ID or null.
 */
export async function findBestAgentForTask(taskType: string): Promise<{ agentId: string | null; agentName: string | null }> {
  try {
    const [agentsResult, workloads] = await Promise.all([
      pbGetAgents(),
      getAgentWorkloads(),
    ]);

    const agents = (agentsResult.items || []) as Agent[];

    // Filter active agents
    const available = agents.filter((a) => {
      if (a.paused) return false;
      if (a.status === "offline" || a.status === "error") return false;
      return true;
    });

    if (available.length === 0) return { agentId: null, agentName: null };

    // Score every agent
    const scored = available.map((agent) => ({
      agent,
      score: scoreAgent(agent, taskType, workloads[agent.id] || 0),
    }));

    // Sort descending
    scored.sort((a, b) => b.score - a.score);

    // Pick the best if they have a positive score
    const best = scored[0];
    if (best && best.score > 0) {
      return { agentId: best.agent.id, agentName: best.agent.name };
    }

    // Fallback: least loaded agent if all scores negative
    const leastLoaded = scored.sort(
      (a, b) => (workloads[a.agent.id] || 0) - (workloads[b.agent.id] || 0)
    )[0];
    if (leastLoaded) {
      return { agentId: leastLoaded.agent.id, agentName: leastLoaded.agent.name };
    }

    return { agentId: null, agentName: null };
  } catch (e) {
    console.error("Auto-assign: failed to find agent:", e);
    return { agentId: null, agentName: null };
  }
}

/**
 * Assign a task to the best agent and update PB.
 */
export async function autoAssignTask(
  taskId: string,
  taskType: string
): Promise<{ assigned: boolean; agentId: string | null; agentName: string | null }> {
  const match = await findBestAgentForTask(taskType);

  if (!match.agentId) {
    console.log(`Auto-assign: no agent for task ${taskId} (${taskType})`);
    return { assigned: false, agentId: null, agentName: null };
  }

  try {
    await pbUpdateTask(taskId, { assignee: match.agentId });
    console.log(`Auto-assign: ${taskId} → ${match.agentName} (${taskType})`);
    return { assigned: true, agentId: match.agentId, agentName: match.agentName };
  } catch (e) {
    console.error("Auto-assign: failed:", e);
    return { assigned: false, agentId: null, agentName: null };
  }
}

/**
 * Batch assign tasks. Used after wizard project creation.
 */
export async function autoAssignTasks(
  tasks: Array<{ id: string; type?: string }>
): Promise<{ assigned: number; unassigned: number; breakdown: Record<string, number> }> {
  let assigned = 0;
  let unassigned = 0;
  const breakdown: Record<string, number> = {};

  for (const task of tasks) {
    const result = await autoAssignTask(task.id, task.type || "planning");
    if (result.assigned) {
      assigned++;
      breakdown[result.agentName || "Unknown"] = (breakdown[result.agentName || "Unknown"] || 0) + 1;
    } else {
      unassigned++;
    }
  }

  console.log(`Auto-assign: ${assigned}/${tasks.length} assigned, ${unassigned} unassigned`);
  console.log("Breakdown:", breakdown);
  return { assigned, unassigned, breakdown };
}