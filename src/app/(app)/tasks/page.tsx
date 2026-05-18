"use client";

import { useState, useEffect, useCallback } from "react";
import { type Task } from "@/types";
import KanbanColumn from "@/components/ui/kanban-column";
import TaskListCard from "@/components/ui/task-list-card";
import { ListTodo, Plus, LayoutGrid, List, Loader2 } from "lucide-react";

const statuses: { status: Task["status"]; label: string; accent: string }[] = [
  { status: "todo", label: "To Do", accent: "#94a3b8" },
  { status: "in_progress", label: "In Progress", accent: "var(--primary)" },
  { status: "review", label: "Review", accent: "var(--warning)" },
  { status: "done", label: "Done", accent: "var(--success)" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<Task["status"]>("todo");

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
  const filteredTasks = tasksByStatus(activeStatus);

  if (loading) return <TasksSkeleton />;

  if (error) {
    return (
      <div className="space-y-8 page-enter pt-2 lg:pt-0">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Task Management</p>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Tasks</h1>
          </div>
        </div>
        <div className="liquid-glass border-red-500/20 p-8 text-center animated-card">
          <p className="text-sm text-red-400">Failed to load tasks</p>
          <button onClick={fetchTasks} className="mt-3 text-xs text-[var(--primary-light)] hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter pt-2 lg:pt-0">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Task Management</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Tasks</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)] hidden lg:block">Manage and track your AI agent tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2">
            <ListTodo className="h-4 w-4 text-[var(--primary-light)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">{tasks.length}</span>
            <span className="text-xs text-[var(--foreground-tertiary)]">total</span>
          </div>
          <button className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[var(--foreground-secondary)] transition-colors hover:text-[var(--foreground)]">
            <Plus className="h-4 w-4" />New
          </button>
        </div>
      </div>

      {/* Desktop: Kanban */}
      <div className="hidden lg:flex gap-4 overflow-x-auto pb-4">
        {statuses.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.label}
            status={col.status}
            tasks={tasksByStatus(col.status)}
            accent={col.accent}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {/* Mobile: Tab Filter + List */}
      <div className="lg:hidden space-y-4">
        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {statuses.map((s) => {
            const count = tasksByStatus(s.status).length;
            const isActive = activeStatus === s.status;
            return (
              <button
                key={s.status}
                onClick={() => setActiveStatus(s.status)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200
                  ${isActive
                    ? "bg-white/[0.08] text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "bg-white/[0.02] text-[var(--foreground-tertiary)] border border-white/[0.04]"
                  }
                `}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.accent }} />
                {s.label}
                <span className="text-xs text-[var(--foreground-tertiary)]">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="liquid-glass p-12 text-center">
              <p className="text-sm text-[var(--foreground-tertiary)]">No tasks in {statuses.find(s => s.status === activeStatus)?.label}</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskListCard key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TasksSkeleton() {
  return (
    <div className="space-y-8 pt-2 lg:pt-0">
      <div className="flex items-end justify-between">
        <div>
          <div className="skeleton h-3 w-24 mb-2" />
          <div className="skeleton h-8 w-32" />
        </div>
        <div className="skeleton h-9 w-28" />
      </div>
      {/* Desktop skeleton */}
      <div className="hidden lg:flex gap-4">
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
      {/* Mobile skeleton */}
      <div className="lg:hidden space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-10 w-28 rounded-2xl shrink-0" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
