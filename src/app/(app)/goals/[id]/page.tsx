"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getGoals, updateGoal, deleteGoal } from "@/lib/data";
import { type Goal } from "@/types";
import { ArrowLeft, Target, Calendar, Flag, TrendingUp, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import GoalModal from "@/components/ui/goal-modal";
import { useToast } from "@/components/ui/toast";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary-subtle)]", dot: "bg-[var(--primary)]" },
  completed: { label: "Done", color: "text-[var(--success)]", bg: "bg-[var(--success-subtle)]", dot: "bg-[var(--success)]" },
  paused: { label: "Paused", color: "text-[var(--foreground-tertiary)]", bg: "bg-[var(--surface-hover)]", dot: "bg-[var(--foreground-quaternary)]" },
};

export default function GoalDetailPage() {
  const { success, error: toastError } = useToast();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: goals = [], loading, refetch } = useData<Goal[]>("goals", getGoals);
  const goal = goals.find((g) => g.id === id);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = async (data: Partial<Goal>) => {
    try {
      await updateGoal(id, data as Record<string, unknown>);
      success("Goal updated");
      setEditModalOpen(false);
      refetch();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update goal");
      throw e;
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteGoal(id);
      success("Goal deleted");
      router.push("/goals");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to delete goal");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6 py-4 lg:py-6">
        <div className="skeleton h-5 w-32 mb-3" />
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="surface skeleton h-32" />
            <div className="surface skeleton h-48" />
          </div>
          <div className="surface skeleton h-64" />
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <p className="text-[var(--foreground-secondary)] text-lg font-medium mb-4">Goal not found</p>
        <Link href="/goals" className="text-sm text-[var(--primary-light)] hover:underline">← Back to Goals</Link>
      </div>
    );
  }

  const status = statusConfig[goal.status] || statusConfig.active;
  const progress = Math.min(100, Math.max(0, goal.progress || 0));
  const progressColor = progress >= 80 ? "bg-[var(--success)]" : "bg-[var(--primary)]";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 lg:px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs text-[var(--foreground-tertiary)] mb-3">
          <Link href="/goals" className="hover:text-[var(--foreground-secondary)] transition-colors">Goals</Link>
          <span className="text-[var(--foreground-quaternary)]">/</span>
          <span className="text-[var(--foreground-secondary)]">{goal.name}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-md px-2 py-1 ${status.bg} ${status.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-semibold text-[var(--foreground)] tracking-tight">{goal.name}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] transition-all"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground-tertiary)] hover:bg-[var(--destructive-subtle)] hover:border-[var(--destructive-border)] hover:text-[var(--destructive)] transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setDeleteConfirm(false)}
                  className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
                >Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-1.5 rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting && <Loader2 className="h-3 w-3 animate-spin" />} Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="surface p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Progress</h2>
                <span className="text-xl font-bold text-[var(--foreground)]">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-active)] overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[var(--foreground-tertiary)]">
                {progress >= 100 ? "Goal completed!" : progress >= 80 ? "Almost there." : progress >= 40 ? "Good progress." : "Just getting started."}
              </p>
            </div>

            <div className="surface p-5">
              <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Description</h2>
              <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{goal.description || "No description provided."}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="surface p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-4">Details</h3>
              <div className="space-y-0">
                <div className="property-row">
                  <span className="property-label">Status</span>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-md px-2 py-0.5 ${status.bg} ${status.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <div className="property-row">
                  <span className="property-label">Progress</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{progress}%</span>
                </div>
                {goal.target_date && (
                  <div className="property-row">
                    <span className="property-label">Target Date</span>
                    <span className="text-sm text-[var(--foreground)]">{new Date(goal.target_date).toLocaleDateString("de-DE")}</span>
                  </div>
                )}
                {goal.project && (
                  <div className="property-row">
                    <span className="property-label">Project</span>
                    <span className="text-sm text-[var(--primary-light)]">{goal.project}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="surface p-4">
              <div className="flex justify-between text-[11px] text-[var(--foreground-quaternary)]">
                <span>Created {new Date(goal.created).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
                <span>Updated {new Date(goal.updated).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GoalModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} onSubmit={handleEdit} goal={goal} />
    </div>
  );
}