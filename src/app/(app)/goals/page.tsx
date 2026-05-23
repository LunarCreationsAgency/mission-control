"use client";

import { useState, useCallback } from "react";
import { useData } from "@/lib/use-data";
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/data";
import { type Goal } from "@/types";
import { Target, Plus, Calendar, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import GoalModal from "@/components/ui/goal-modal";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary)]/15", dot: "bg-[var(--primary)]" },
  completed: { label: "Completed", color: "text-[var(--success)]", bg: "bg-[var(--success)]/15", dot: "bg-[var(--success)]" },
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
    <div className="space-y-8 page-enter pt-2 lg:pt-0">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Objectives</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Goals</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">Track progress on your strategic objectives</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2">
            <Target className="h-4 w-4 text-[var(--primary-light)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">{goals.length}</span>
            <span className="text-xs text-[var(--foreground-tertiary)]">total</span>
          </div>
          <button onClick={() => { setEditingGoal(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-4 py-2.5 text-sm transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" /> New Goal
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="liquid-glass p-12 text-center animated-card">
          <Target className="h-12 w-12 text-[var(--foreground-tertiary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--foreground-secondary)] mb-4">No goals yet. Create one to get started.</p>
          <button onClick={() => { setEditingGoal(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-4 py-2.5 text-sm transition-all">
            <Plus className="h-4 w-4" /> New Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map((goal, i) => (
            <GoalCard key={goal.id} goal={goal} delay={i * 0.05}
              onEdit={() => { setEditingGoal(goal); setModalOpen(true); }}
              onDelete={() => handleDelete(goal.id)}
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

function GoalCard({ goal, delay, onEdit, onDelete }: {
  goal: Goal; delay: number;
  onEdit: () => void; onDelete: () => void;
}) {
  const progress = Math.min(100, Math.max(0, goal.progress || 0));
  const status = statusConfig[goal.status] || statusConfig.active;
  const progressColor = progress >= 80 ? "bg-[var(--success)]" : progress >= 40 ? "bg-[var(--primary)]" : "bg-[var(--primary)]/60";
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="liquid-glass group p-6 animated-card hover-lift relative" style={{ animationDelay: `${delay}s` }}>
      {/* Action buttons — show on hover */}
      <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--foreground-tertiary)] hover:bg-white/[0.06] hover:text-white transition-all">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (confirmDelete) { onDelete(); } else { setConfirmDelete(true); } }}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${confirmDelete ? "bg-red-500/20 text-red-400" : "text-[var(--foreground-tertiary)] hover:bg-red-500/10 hover:text-red-400"}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {confirmDelete && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[20px]" style={{ background: "rgba(10,10,15,0.92)" }}>
          <p className="text-sm text-[var(--foreground-secondary)]">Delete this goal?</p>
          <div className="flex gap-2">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(false); }} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-[var(--foreground-secondary)] hover:bg-white/[0.06]">Cancel</button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">Delete</button>
          </div>
        </div>
      )}

      <Link href={`/goals/${goal.id}`} className="block">
        {/* Header */}
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

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[var(--foreground-tertiary)]">Progress</span>
            <span className="text-[11px] font-semibold text-[var(--foreground)]">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Footer */}
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
  );
}

function GoalsSkeleton() {
  return (
    <div className="space-y-8 pt-2 lg:pt-0">
      <div className="flex items-end justify-between">
        <div>
          <div className="skeleton h-3 w-20 mb-2" />
          <div className="skeleton h-8 w-24" />
        </div>
        <div className="skeleton h-9 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-52 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}