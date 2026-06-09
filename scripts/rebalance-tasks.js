/**
 * Rebalance: clear all task assignments and re-run smart auto-assign.
 */

const { request } = require("https");

const PB_URL = "https://pocketbase-qsk9.srv1625666.hstgr.cloud";
const ADMIN_EMAIL = "dustin.wulf@web.de";
const ADMIN_PASSWORD = "Du_752100!66";

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

async function getTasks() {
  const token = await getAdminToken();
  return apiCall("/api/collections/tasks/records?perPage=500", { token });
}

async function updateTask(id, data) {
  const token = await getAdminToken();
  return apiCall(`/api/collections/tasks/records/${id}`, { method: "PATCH", body: data, token });
}

// ─── SKILL MAPPING ───
const AGENT_SKILLS = {
  Cortana: ["planning", "strategy", "code", "content"],
  Architect: ["code", "development", "deploy", "devops"],
  Atlas: ["planning", "strategy", "ops"],
  Forge: ["deploy", "devops", "code", "development"],
  Pixel: ["design", "creative", "content"],
  Sentry: ["analysis", "monitoring", "code"],
  Relay: ["ops", "communication", "content"],
};

function scoreAgent(agent, taskType, workload) {
  let score = 0;
  const skills = agent.skills || [];

  if (skills.includes(taskType)) {
    score += 25;
  } else if (
    (taskType === "code" && skills.includes("development")) ||
    (taskType === "design" && skills.includes("creative")) ||
    (taskType === "content" && skills.includes("copywriting")) ||
    (taskType === "deploy" && skills.includes("devops")) ||
    (taskType === "planning" && skills.includes("strategy")) ||
    (taskType === "shop" && skills.includes("ecommerce"))
  ) {
    score += 12;
  } else {
    score += 1;
  }

  if (workload === 0) score += 8;
  else if (workload <= 3) score += 3;
  else if (workload <= 6) score -= 5;
  else if (workload <= 10) score -= 15;
  else score -= 30;

  if (agent.status === "idle" || agent.status === "active") score += 4;
  else if (agent.status === "working") score -= 2;

  if ((taskType === "planning" || taskType === "content") && skills.includes("planning")) {
    score += 5;
  }

  return score;
}

async function main() {
  console.log("🚀 Rebalancing Task Assignments\n");

  const agentsResult = await getAgents();
  const agents = agentsResult.items || [];
  console.log(`Found ${agents.length} agents`);

  const tasksResult = await getTasks();
  const tasks = tasksResult.items || [];
  console.log(`Found ${tasks.length} tasks`);

  // First: clear all assignments
  console.log("\n🧹 Clearing existing assignments...");
  for (const task of tasks) {
    if (task.assignee) {
      await updateTask(task.id, { assignee: "" });
    }
  }
  console.log("   Cleared.");

  // Second: smart reassign
  console.log("\n🎯 Smart reassigning...");
  const breakdown = {};

  for (const task of tasks) {
    const type = task.type || "planning";

    // Count current workload per agent
    const workload = {};
    for (const t of tasks) {
      if (t.assignee) workload[t.assignee] = (workload[t.assignee] || 0) + 1;
    }

    // Score all agents
    const scored = agents
      .filter((a) => !a.paused && a.status !== "offline" && a.status !== "error")
      .map((a) => ({
        agent: a,
        score: scoreAgent(a, type, workload[a.id] || 0),
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0 || scored[0].score <= 0) {
      console.log(`   ⚠️ No match: ${task.title}`);
      continue;
    }

    const best = scored[0].agent;
    await updateTask(task.id, { assignee: best.id });

    // Mark as assigned for workload tracking
    task.assignee = best.id;

    breakdown[best.name] = (breakdown[best.name] || 0) + 1;
    console.log(`   ✅ ${type.toUpperCase().padEnd(8)} "${task.title.substring(0, 40)}..." → ${best.name}`);
  }

  console.log("\n📊 Distribution:");
  for (const [name, count] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${name}: ${count} tasks`);
  }

  console.log("\n✅ Done!");
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});