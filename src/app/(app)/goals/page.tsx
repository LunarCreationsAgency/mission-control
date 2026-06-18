"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/data";
import { type Goal } from "@/types";
import { Target, Plus, Calendar, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import GoalModal from "@/components/ui/goal-modal";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary)]/15", dot: "bg-[var(--primary)]" },
  completed: { label: "Done", color: "text-[var(--success)]", bg: "bg-[var(--success)]/15", dot: "bg-[var(--success)]" },
  paused: { label: "Paused", color: "text-[var(--foreground-tertiary)]", bg: "bg-white/5", dot: "bg-[var(--foreground-tertiary)]" },
};

import { useToast } from "@/components/ui/toast";

export default function GoalsPage() {
  const { success, error: toastError } = useToast();
  const { data: goals = [], loading, refetch } = useData<Goal[]>("goals", getGoals);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (data: Partial<Goal>) => {
    try {
      await createGoal(data as Record<string, unknown>);
      success("Goal created");
      refetch();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to create goal");
      throw e;
    }
  };

  const handleEdit = async (data: Partial<Goal>) => {
    if (!editingGoal) return;
    try {
      await updateGoal(editingGoal.id, data as Record<string, unknown>);
      success("Goal updated");
      setEditingGoal(null);
      refetch();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update goal");
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      success("Goal deleted");
      setDeletingId(null);
      refetch();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to delete goal");
    }
  };

  if (loading) return <GoalsSkeleton />;

  return (
    <div className="space-y-6 page-enter pt-2 lg:pt-0 pb-24 lg:pb-0">
      {/* Mobile: compact header */}
      <div className="lg:hidden flex items-center justify-between px-1 mb-2">
        <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Goals</h1>
        <span className="text-sm text-[var(--foreground-tertiary)]">{goals.length}</span>
      </div>

      {/* Desktop: full header */}
      <div className="hidden lg:flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Objectives</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Goals</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2">
            <Target className="h-4 w-4 text-[var(--primary-light)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">{goals.length}</span>
          </div>
          <button onClick={() => { setEditingGoal(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-4 py-2.5 text-sm transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" /> New Goal
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <button onClick={() => { setEditingGoal(null); setModalOpen(true); }}
        className="lg:hidden fixed bottom-24 right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-lg shadow-blue-500/30 active:scale-90 transition-transform"
        aria-label="New goal">
        <Plus className="h-6 w-6" />
      </button>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <Target className="h-12 w-12 text-[var(--foreground-tertiary)] mb-4" />
          <p className="text-sm text-[var(--foreground-secondary)] mb-6">No goals yet</p>
          <button onClick={() => { setEditingGoal(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Create Goal
          </button>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 px-3 lg:px-0">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal}
              onEdit={() => { setEditingGoal(goal); setModalOpen(true); }}
              onDelete={() => handleDelete(goal.id)}
              deletingId={deletingId}
              setDeletingId={setDeletingId}
            />
          ))}
        </div>
      )}

      <GoalModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingGoal(null); }}
        onSubmit={editingGoal ? handleEdit : handleCreate} goal={editingGoal}
      />
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete, deletingId, setDeletingId }: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  deletingId: string | null;
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const progress = Math.min(100, Math.max(0, goal.progress || 0));
  const status = statusConfig[goal.status] || statusConfig.active;
  const progressColor = progress >= 80 ? "bg-[var(--success)]" : progress >= 40 ? "bg-[var(--primary)]" : "bg-[var(--primary)]/60";
  const isDeleting = deletingId === goal.id;

  return (
    <div className="group relative">
      {/* Mobile card */}
      <div className="lg:hidden bg-[var(--surface-elevated)] rounded-2xl p-4">
        <Link href={`/goals/${goal.id}`} className="block">
          {/* Top row: badge + % + actions, all in one flex */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 shrink-0 ${status.bg} ${status.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
              </span>
              <span className="text-sm font-semibold text-[var(--foreground)]">{progress}%</span>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-[var(--foreground-tertiary)] active:bg-white/[0.08]"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isDeleting) { onDelete(); setDeletingId(null); } else { setDeletingId(goal.id); setTimeout(() => setDeletingId((prev) => prev === goal.id ? null : prev), 3000); }
              }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${isDeleting ? "bg-red-500/20 text-red-400" : "bg-white/[0.04] text-[var(--foreground-tertiary)] active:bg-red-500/20 active:text-red-400"}`}
              >
                {isDeleting ? <span className="text-[10px] font-bold">OK?</span> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <h3 className="text-base font-semibold text-[var(--foreground)] leading-snug mb-2">{goal.name}</h3>
          {goal.description && (
            <p className="text-[13px] text-[var(--foreground-tertiary)] line-clamp-2 mb-3">{goal.description}</p>
          )}
          <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-3">
            <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--foreground-tertiary)]">
            {goal.target_date ? (
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(goal.target_date).toLocaleDateString("de-DE")}</span>
            ) : <span />}
            <span>{progress >= 100 ? "🎉 Complete" : progress >= 80 ? "Almost there" : "In progress"}</span>
          </div>
        </Link>
      </div>

      {/* Desktop card */}
      <div className="hidden lg:block liquid-glass group p-6 animated-card hover-lift relative">
        <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--foreground-tertiary)] hover:bg-white/[0.06] hover:text-white transition-all">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (isDeleting) { onDelete(); setDeletingId(null); } else { setDeletingId(goal.id); } }}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${isDeleting ? "bg-red-500/20 text-red-400" : "text-[var(--foreground-tertiary)] hover:bg-red-500/10 hover:text-red-400"}`}
          >
            {isDeleting ? <span className="text-[10px] font-bold">OK?</span> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
        <Link href={`/goals/${goal.id}`} className="block">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 ${status.bg} ${status.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)] leading-snug truncate">{goal.name}</h3>
            </div>
            <div className="liquid-glass-subtle flex items-center justify-center h-11 w-11 shrink-0 ml-3">
              <Target className="h-5 w-5 text-[var(--primary-light)]" />
            </div>
          </div>
          {goal.description && (
            <p className="text-[12px] text-[var(--foreground-tertiary)] line-clamp-2 mb-4 leading-relaxed">{goal.description}</p>
          )}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-[var(--foreground-tertiary)]">Progress</span>
              <span className="text-[11px] font-semibold text-[var(--foreground)]">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            {goal.target_date ? (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-tertiary)]">
                <Calendar className="h-3 w-3" />
                <span>Target: {new Date(goal.target_date).toLocaleDateString("de-DE")}</span>
              </div>
            ) : <div />}
            <span className="text-[11px] text-[var(--foreground-tertiary)]">
              {progress >= 100 ? "🎉 Complete" : progress >= 80 ? "Almost there" : progress >= 40 ? "In progress" : "Just started"}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="space-y-6 pt-2 lg:pt-0 pb-24 lg:pb-0">
      <div className="lg:hidden skeleton h-6 w-20 rounded-lg mb-2" />
      <div className="hidden lg:flex items-end justify-between">
        <div><div className="skeleton h-3 w-20 mb-2" /><div className="skeleton h-8 w-24" /></div>
        <div className="skeleton h-9 w-24 rounded-xl" />
      </div>
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 px-3 lg:px-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--surface-elevated)] rounded-2xl h-40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
