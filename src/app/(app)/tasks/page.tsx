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

import { useToast } from "@/components/ui/toast";

const sortOptions = [
  { value: "created", label: "Created", icon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> },
  { value: "priority", label: "Priority", icon: <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> },
  { value: "due_date", label: "Due Date", icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> },
];

const priorityValue: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function TasksPage() {
  const { success, error: toastError } = useToast();
  const { data: tasks = [], loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useData<Task[]>("tasks", getTasks, { refreshInterval: 30000 });
  const { data: projects = [], loading: projectsLoading } = useData<Project[]>("projects", getProjects, { refreshInterval: 30000 });

  const [activeStatus, setActiveStatus] = useState<Task["status"]>("todo");
  const [filterProject, setFilterProject] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [sortBy, setSortBy] = useState("created");
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

  const sortedTasks = [...tasks].filter((t) => {
    if (filterProject && t.project !== filterProject) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "priority") {
      return (priorityValue[b.priority] || 0) - (priorityValue[a.priority] || 0);
    }
    if (sortBy === "due_date") {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });

  const filteredByStatus = (status: Task["status"]) => sortedTasks.filter((t) => t.status === status);
  const mobileFiltered = filteredByStatus(activeStatus);

  const handleCreate = async (taskData: Partial<Task>) => {
    try {
      await createTask(taskData as Record<string, unknown>);
      success("Task created");
      refetchTasks();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to create task");
      throw e;
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Task>) => {
    try {
      await updateTask(id, updates as Record<string, unknown>);
      success("Task updated");
      refetchTasks();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update task");
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      success("Task deleted");
      refetchTasks();
      setDeleteConfirm(null);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to delete task");
    }
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-sm text-red-400 mb-4">Failed to load tasks</p>
        <button onClick={refetchTasks} className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 page-enter pt-2 lg:pt-0 pb-24 lg:pb-0">
      {/* Mobile: compact header */}
      <div className="lg:hidden flex items-center justify-between px-1 mb-2">
        <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Tasks</h1>
        <span className="text-sm text-[var(--foreground-tertiary)]">{sortedTasks.length}</span>
      </div>

      {/* Desktop: full header */}
      <div className="hidden lg:flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Task Management</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Tasks</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2">
            <ListTodo className="h-4 w-4 text-[var(--primary-light)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">{sortedTasks.length}</span>
            <span className="text-xs text-[var(--foreground-tertiary)]">{hasFilters ? "filtered" : "total"}</span>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`liquid-glass-subtle flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98] ${hasFilters ? "text-[var(--primary-light)] bg-[var(--primary)]/10" : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"}`}>
            <Filter className="h-4 w-4" /> Filter
            {hasFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">{[filterProject, filterPriority].filter(Boolean).length}</span>}
          </button>
          <button onClick={() => setModalOpen(true)} className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[var(--foreground-secondary)] transition-all hover:text-[var(--foreground)] hover:bg-white/[0.04] active:scale-[0.98]">
            <Plus className="h-4 w-4" />New
          </button>
        </div>
      </div>

      {/* Mobile: Floating Action Button */}
      <button onClick={() => setModalOpen(true)} className="lg:hidden fixed bottom-24 right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-lg shadow-blue-500/30 active:scale-90 transition-transform" aria-label="New task">
        <Plus className="h-6 w-6" />
      </button>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 animated-card" style={{ animation: "fadeInScale 0.2s ease forwards" }}>
          <div className="w-full sm:w-auto sm:min-w-[200px] lg:min-w-[240px]">
            <CustomSelect label="Project" value={filterProject} options={projectOptions} onChange={(v) => setFilterProject(v)} />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[180px] lg:min-w-[200px]">
            <CustomSelect label="Priority" value={filterPriority} options={priorities} onChange={(v) => setFilterPriority(v)} />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[180px] lg:min-w-[200px]">
            <CustomSelect label="Sort By" value={sortBy} options={sortOptions} onChange={(v) => setSortBy(v)} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] hover:bg-white/[0.06] transition-all">
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
            <div className="bg-[var(--surface-elevated)] rounded-2xl p-12 text-center">
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
      <TaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} mode="create" />

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ isolation: "isolate" }}>
          <div className="absolute inset-0 bg-[#0a0a0f]/95" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm z-10" style={{ animation: "fadeInScale 0.2s ease forwards" }}>
            <div className="p-5 space-y-4" style={{ background: "#16161e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
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
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition-all hover:bg-white/[0.06]">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium px-4 py-2.5 text-sm transition-all"><Trash2 className="h-4 w-4" />Delete</button>
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
    <div className="space-y-6 lg:space-y-8 pt-2 lg:pt-0 pb-24 lg:pb-0">
      {/* Mobile skeleton */}
      <div className="lg:hidden space-y-3 px-3">
        <div className="skeleton h-6 w-24 rounded-lg mb-2" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-10 w-28 rounded-2xl shrink-0" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--surface-elevated)] rounded-2xl h-32 animate-pulse" />
        ))}
      </div>
      {/* Desktop skeleton */}
      <div className="hidden lg:block space-y-8">
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
    </div>
  );
}
