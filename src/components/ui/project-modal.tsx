"use client";

import { useState, useEffect } from "react";
import { X, FolderKanban } from "lucide-react";
import { type Project } from "@/types";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Partial<Project>) => void;
  project?: Project | null;
}

export default function ProjectModal({ isOpen, onClose, onSubmit, project }: ProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "archived">("active");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status as "active" | "completed" | "archived");
      setBudget(project.budget?.toString() || "");
    } else {
      setName("");
      setDescription("");
      setStatus("active");
      setBudget("");
    }
  }, [project, isOpen]);

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
        budget: budget ? Number(budget) : undefined,
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-fadeInScale">
        <div className="liquid-glass border-white/[0.08] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-[var(--primary)]/15">
                <FolderKanban className="h-4.5 w-4.5 text-[var(--primary-light)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {project ? "Edit Project" : "New Project"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4 text-[var(--foreground-tertiary)]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-tertiary)] mb-1.5">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/30 transition-all"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-tertiary)] mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this project about?"
                rows={3}
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/30 transition-all resize-none"
              />
            </div>

            {/* Status + Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-tertiary)] mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "completed" | "archived")}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/30 transition-all appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-tertiary)] mb-1.5">
                  Budget (€)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="100"
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/30 transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Saving..." : project ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
