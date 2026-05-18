/**
 * Frontend data layer — uses Next.js API routes with client-side caching.
 * Stale-while-revalidate: returns cached data immediately, then refetches.
 */

import { type Task, type Project, type Goal, type Agent, type ActivityLog, type CompanySettings } from "@/types";
import { setCached, getCached, isStale } from "./data-cache";

async function apiGet(path: string, useCache = true): Promise<Record<string, unknown>> {
  if (useCache) {
    const cached = getCached<Record<string, unknown>>(path);
    if (cached && !isStale(path)) {
      return cached;
    }
  }
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  setCached(path, data);
  return data;
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
  const data = await res.json();
  return data;
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
  const data = await res.json();
  return data;
}

async function apiDelete(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(path, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// --- TASKS ---
export async function getTasks(): Promise<Task[]> {
  const data = await apiGet("/api/tasks");
  return (data.tasks || []) as Task[];
}

export async function createTask(body: Record<string, unknown>) {
  const result = await apiPost("/api/tasks", body);
  const { invalidateCache } = await import("./data-cache");
  invalidateCache("/api/tasks");
  return result;
}

export async function updateTask(id: string, body: Record<string, unknown>) {
  const result = await apiPatch(`/api/tasks/${id}`, body);
  const { invalidateCache } = await import("./data-cache");
  invalidateCache("/api/tasks");
  return result;
}

export async function deleteTask(id: string) {
  const result = await apiDelete(`/api/tasks/${id}`);
  const { invalidateCache } = await import("./data-cache");
  invalidateCache("/api/tasks");
  return result;
}

// --- PROJECTS ---
export async function getProjects(): Promise<Project[]> {
  const data = await apiGet("/api/projects");
  return (data.projects || []) as Project[];
}

export async function createProject(body: Record<string, unknown>) {
  const result = await apiPost("/api/projects", body);
  const { invalidateCache } = await import("./data-cache");
  invalidateCache("/api/projects");
  return result;
}

export async function updateProject(id: string, body: Record<string, unknown>) {
  const result = await apiPatch(`/api/projects/${id}`, body);
  const { invalidateCache } = await import("./data-cache");
  invalidateCache("/api/projects");
  return result;
}

export async function deleteProject(id: string) {
  const result = await apiDelete(`/api/projects/${id}`);
  const { invalidateCache } = await import("./data-cache");
  invalidateCache("/api/projects");
  return result;
}

// --- GOALS ---
export async function getGoals(): Promise<Goal[]> {
  const data = await apiGet("/api/goals");
  return (data.goals || []) as Goal[];
}

// --- AGENTS ---
export async function getAgents(): Promise<Agent[]> {
  const data = await apiGet("/api/agents");
  return (data.agents || []) as Agent[];
}

// --- ACTIVITY ---
export async function getActivityLogs(): Promise<ActivityLog[]> {
  const data = await apiGet("/api/activity-logs", false);
  return (data.logs || []) as ActivityLog[];
}

// --- SETTINGS ---
export async function getCompanySettings(): Promise<CompanySettings[]> {
  const data = await apiGet("/api/company-settings");
  return (data.settings || []) as CompanySettings[];
}