"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Flag, Calendar, ListTodo, AlertTriangle, FolderKanban, Bot, Wrench } from "lucide-react";
import { type Task, type Project, type Agent } from "@/types";
import { getProjects, getAgents } from "@/lib/data";
import CustomSelect from "@/components/ui/custom-select";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => Promise<void>;
  initialTask?: Partial<Task>;
  mode: "create" | "edit";
}

const priorityOptions: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "low", label: "Low", icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> },
  { value: "medium", label: "Medium", icon: <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> },
  { value: "high", label: "High", icon: <span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> },
  { value: "critical", label: "Critical", icon: <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> },
];

const statusOptions: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "todo", label: "To Do", icon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> },
  { value: "in_progress", label: "In Progress", icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> },
  { value: "review", label: "Review", icon: <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> },
  { value: "done", label: "Done", icon: <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> },
];

const typeOptions: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "", label: "None", icon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> },
  { value: "design", label: "🎨 Design", icon: <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> },
  { value: "code", label: "💻 Code", icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> },
  { value: "content", label: "📝 Content", icon: <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> },
  { value: "deploy", label: "🚀 Deploy", icon: <span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> },
  { value: "planning", label: "📋 Planning", icon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> },
  { value: "shop", label: "🛒 Shop", icon: <span className="h-1.5 w-1.5 rounded-full bg-pink-400" /> },
];

export default function TaskModal({ isOpen, onClose, onSubmit, initialTask, mode }: TaskModalProps) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(initialTask?.description || "");
  const [status, setStatus] = useState<Task["status"]>(initialTask?.status || "todo");
  const [priority, setPriority] = useState<Task["priority"]>(initialTask?.priority || "medium");
  const [type, setType] = useState<Task["type"]>(initialTask?.type || undefined);
  const [dueDate, setDueDate] = useState(initialTask?.due_date ? new Date(initialTask.due_date).toISOString().split("T")[0] : "");
  const [projectId, setProjectId] = useState(initialTask?.project || "");
  const [assignee, setAssignee] = useState(initialTask?.assignee || "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getProjects().then((data) => setProjects(data as Project[])).catch(() => {});
      getAgents().then((data) => setAgents(data as Agent[])).catch(() => {});
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle(initialTask?.title || "");
    setDescription(initialTask?.description || "");
    setStatus(initialTask?.status || "todo");
    setPriority(initialTask?.priority || "medium");
    setType(initialTask?.type || undefined);
    setDueDate(initialTask?.due_date ? new Date(initialTask.due_date).toISOString().split("T")[0] : "");
    setProjectId(initialTask?.project || "");
    setAssignee(initialTask?.assignee || "");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        type,
        due_date: dueDate || undefined,
        project: projectId || undefined,
        assignee: assignee || undefined,
      });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const agentOptions = [
    { value: "", label: "Unassigned", icon: <Bot className="h-3 w-3 text-[var(--foreground-tertiary)]" /> },
    ...agents.map((a) => ({
      value: a.id,
      label: `${a.name}${a.skills ? ` (${a.skills.slice(0, 2).join(", ")})` : ""}`,
      icon: <div className={`h-2 w-2 rounded-full ${a.paused ? "bg-slate-400" : "bg-emerald-400"}`} />,
    })),
  ];

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ isolation: "isolate" }}>
      <div className="absolute inset-0 bg-[#0a0a0f]/95" onClick={handleClose} />

      <div className="relative w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto" style={{ animation: "fadeInScale 0.2s ease forwards" }}>
        <div
          className="overflow-hidden rounded-lg"
          style={{
            background: "#16161e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderTopColor: "rgba(255,255,255,0.15)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "rgba(59,130,246,0.1)" }}>
                <ListTodo className="h-4 w-4 text-[var(--primary-light)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  {mode === "create" ? "New Task" : "Edit Task"}
                </h2>
                <p className="text-xs text-[var(--foreground-tertiary)]">
                  {mode === "create" ? "Create a new task for your agents" : "Update task details"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--foreground-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-[var(--surface-hover)] transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-[var(--surface-hover)] transition-all resize-none"
              />
            </div>

            {/* Type + Assignee */}
            <div className="grid grid-cols-2 gap-3">
              <CustomSelect
                label="Type"
                value={type || ""}
                options={typeOptions}
                onChange={(v) => setType(v ? (v as Task["type"]) : undefined)}
              />
              <CustomSelect
                label="Assignee"
                value={assignee}
                options={agentOptions}
                onChange={(v) => setAssignee(v)}
                placeholder="Select agent"
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <CustomSelect
                label="Status"
                value={status}
                options={statusOptions}
                onChange={(v) => setStatus(v as Task["status"])}
              />
              <CustomSelect
                label="Priority"
                value={priority}
                options={priorityOptions}
                onChange={(v) => setPriority(v as Task["priority"])}
              />
            </div>

            {/* Project + Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <CustomSelect
                label="Project"
                value={projectId}
                options={[
                  { value: "", label: "No project" },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
                onChange={(v) => setProjectId(v)}
                placeholder="Select a project"
              />

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-tertiary)]" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] pl-10 pr-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-[var(--surface-hover)] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition-all hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-[var(--foreground)] font-medium px-4 py-2.5 text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Task" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(modal, document.body);
  }
  return modal;
}
