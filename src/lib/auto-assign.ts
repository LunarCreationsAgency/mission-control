/**
 * Auto-Assignment Engine
 * Matches tasks to agents based on skills and workload.
 */

import { pbGetAgents, pbUpdateTask } from "@/lib/pocketbase";

interface Agent {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  skills?: string[];
  current_task?: string;
}

/**
 * Find the best agent for a task based on skills, status, and workload.
 * Returns agent ID or null if no suitable agent found.
 */
export async function findBestAgentForTask(taskType: string): Promise<string | null> {
  try {
    const result = await pbGetAgents();
    const agents = (result.items || []) as Agent[];

    // Filter: only active agents (not paused, not offline, not error)
    const availableAgents = agents.filter((a) => {
      if (a.paused) return false;
      if (a.status === "offline" || a.status === "error") return false;
      return true;
    });

    if (availableAgents.length === 0) return null;

    // Score each agent: +10 for matching skill, +5 for idle status, -5 for working
    const scored = availableAgents.map((agent) => {
      let score = 0;

      // Skill match
      const skills = agent.skills || [];
      if (skills.includes(taskType)) {
        score += 20; // Direct skill match
      } else if (
        (taskType === "code" && skills.includes("development")) ||
        (taskType === "design" && skills.includes("creative")) ||
        (taskType === "content" && skills.includes("copywriting")) ||
        (taskType === "deploy" && skills.includes("devops")) ||
        (taskType === "planning" && skills.includes("strategy")) ||
        (taskType === "shop" && skills.includes("ecommerce"))
      ) {
        score += 10; // Related skill match
      } else {
        score += 2; // Generalist fallback
      }

      // Workload preference
      if (agent.status === "idle") {
        score += 5;
      } else if (agent.status === "working") {
        score -= 3;
      }

      // Prefer agents without a current task
      if (!agent.current_task) {
        score += 5;
      }

      return { agent, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return the best match if score > 0
    if (scored.length > 0 && scored[0].score > 0) {
      return scored[0].agent.id;
    }

    return null;
  } catch (e) {
    console.error("Auto-assign: failed to find agent:", e);
    return null;
  }
}

/**
 * Assign a task to the best-matching agent.
 * Updates the task's assignee field in PocketBase.
 */
export async function autoAssignTask(taskId: string, taskType: string): Promise<{ assigned: boolean; agentId: string | null; agentName: string | null }> {
  const agentId = await findBestAgentForTask(taskType);

  if (!agentId) {
    console.log(`Auto-assign: no suitable agent found for task ${taskId} (type: ${taskType})`);
    return { assigned: false, agentId: null, agentName: null };
  }

  try {
    await pbUpdateTask(taskId, { assignee: agentId });
    console.log(`Auto-assign: task ${taskId} → agent ${agentId}`);
    return { assigned: true, agentId, agentName: null };
  } catch (e) {
    console.error("Auto-assign: failed to assign task:", e);
    return { assigned: false, agentId: null, agentName: null };
  }
}

/**
 * Batch assign multiple tasks. Used after project creation from wizard.
 */
export async function autoAssignTasks(
  tasks: Array<{ id: string; type?: string }>
): Promise<{ assigned: number; unassigned: number }> {
  let assigned = 0;
  let unassigned = 0;

  for (const task of tasks) {
    const result = await autoAssignTask(task.id, task.type || "planning");
    if (result.assigned) {
      assigned++;
    } else {
      unassigned++;
    }
  }

  console.log(`Auto-assign: ${assigned}/${tasks.length} tasks assigned, ${unassigned} unassigned`);
  return { assigned, unassigned };
}