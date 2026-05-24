/**
 * Frontend data layer — uses Next.js API routes with client-side caching.
 * Each getter caches extracted data. apiGet is pure fetch (no caching).
 */

import { type Task, type Project, type Goal, type Agent, type ActivityLog, type CompanySettings } from "@/types";
import { getCached, setCached, isStale, invalidateCache } from "./data-cache";

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

async function apiDelete(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(path, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Helper: cache-aware getter
async function cachedGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = getCached<T>(key);
  if (cached && !isStale(key)) {
    return cached;
  }
  const data = await fetcher();
  setCached(key, data);
  return data;
}

// --- TASKS ---
export async function getTasks(): Promise<Task[]> {
  return cachedGet<Task[]>("tasks", async () => {
    const data = await apiGet("/api/tasks");
    return (data.tasks || []) as Task[];
  });
}

export async function createTask(body: Record<string, unknown>) {
  const result = await apiPost("/api/tasks", body);
  invalidateCache("tasks");
  return result;
}

export async function updateTask(id: string, body: Record<string, unknown>) {
  const result = await apiPatch(`/api/tasks/${id}`, body);
  invalidateCache("tasks");
  return result;
}

export async function deleteTask(id: string) {
  const result = await apiDelete(`/api/tasks/${id}`);
  invalidateCache("tasks");
  return result;
}

// --- PROJECTS ---
export async function getProjects(): Promise<Project[]> {
  return cachedGet<Project[]>("projects", async () => {
    const data = await apiGet("/api/projects");
    return (data.projects || []) as Project[];
  });
}

export async function createProject(body: Record<string, unknown>) {
  const result = await apiPost("/api/projects", body);
  invalidateCache("projects");
  return result;
}

export async function updateProject(id: string, body: Record<string, unknown>) {
  const result = await apiPatch(`/api/projects/${id}`, body);
  invalidateCache("projects");
  return result;
}

export async function deleteProject(id: string) {
  const result = await apiDelete(`/api/projects/${id}`);
  invalidateCache("projects");
  return result;
}

// --- GOALS ---
export async function getGoals(): Promise<Goal[]> {
  return cachedGet<Goal[]>("goals", async () => {
    const data = await apiGet("/api/goals");
    return (data.goals || []) as Goal[];
  });
}

export async function createGoal(body: Record<string, unknown>) {
  const result = await apiPost("/api/goals", body);
  invalidateCache("goals");
  return result;
}

export async function updateGoal(id: string, body: Record<string, unknown>) {
  const result = await apiPatch(`/api/goals/${id}`, body);
  invalidateCache("goals");
  return result;
}

export async function deleteGoal(id: string) {
  const result = await apiDelete(`/api/goals/${id}`);
  invalidateCache("goals");
  return result;
}

// --- AGENTS ---
export async function getAgents(): Promise<Agent[]> {
  return cachedGet<Agent[]>("agents", async () => {
    const data = await apiGet("/api/agents");
    return (data.agents || []) as Agent[];
  });
}

// --- ACTIVITY ---
export async function getActivityLogs(): Promise<ActivityLog[]> {
  // Always fresh — no cache
  const data = await apiGet("/api/activity-logs");
  return (data.logs || []) as ActivityLog[];
}

// --- SETTINGS ---
export async function getCompanySettings(): Promise<CompanySettings[]> {
  return cachedGet<CompanySettings[]>("settings", async () => {
    const data = await apiGet("/api/company-settings");
    return (data.settings || []) as CompanySettings[];
  });
}

export async function updateCompanySettings(id: string, body: Record<string, unknown>) {
  const result = await apiPatch(`/api/company-settings/${id}`, body);
  invalidateCache("settings");
  return result;
}
