"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getTasks, getProjects, createTask, updateTask, deleteTask } from "@/lib/data";
import { type Task, type Project } from "@/types";
import KanbanColumn from "@/components/ui/kanban-column";
import TaskListCard from "@/components/ui/task-list-card";
import TaskModal from "@/components/ui/task-modal";
import CustomSelect from "@/components/ui/custom-select";
import { ListTodo, Plus, Trash2, Loader2, AlertTriangle, Filter, X } from "lucide-react";

const statuses: { status: Task["status"]; label: string; accent: string }[] = [
  { status: "todo", label: "To Do", accent: "#94a3b8" },
  { status: "in_progress", label: "In Progress", accent: "var(--primary)" },
  { status: "review", label: "Review", accent: "var(--warning)" },
  { status: "done", label: "Done", accent: "var(--success)" },
];

const priorities = [
  { value: "", label: "All Priorities", icon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> },
  { value: "low", label: "Low", icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> },
  { value: "medium", label: "Medium", icon: <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> },
  { value: "high", label: "High", icon: <span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> },
  { value: "critical", label: "Critical", icon: <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> },
];

export default function TasksPage() {
  const { data: tasks = [], loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useData<Task[]>("tasks", getTasks);
  const { data: projects = [], loading: projectsLoading } = useData<Project[]>("projects", getProjects);

  const [activeStatus, setActiveStatus] = useState<Task["status"]>("todo");
  const [filterProject, setFilterProject] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const loading = tasksLoading || projectsLoading;
  const error = tasksError;

  const hasFilters = filterProject || filterPriority;

  const getProjectName = (projectId?: string) => {
    if (!projectId) return undefined;
    return (projects || []).find((p) => p.id === projectId)?.name;
  };

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (filterProject && t.project !== filterProject) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const filteredByStatus = (status: Task["status"]) => filteredTasks.filter((t) => t.status === status);
  const mobileFiltered = filteredByStatus(activeStatus);

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

  const clearFilters = () => {
    setFilterProject("");
    setFilterPriority("");
  };

  const projectOptions = [
    { value: "", label: "All Projects", icon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> },
    ...projects.map((p) => ({
      value: p.id,
      label: p.name,
      icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-light)]" />,
    })),
  ];

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
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Task Management</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Tasks</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)] hidden lg:block">Manage and track your AI agent tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2">
            <ListTodo className="h-4 w-4 text-[var(--primary-light)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">{filteredTasks.length}</span>
            <span className="text-xs text-[var(--foreground-tertiary)]">
              {hasFilters ? "filtered" : "total"}
            </span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`liquid-glass-subtle flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
              hasFilters ? "text-[var(--primary-light)] bg-[var(--primary)]/10" : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            <Filter className="h-4 w-4" /> Filter
            {hasFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
                {[filterProject, filterPriority].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[var(--foreground-secondary)] transition-all hover:text-[var(--foreground)] hover:bg-white/[0.04] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />New
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 animated-card" style={{ animation: "fadeInScale 0.2s ease forwards" }}>
          <div className="w-full sm:w-auto sm:min-w-[200px] lg:min-w-[240px]">
            <CustomSelect
              label="Project"
              value={filterProject}
              options={projectOptions}
              onChange={(v) => setFilterProject(v)}
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[180px] lg:min-w-[200px]">
            <CustomSelect
              label="Priority"
              value={filterPriority}
              options={priorities}
              onChange={(v) => setFilterPriority(v)}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] hover:bg-white/[0.06] transition-all"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Desktop: Kanban */}
      <div className="hidden lg:flex gap-4 overflow-x-auto pb-4">
        {statuses.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.label}
            status={col.status}
            tasks={filteredByStatus(col.status)}
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
            const count = filteredByStatus(s.status).length;
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
          {mobileFiltered.length === 0 ? (
            <div className="liquid-glass p-12 text-center">
              <p className="text-sm text-[var(--foreground-tertiary)]">
                {hasFilters
                  ? "No tasks match your filters"
                  : `No tasks in ${statuses.find((s) => s.status === activeStatus)?.label}`}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-3 text-xs text-[var(--primary-light)] hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            mobileFiltered.map((task) => (
              <TaskListCard
                key={task.id}
                task={task}
                project={task.project ? projects.find((p) => p.id === task.project) : undefined}
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
