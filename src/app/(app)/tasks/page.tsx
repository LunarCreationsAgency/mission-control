"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getTasks, getProjects, createTask, updateTask, deleteTask } from "@/lib/data";
import { type Task, type Project } from "@/types";
import KanbanColumn from "@/components/ui/kanban-column";
import TaskListCard from "@/components/ui/task-list-card";
import TaskModal from "@/components/ui/task-modal";
import { ListTodo, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";

const statuses: { status: Task["status"]; label: string; accent: string }[] = [
  { status: "todo", label: "To Do", accent: "#94a3b8" },
  { status: "in_progress", label: "In Progress", accent: "var(--primary)" },
  { status: "review", label: "Review", accent: "var(--warning)" },
  { status: "done", label: "Done", accent: "var(--success)" },
];

export default function TasksPage() {
  const { data: tasks = [], loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useData<Task[]>("tasks", getTasks);
  const { data: projects = [], loading: projectsLoading } = useData<Project[]>("projects", getProjects);

  const [activeStatus, setActiveStatus] = useState<Task["status"]>("todo");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const loading = tasksLoading || projectsLoading;
  const error = tasksError;

  const getProjectName = (projectId?: string) => {
    if (!projectId) return undefined;
    return (projects || []).find((p) => p.id === projectId)?.name;
  };

  const handleCreate = async (taskData: Partial<Task>) => {
    await createTask(taskData as Record<string, unknown>);
    refetchTasks();
  };

  const handleUpdate = async (id: string, updates: Partial<Task>) => {
    await updateTask(id, updates as Record<string, unknown>);
    refetchTasks();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    refetchTasks();
    setDeleteConfirm(null);
  };

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragEnd = () => setDraggingId(null);

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
          <button onClick={refetchTasks} className="mt-3 text-xs text-[var(--primary-light)] hover:underline">Retry</button>
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
          <button
            onClick={() => setModalOpen(true)}
            className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[var(--foreground-secondary)] transition-all hover:text-[var(--foreground)] hover:bg-white/[0.04] active:scale-[0.98]"
          >
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
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            draggingId={draggingId}
            getProjectName={getProjectName}
          />
        ))}
      </div>

      {/* Mobile: Tab Filter + List */}
      <div className="lg:hidden space-y-4">
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

        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="liquid-glass p-12 text-center">
              <p className="text-sm text-[var(--foreground-tertiary)]">No tasks in {statuses.find(s => s.status === activeStatus)?.label}</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskListCard
                key={task.id}
                task={task}
                project={task.project ? projects.find(p => p.id === task.project) : undefined}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ isolation: "isolate" }}>
          <div className="absolute inset-0 bg-[#0a0a0f]/95" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm z-10" style={{ animation: "fadeInScale 0.2s ease forwards" }}>
            <div
              className="p-5 space-y-4"
              style={{
                background: "#16161e",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "24px",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Delete Task?</h3>
                  <p className="text-xs text-[var(--foreground-tertiary)]">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition-all hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium px-4 py-2.5 text-sm transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
