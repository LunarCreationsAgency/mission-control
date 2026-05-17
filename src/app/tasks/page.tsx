"use client";

import { useState, useEffect, useCallback } from "react";
import { type Task } from "@/types";
import KanbanColumn from "@/components/ui/kanban-column";
import { ListTodo, Plus } from "lucide-react";

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
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch (e) {
      console.error("Failed to update task:", e);
      fetchTasks();
    }
  }, [fetchTasks]);

  const tasksByStatus = (status: Task["status"]) => tasks.filter((t) => t.status === status);

  if (loading) {
    return <TasksSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-8 page-enter">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
              Task Management
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Tasks</h1>
          </div>
        </div>
        <div className="liquid-glass border-red-500/20 p-8 text-center animated-card">
          <p className="text-sm text-red-400">Failed to load tasks</p>
          <button
            onClick={fetchTasks}
            className="mt-3 text-xs text-[var(--primary-light)] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
            Task Management
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Tasks</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Manage and track your AI agent tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2">
            <ListTodo className="h-4 w-4 text-[var(--primary-light)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">{tasks.length}</span>
            <span className="text-xs text-[var(--foreground-tertiary)]">total</span>
          </div>
          <button className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[var(--foreground-secondary)] transition-colors hover:text-[var(--foreground)]">
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col, i) => (
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
    </div>
  );
}

function TasksSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="skeleton h-3 w-24 mb-2" />
          <div className="skeleton h-8 w-32" />
        </div>
        <div className="skeleton h-9 w-28" />
      </div>
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex min-w-[270px] flex-1 flex-col">
            <div className="skeleton h-5 w-24 mb-3" />
            <div className="flex flex-1 flex-col gap-2 rounded-[18px] border border-white/[0.03] bg-white/[0.01] p-2.5 min-h-[200px]">
              <div className="skeleton h-24 w-full" />
              <div className="skeleton h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
