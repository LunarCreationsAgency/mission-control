"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Target, Loader2 } from "lucide-react";
import { type Goal } from "@/types";
import CustomSelect from "@/components/ui/custom-select";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: Partial<Goal>) => Promise<void>;
  goal?: Goal | null;
}

const statusOptions = [
  { value: "active", label: "Active", icon: <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> },
  { value: "completed", label: "Completed", icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> },
  { value: "paused", label: "Paused", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground-tertiary)]" /> },
];

export default function GoalModal({ isOpen, onClose, onSubmit, goal }: GoalModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [progress, setProgress] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name || "");
      setDescription(goal.description || "");
      setStatus(goal.status || "active");
      setProgress(goal.progress?.toString() || "");
      setTargetDate(goal.target_date ? new Date(goal.target_date).toISOString().split("T")[0] : "");
    } else {
      setName("");
      setDescription("");
      setStatus("active");
      setProgress("");
      setTargetDate("");
    }
  }, [goal, isOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        progress: progress ? Number(progress) : 0,
        target_date: targetDate || undefined,
      });
      onClose();
    } catch {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ isolation: "isolate" }}>
      <div className="absolute inset-0 bg-[[var(--background)]]/95" onClick={onClose} />
      <div className="relative w-full max-w-md z-10 max-h-[90vh] overflow-y-auto" style={{ animation: "fadeInScale 0.2s ease forwards" }}>
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderTopColor: "var(--border-strong)", boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)" }}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "rgba(168,85,247,0.1)" }}>
                <Target className="h-4 w-4 text-[#a855f7]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">{goal ? "Edit Goal" : "New Goal"}</h2>
                <p className="text-xs text-[var(--foreground-tertiary)]">{goal ? "Update goal details" : "Create a new goal"}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--foreground-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name" autoFocus
                className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-[var(--surface-hover)] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you want to achieve?" rows={3}
                className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-[var(--surface-hover)] transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CustomSelect label="Status" value={status} options={statusOptions} onChange={(v) => setStatus(v)} />
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Progress (0-100)</label>
                <input type="number" value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="0" min="0" max="100"
                  className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-[var(--surface-hover)] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Target Date</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-[var(--surface-hover)] transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition-colors hover:bg-[var(--surface-hover)]">Cancel</button>
              <button type="submit" disabled={loading || !name.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-[var(--background)] font-semibold px-4 py-2.5 text-sm transition-colors disabled:opacity-50 "
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {goal ? "Update" : "Create"}
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
