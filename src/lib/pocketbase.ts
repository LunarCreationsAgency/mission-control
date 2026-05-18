/**
 * Server-side PocketBase REST client using Node's native https module.
 * Bypasses SSL certificate validation for self-signed certs on Hostinger VPS.
 *
 * NEVER use this in browser code. Only in Next.js API routes (server-side).
 */

import { request } from "https";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "";

if (!PB_URL) {
  throw new Error("NEXT_PUBLIC_POCKETBASE_URL environment variable is required");
}

let cachedToken: string | null = null;

interface ApiOptions {
  method?: string;
  body?: Record<string, unknown>;
  token?: string;
}

async function apiCall(path: string, options: ApiOptions = {}): Promise<Record<string, unknown>> {
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
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json as Record<string, unknown>);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${json.message || data}`));
            }
          } catch {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ raw: data } as Record<string, unknown>);
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

async function getAdminToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const identity = process.env.POCKETBASE_ADMIN_EMAIL || "";
  const password = process.env.POCKETBASE_ADMIN_PASSWORD || "";

  if (!password) {
    throw new Error("POCKETBASE_ADMIN_PASSWORD environment variable is required");
  }

  const authData = await apiCall("/api/collections/_superusers/auth-with-password", {
    method: "POST",
    body: { identity, password },
  });

  if (!authData.token) {
    throw new Error("PocketBase authentication failed — check credentials");
  }

  cachedToken = String(authData.token);
  return cachedToken;
}

// --- TASKS ---
export async function pbGetTasks() {
  const token = await getAdminToken();
  return apiCall("/api/collections/tasks/records", { token });
}

export async function pbCreateTask(data: Record<string, unknown>) {
  const token = await getAdminToken();
  return apiCall("/api/collections/tasks/records", { method: "POST", body: data, token });
}

export async function pbUpdateTask(id: string, data: Record<string, unknown>) {
  const token = await getAdminToken();
  return apiCall(`/api/collections/tasks/records/${id}`, { method: "PATCH", body: data, token });
}

export async function pbDeleteTask(id: string) {
  const token = await getAdminToken();
  return apiCall(`/api/collections/tasks/records/${id}`, { method: "DELETE", token });
}

// --- PROJECTS ---
export async function pbGetProjects() {
  const token = await getAdminToken();
  return apiCall("/api/collections/projects/records", { token });
}

export async function pbCreateProject(data: Record<string, unknown>) {
  const token = await getAdminToken();
  return apiCall("/api/collections/projects/records", { method: "POST", body: data, token });
}

export async function pbUpdateProject(id: string, data: Record<string, unknown>) {
  const token = await getAdminToken();
  return apiCall(`/api/collections/projects/records/${id}`, { method: "PATCH", body: data, token });
}

export async function pbDeleteProject(id: string) {
  const token = await getAdminToken();
  return apiCall(`/api/collections/projects/records/${id}`, { method: "DELETE", token });
}

// --- GOALS ---
export async function pbGetGoals() {
  const token = await getAdminToken();
  return apiCall("/api/collections/goals/records", { token });
}

export async function pbCreateGoal(data: Record<string, unknown>) {
  const token = await getAdminToken();
  return apiCall("/api/collections/goals/records", { method: "POST", body: data, token });
}

// --- AGENTS ---
export async function pbGetAgents() {
  const token = await getAdminToken();
  return apiCall("/api/collections/agents/records", { token });
}

export async function pbUpdateAgent(id: string, data: Record<string, unknown>) {
  const token = await getAdminToken();
  return apiCall(`/api/collections/agents/records/${id}`, { method: "PATCH", body: data, token });
}

// --- ACTIVITY LOGS ---
export async function pbGetActivityLogs() {
  const token = await getAdminToken();
  return apiCall("/api/collections/activity_logs/records", { token });
}

export async function pbCreateActivityLog(data: Record<string, unknown>) {
  const token = await getAdminToken();
  return apiCall("/api/collections/activity_logs/records", { method: "POST", body: data, token });
}

// --- COMPANY SETTINGS ---
export async function pbGetCompanySettings() {
  const token = await getAdminToken();
  return apiCall("/api/collections/company_settings/records", { token });
}
