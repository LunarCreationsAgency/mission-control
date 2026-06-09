/**
 * Fix missing task types + rebalance assignments.
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
      { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) }, rejectUnauthorized: false },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
            else reject(new Error(`HTTP ${res.statusCode}: ${json.message || data}`));
          } catch {
            if (res.statusCode >= 200 && res.statusCode < 300) resolve({ raw: data });
            else reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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
  const data = await apiCall("/api/collections/_superusers/auth-with-password", { method: "POST", body: { identity: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
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

// ─── INFER TYPE FROM TITLE ───
function inferType(title) {
  const t = title.toLowerCase();
  if (t.includes("deploy") || t.includes("vercel") || t.includes("dns") || t.includes("redirect") || t.includes("domain") || t.includes("host")) return "deploy";
  if (t.includes("design") || t.includes("logo") || t.includes("color") || t.includes("typography") || t.includes("navigation") || t.includes("footer") || t.includes("animation") || t.includes("visual") || t.includes("ui") || t.includes("style")) return "design";
  if (t.includes("content") || t.includes("write") || t.includes("text") || t.includes("copy") || t.includes("blog") || t.includes("article") || t.includes("news")) return "content";
  if (t.includes("seo") || t.includes("analytics") || t.includes("performance") || t.includes("test") || t.includes("build") || t.includes("implement") || t.includes("create") || t.includes("set up") || t.includes("setup") || t.includes("configure") || t.includes("integration") || t.includes("form") || t.includes("login") || t.includes("cms") || t.includes("gdpr") || t.includes("cookie") || t.includes("contact") || t.includes("mobile-first")) return "code";
  return "planning";
}

// ─── SCORING ───
function scoreAgent(agent, taskType, workload) {
  let score = 0;
  const skills = agent.skills || [];

  if (skills.includes(taskType)) score += 25;
  else if ((taskType === "code" && skills.includes("development")) || (taskType === "design" && skills.includes("creative"))) score += 12;
  else score += 1;

  if (workload === 0) score += 8;
  else if (workload <= 3) score += 3;
  else if (workload <= 6) score -= 5;
  else if (workload <= 10) score -= 15;
  else score -= 30;

  if (agent.status === "idle" || agent.status === "active") score += 4;
  else if (agent.status === "working") score -= 2;

  return score;
}

async function main() {
  console.log("🚀 Fixing Types + Rebalancing\n");

  const agentsResult = await getAgents();
  const agents = agentsResult.items || [];

  const tasksResult = await getTasks();
  const tasks = tasksResult.items || [];
  console.log(`Found ${tasks.length} tasks\n`);

  // Step 1: Fix types
  console.log("📝 Fixing task types...");
  for (const task of tasks) {
    const inferred = inferType(task.title);
    if (!task.type || task.type !== inferred) {
      await updateTask(task.id, { type: inferred });
      console.log(`   ${task.title.substring(0, 50)}... → ${inferred}`);
    }
  }

  // Step 2: Clear assignments
  console.log("\n🧹 Clearing assignments...");
  for (const task of tasks) {
    if (task.assignee) await updateTask(task.id, { assignee: "" });
  }

  // Step 3: Smart reassign
  console.log("\n🎯 Reassigning...");
  const breakdown = {};

  for (const task of tasks) {
    const type = task.type || inferType(task.title);
    const workload = {};
    for (const t of tasks) {
      if (t.assignee) workload[t.assignee] = (workload[t.assignee] || 0) + 1;
    }

    const scored = agents
      .filter((a) => !a.paused && a.status !== "offline" && a.status !== "error")
      .map((a) => ({ agent: a, score: scoreAgent(a, type, workload[a.id] || 0) }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0 || scored[0].score <= 0) {
      console.log(`   ⚠️ No match: ${task.title}`);
      continue;
    }

    const best = scored[0].agent;
    await updateTask(task.id, { assignee: best.id });
    task.assignee = best.id;
    breakdown[best.name] = (breakdown[best.name] || 0) + 1;
    console.log(`   ${type.toUpperCase().padEnd(8)} "${task.title.substring(0, 40)}..." → ${best.name}`);
  }

  console.log("\n📊 Distribution:");
  for (const [name, count] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${name}: ${count} tasks`);
  }

  console.log("\n✅ Done!");
}

main().catch((e) => { console.error("❌", e); process.exit(1); });