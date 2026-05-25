#!/usr/bin/env node
/**
 * PocketBase Schema Migration Script — Step by Step
 */

const https = require("https");

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase-qsk9.srv1625666.hstgr.cloud";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || "dustin.wulf@web.de";
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || "Du_752100!66";

function apiCall(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, PB_URL);
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 400) reject(new Error(json.message || data));
            else resolve(json);
          } catch {
            resolve(data);
          }
        });
      }
    );
    req.on("error", reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function getAdminToken() {
  const result = await apiCall("/api/collections/_superusers/auth-with-password", {
    method: "POST",
    body: { identity: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  return result.token;
}

async function addField(token, collection, field) {
  const col = await apiCall(`/api/collections/${collection}`, {
    headers: { Authorization: token },
  });
  if (col.fields.find((f) => f.name === field.name)) {
    console.log(`  ✓ ${collection}.${field.name} already exists`);
    return;
  }
  const newFields = [...col.fields, field];
  await apiCall(`/api/collections/${collection}`, {
    method: "PATCH",
    headers: { Authorization: token },
    body: { fields: newFields },
  });
  console.log(`  ✅ Added ${collection}.${field.name}`);
}

async function main() {
  console.log("🔧 Mission Control Schema Migration\n");
  const token = await getAdminToken();
  console.log("✅ Authenticated\n");

  // 1. Add simple fields first
  await addField(token, "agents", {
    system: false, id: "skills", name: "skills", type: "json",
    required: false, presentable: false, options: {},
  });

  await addField(token, "agents", {
    system: false, id: "department", name: "department", type: "text",
    required: false, presentable: false, options: { min: null, max: null, pattern: "" },
  });

  await addField(token, "tasks", {
    system: false, id: "required_skills", name: "required_skills", type: "json",
    required: false, presentable: false, options: {},
  });

  // 2. Get collection IDs for relations
  const agentsCol = await apiCall("/api/collections/agents", { headers: { Authorization: token } });
  const tasksCol = await apiCall("/api/collections/tasks", { headers: { Authorization: token } });

  // 3. Add relation fields
  await addField(token, "agents", {
    system: false, id: "current_task", name: "current_task", type: "relation",
    required: false, presentable: false,
    options: {
      collectionId: tasksCol.id,
      cascadeDelete: false,
      minSelect: null,
      maxSelect: 1,
      displayFields: ["title"],
    },
  });

  await addField(token, "tasks", {
    system: false, id: "assigned_agent", name: "assigned_agent", type: "relation",
    required: false, presentable: false,
    options: {
      collectionId: agentsCol.id,
      cascadeDelete: false,
      minSelect: null,
      maxSelect: 1,
      displayFields: ["name"],
    },
  });

  console.log("\n✅ Migration complete!");
}

main().catch((e) => {
  console.error("❌ Migration failed:", e.message);
  process.exit(1);
});
