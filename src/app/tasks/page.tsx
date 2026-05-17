"use client";

import { useState, useEffect, useCallback } from "react";
import { type Task } from "@/types";
import KanbanColumn from "@/components/ui/kanban-column";
import { ListTodo, Loader2 } from "lucide-react";

const columns: { status: Task["status"]; title: string; accent: string }[] = [
  { status: "todo", title: "To Do", accent: "#94a3b8" },
  { status: "in_progress", title: "In Progress", accent: "var(--primary)" },
  { status: "review", title: "Review", accent: "var(--warning)" },
  { status: "done", title: "Done", accent: "var(--success)" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleUpdate = useCallback(async (id: string, status: Task["status"]) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Optimistically update
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch (e) {
      console.error("Failed to update task:", e);
      // Re-fetch to sync
      fetchTasks();
    }
  }, [fetchTasks]);

  const tasksByStatus = (status: Task["status"]) => tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Tasks</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Manage and track your AI agent tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="liquid-glass-subtle flex items-center gap-2 px-3 py-2">
            <ListTodo className="h-4 w-4 text-[var(--primary)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">{tasks.length}</span>
            <span className="text-xs text-[var(--muted)]">total</span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="liquid-glass border-red-500/30 p-6 text-center">
          <p className="text-sm text-red-400">Failed to load tasks</p>
          <button
            onClick={fetchTasks}
            className="mt-3 text-xs text-[var(--primary)] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Kanban Board */}
      {!loading && !error && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              status={col.status}
              tasks={tasksByStatus(col.status)}
              accent={col.accent}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
