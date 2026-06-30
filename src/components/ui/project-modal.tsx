"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FolderKanban, Loader2 } from "lucide-react";
import { type Project } from "@/types";
import CustomSelect from "@/components/ui/custom-select";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Partial<Project>) => Promise<void>;
  project?: Project | null;
}

const statusOptions = [
  { value: "active", label: "Active", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> },
  { value: "completed", label: "Completed", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-light)]" /> },
  { value: "archived", label: "Archived", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground-tertiary)]" /> },
];

export default function ProjectModal({ isOpen, onClose, onSubmit, project }: ProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "active");
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

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-md z-10 max-h-[90vh] overflow-y-auto rounded-md surface-elevated">
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--secondary-subtle)]">
              <FolderKanban className="h-4 w-4 text-[var(--secondary)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {project ? "Edit Project" : "New Project"}
              </h2>
              <p className="text-xs text-[var(--foreground-tertiary)]">
                {project ? "Update project details" : "Create a new project"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--foreground-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground-tertiary)]">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              autoFocus
              className="w-full rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground-tertiary)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this project about?"
              rows={3}
              className="w-full rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/30 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CustomSelect
              label="Status"
              value={status}
              options={statusOptions}
              onChange={(v) => setStatus(v)}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground-tertiary)]">Budget (€)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                min="0"
                step="100"
                className="w-full rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/30 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {project ? "Update" : "Create"}
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
