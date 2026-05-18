"use client";

import { useState } from "react";
import { X, Loader2, Flag, Calendar, ListTodo, AlertTriangle } from "lucide-react";
import { type Task } from "@/types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => Promise<void>;
  initialTask?: Partial<Task>;
  mode: "create" | "edit";
}

const priorities: { value: Task["priority"]; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-blue-400" },
  { value: "medium", label: "Medium", color: "text-amber-400" },
  { value: "high", label: "High", color: "text-orange-400" },
  { value: "critical", label: "Critical", color: "text-red-400" },
];

const statuses: { value: Task["status"]; label: string; color: string }[] = [
  { value: "todo", label: "To Do", color: "text-slate-400" },
  { value: "in_progress", label: "In Progress", color: "text-[var(--primary-light)]" },
  { value: "review", label: "Review", color: "text-[var(--warning)]" },
  { value: "done", label: "Done", color: "text-[var(--success)]" },
];

export default function TaskModal({ isOpen, onClose, onSubmit, initialTask, mode }: TaskModalProps) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(initialTask?.description || "");
  const [status, setStatus] = useState<Task["status"]>(initialTask?.status || "todo");
  const [priority, setPriority] = useState<Task["priority"]>(initialTask?.priority || "medium");
  const [dueDate, setDueDate] = useState(initialTask?.due_date ? new Date(initialTask.due_date).toISOString().split("T")[0] : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle(initialTask?.title || "");
    setDescription(initialTask?.description || "");
    setStatus(initialTask?.status || "todo");
    setPriority(initialTask?.priority || "medium");
    setDueDate(initialTask?.due_date ? new Date(initialTask.due_date).toISOString().split("T")[0] : "");
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
        due_date: dueDate || undefined,
      });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-fadeInScale">
        <div className="liquid-glass overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10">
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
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--foreground-tertiary)] hover:bg-white/[0.04] hover:text-[var(--foreground)] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
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
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] border-t-white/[0.1] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/30 focus:bg-white/[0.04] transition-all"
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
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] border-t-white/[0.1] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/30 focus:bg-white/[0.04] transition-all resize-none"
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">
                  Status
                </label>
                <div className="space-y-1">
                  {statuses.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={`
                        flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all
                        ${status === s.value
                          ? "bg-white/[0.06] text-[var(--foreground)] border border-white/[0.1]"
                          : "bg-white/[0.02] text-[var(--foreground-tertiary)] border border-white/[0.04] hover:bg-white/[0.04]"
                        }
                      `}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">
                  Priority
                </label>
                <div className="space-y-1">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`
                        flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all
                        ${priority === p.value
                          ? "bg-white/[0.06] text-[var(--foreground)] border border-white/[0.1]"
                          : "bg-white/[0.02] text-[var(--foreground-tertiary)] border border-white/[0.04] hover:bg-white/[0.04]"
                        }
                      `}
                    >
                      <Flag className={`h-3 w-3 ${p.color}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Due Date */}
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
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] border-t-white/[0.1] pl-10 pr-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/30 focus:bg-white/[0.04] transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition-all hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-4 py-2.5 text-sm transition-all disabled:opacity-50"
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
}
