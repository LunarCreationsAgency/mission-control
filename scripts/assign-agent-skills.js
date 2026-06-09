/**
 * One-time script: assign skills to all agents and auto-assign existing tasks.
 * Run with: node scripts/assign-agent-skills.js
 */

const { request } = require("https");

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase-qsk9.srv1625666.hstgr.cloud";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || "dustin.wulf@web.de";
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || "Du_752100!66";

let cachedToken = null;

async function apiCall(path, options = {}) {
  const url = `${PB_URL}${path}`;
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const token = options.token || cachedToken;

  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${json.message || data}`));
            }
          } catch {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ raw: data });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          }
        });
      }
    );
    req.on("error", (err) => reject(err));
    if (body) req.write(body);
    req.end();
  });
}

async function getAdminToken() {
  if (cachedToken) return cachedToken;
  const data = await apiCall("/api/collections/_superusers/auth-with-password", {
    method: "POST",
    body: { identity: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  cachedToken = String(data.token);
  return cachedToken;
}

async function getAgents() {
  const token = await getAdminToken();
  return apiCall("/api/collections/agents/records?perPage=500", { token });
}

async function updateAgent(id, data) {
  const token = await getAdminToken();
  return apiCall(`/api/collections/agents/records/${id}`, { method: "PATCH", body: data, token });
}

async function getTasks() {
  const token = await getAdminToken();
  return apiCall("/api/collections/tasks/records?perPage=500", { token });
}

async function updateTask(id, data) {
  const token = await getAdminToken();
  return apiCall(`/api/collections/tasks/records/${id}`, { method: "PATCH", body: data, token });
}

// ─── AGENT SKILL ASSIGNMENTS ───
const AGENT_SKILLS = {
  "Cortana": ["planning", "strategy", "code", "content"], // Generalist / orchestrator
  "Architect": ["code", "development", "deploy", "devops"], // Infrastructure / builds
  "Atlas": ["planning", "strategy", "ops"], // Operations / data
  "Forge": ["deploy", "devops", "code", "development"], // Deployment pipelines
  "Pixel": ["design", "creative", "content"], // UI/UX / visual
  "Sentry": ["analysis", "monitoring", "code"], // Security / analysis
  "Relay": ["ops", "communication", "content"], // Notifications / messaging
};

// ─── MATCHING LOGIC ───
function scoreAgent(agent, taskType) {
  let score = 0;
  const skills = agent.skills || [];

  if (skills.includes(taskType)) {
    score += 20; // Direct match
  } else if (
    (taskType === "code" && skills.includes("development")) ||
    (taskType === "design" && skills.includes("creative")) ||
    (taskType === "content" && skills.includes("copywriting")) ||
    (taskType === "deploy" && skills.includes("devops")) ||
    (taskType === "planning" && skills.includes("strategy")) ||
    (taskType === "shop" && skills.includes("ecommerce"))
  ) {
    score += 10; // Related match
  } else {
    score += 2; // Generalist fallback
  }

  if (agent.status === "idle" || agent.status === "active") score += 5;
  if (!agent.current_task) score += 5;

  return score;
}

async function assignSkillsToAgents() {
  console.log("🎯 Fetching agents...");
  const agentsResult = await getAgents();
  const agents = agentsResult.items || [];

  console.log(`   Found ${agents.length} agents`);

  for (const agent of agents) {
    const skills = AGENT_SKILLS[agent.name];
    if (skills) {
      console.log(`   Updating ${agent.name} → skills: [${skills.join(", ")}]`);
      await updateAgent(agent.id, { skills });
    }
  }

  console.log("✅ Agent skills updated\n");
  return agents;
}

async function autoAssignTasks(agents) {
  console.log("📋 Fetching unassigned tasks...");
  const tasksResult = await getTasks();
  const tasks = tasksResult.items || [];

  const unassigned = tasks.filter((t) => !t.assignee);
  console.log(`   Total tasks: ${tasks.length}, Unassigned: ${unassigned.length}`);

  let assigned = 0;
  let failed = 0;

  for (const task of unassigned) {
    // Score all agents for this task
    const scored = agents
      .filter((a) => !a.paused && a.status !== "offline" && a.status !== "error")
      .map((a) => ({ agent: a, score: scoreAgent(a, task.type || "planning") }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0 || scored[0].score === 0) {
      console.log(`   ⚠️ No agent for: ${task.title} (${task.type || "planning"})`);
      failed++;
      continue;
    }

    const best = scored[0].agent;
    try {
      await updateTask(task.id, { assignee: best.id });
      console.log(`   ✅ "${task.title}" → ${best.name}`);
      assigned++;
    } catch (e) {
      console.error(`   ❌ Failed to assign "${task.title}":`, e.message);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${assigned} assigned, ${failed} unassigned`);
}

async function main() {
  console.log("🚀 Agent Auto-Assignment Script\n");
  try {
    const agents = await assignSkillsToAgents();
    await autoAssignTasks(agents);
    console.log("\n✅ Done!");
  } catch (e) {
    console.error("❌ Failed:", e);
    process.exit(1);
  }
}

main();