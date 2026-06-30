"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, ListTodo, AlertTriangle, Bot } from "lucide-react";
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
  { value: "low", label: "Low", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--secondary)]" /> },
  { value: "medium", label: "Medium", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" /> },
  { value: "high", label: "High", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--secondary)]" /> },
  { value: "critical", label: "Critical", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--destructive)]" /> },
];

const statusOptions: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "todo", label: "To Do", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground-tertiary)]" /> },
  { value: "in_progress", label: "In Progress", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-in-progress)]" /> },
  { value: "review", label: "Review", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-review)]" /> },
  { value: "done", label: "Done", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-done)]" /> },
];

const typeOptions: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "", label: "None", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground-tertiary)]" /> },
  { value: "design", label: "Design", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--agent-light)]" /> },
  { value: "code", label: "Code", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-light)]" /> },
  { value: "content", label: "Content", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> },
  { value: "deploy", label: "Deploy", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--coral)]" /> },
  { value: "planning", label: "Planning", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground-tertiary)]" /> },
  { value: "shop", label: "Shop", icon: <span className="h-1.5 w-1.5 rounded-full bg-pink-400" /> },
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
      icon: <div className={`h-2 w-2 rounded-full ${a.paused ? "bg-[var(--foreground-tertiary)]" : "bg-[var(--success)]"}`} />,
    })),
  ];

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      <div className="relative w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto rounded-md surface-elevated">
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary-subtle)]">
              <ListTodo className="h-4 w-4 text-[var(--primary-light)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {mode === "create" ? "New Task" : "Edit Task"}
              </h2>
              <p className="text-xs text-[var(--foreground-tertiary)]">
                {mode === "create" ? "Create a new task" : "Update task details"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--foreground-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-[var(--destructive-subtle)] border border-[var(--destructive)]/20 p-3">
              <AlertTriangle className="h-4 w-4 text-[var(--destructive)] shrink-0" />
              <p className="text-xs text-[var(--destructive)]">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground-tertiary)]">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground-tertiary)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/30 transition-colors resize-none"
            />
          </div>

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
              <label className="text-xs font-medium text-[var(--foreground-tertiary)]">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/30 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-[var(--foreground)] font-medium px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Task" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(modal, document.body);
  }
  return modal;
}
