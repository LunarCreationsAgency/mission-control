"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getGoals, updateGoal, deleteGoal } from "@/lib/data";
import { type Goal } from "@/types";
import { ArrowLeft, Target, Calendar, FolderKanban, Flag, TrendingUp, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import GoalModal from "@/components/ui/goal-modal";
import { useToast } from "@/components/ui/toast";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary)]/15", dot: "bg-[var(--primary)]" },
  completed: { label: "Completed", color: "text-[var(--success)]", bg: "bg-[var(--success)]/15", dot: "bg-[var(--success)]" },
  paused: { label: "Paused", color: "text-[var(--foreground-tertiary)]", bg: "bg-white/5", dot: "bg-[var(--foreground-tertiary)]" },
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
      <div className="space-y-6 pt-2 lg:pt-0">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-4"><div className="skeleton h-32 rounded-[20px]" /><div className="skeleton h-48 rounded-[20px]" /></div>
          <div className="skeleton h-64 rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="space-y-6 pt-2 lg:pt-0">
        <Link href="/goals" className="inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Goals
        </Link>
        <div className="liquid-glass p-12 text-center"><p className="text-[var(--foreground-secondary)]">Goal not found.</p></div>
      </div>
    );
  }

  const status = statusConfig[goal.status] || statusConfig.active;
  const progress = Math.min(100, Math.max(0, goal.progress || 0));
  const progressColor = progress >= 80 ? "bg-[var(--success)]" : progress >= 40 ? "bg-[var(--primary)]" : "bg-[var(--primary)]/60";

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <div>
        <Link href="/goals" className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] transition-colors hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Goals
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 ${status.bg} ${status.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)]">{goal.name}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-white/[0.06] transition-all">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(false)}
                  className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-[var(--foreground-secondary)] hover:bg-white/[0.06]">Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 transition-all disabled:opacity-50">
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="liquid-glass p-5 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Progress</h2>
              <span className="text-2xl font-bold text-[var(--foreground)]">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`} style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-[var(--foreground-tertiary)]">
              {progress >= 100 ? "🎉 Goal completed! Great work." : progress >= 80 ? "Almost there! Final stretch." : progress >= 40 ? "Good progress. Keep it up." : "Just getting started. Build momentum."}
            </p>
          </div>
          <div className="liquid-glass p-5 lg:p-6">
            <h2 className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-[var(--foreground)]">Description</h2>
            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{goal.description || "No description provided."}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="liquid-glass p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><Flag className="h-4 w-4" /> Status</div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${status.bg} ${status.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><TrendingUp className="h-4 w-4" /> Progress</div>
                <span className="text-sm font-semibold text-[var(--foreground)]">{progress}%</span>
              </div>
              {goal.target_date && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><Calendar className="h-4 w-4" /> Target Date</div>
                  <span className="text-sm text-[var(--foreground)]">{new Date(goal.target_date).toLocaleDateString("de-DE")}</span>
                </div>
              )}
              {goal.project && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><FolderKanban className="h-4 w-4" /> Project</div>
                  <span className="text-sm text-[var(--foreground)]">{goal.project}</span>
                </div>
              )}
            </div>
          </div>
          <div className="liquid-glass-subtle p-4">
            <div className="space-y-2 text-xs text-[var(--foreground-tertiary)]">
              <p>Created: {new Date(goal.created).toLocaleDateString("de-DE")}</p>
              <p>Updated: {new Date(goal.updated).toLocaleDateString("de-DE")}</p>
            </div>
          </div>
        </div>
      </div>

      <GoalModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} onSubmit={handleEdit} goal={goal} />
    </div>
  );
}