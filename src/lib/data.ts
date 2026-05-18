/**
 * Frontend data layer — uses Next.js API routes.
 * NEVER talks directly to PocketBase (avoids CORS/SSL issues).
 */

async function apiGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function apiPost(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function apiPatch(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// --- TASKS ---
export async function getTasks() {
  const data = await apiGet("/api/tasks");
  return (data.tasks || []) as unknown[];
}

export async function createTask(body: Record<string, unknown>) {
  return apiPost("/api/tasks", body);
}

export async function updateTask(id: string, body: Record<string, unknown>) {
  return apiPatch(`/api/tasks/${id}`, body);
}

// --- PROJECTS ---
export async function getProjects() {
  const data = await apiGet("/api/projects");
  return (data.projects || []) as unknown[];
}

export async function createProject(body: Record<string, unknown>) {
  return apiPost("/api/projects", body);
}

export async function updateProject(id: string, body: Record<string, unknown>) {
  return apiPatch(`/api/projects/${id}`, body);
}

export async function deleteProject(id: string) {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE /api/projects/${id} failed: ${res.status}`);
  return res.json();
}

// --- GOALS ---
export async function getGoals() {
  const data = await apiGet("/api/goals");
  return (data.goals || []) as unknown[];
}

// --- AGENTS ---
export async function getAgents() {
  const data = await apiGet("/api/agents");
  return (data.agents || []) as unknown[];
}

// --- ACTIVITY ---
export async function getActivityLogs() {
  const data = await apiGet("/api/activity-logs");
  return (data.logs || []) as unknown[];
}
