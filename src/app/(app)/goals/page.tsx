"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/data";
import { type Goal } from "@/types";
import { Target, Plus, Calendar, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import GoalModal from "@/components/ui/goal-modal";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary-subtle)]", dot: "bg-[var(--primary)]" },
  completed: { label: "Done", color: "text-[var(--success)]", bg: "bg-[var(--success-subtle)]", dot: "bg-[var(--success)]" },
  paused: { label: "Paused", color: "text-[var(--foreground-tertiary)]", bg: "bg-[var(--surface-hover)]", dot: "bg-[var(--foreground-quaternary)]" },
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Goals</h1>
          <p className="text-sm text-[var(--foreground-tertiary)] mt-1">Track objectives and milestones</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
            <Target className="h-4 w-4 text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">{goals.length}</span>
          </div>
          <button onClick={() => { setEditingGoal(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-[var(--background)] font-semibold px-4 py-2.5 text-sm transition-all"
          >
            <Plus className="h-4 w-4" /> New Goal
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 surface">
          <Target className="h-10 w-10 text-[var(--foreground-quaternary)] mb-4" />
          <p className="text-sm text-[var(--foreground-tertiary)] mb-4">No goals yet</p>
          <button onClick={() => { setEditingGoal(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--background)] hover:bg-[var(--primary-dark)]"
          >
            <Plus className="h-4 w-4" /> Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
  const progressColor = progress >= 80 ? "bg-[var(--success)]" : "bg-[var(--primary)]";
  const isDeleting = deletingId === goal.id;

  return (
    <div className="group surface-hover relative">
      <Link href={`/goals/${goal.id}`} className="block p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-md px-2 py-1 ${status.bg} ${status.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--foreground-quaternary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground-secondary)] transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isDeleting) { onDelete(); setDeletingId(null); } else { setDeletingId(goal.id); }
            }}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${isDeleting ? "bg-[var(--destructive-subtle)] text-[var(--destructive)]" : "text-[var(--foreground-quaternary)] hover:bg-[var(--destructive-subtle)] hover:text-[var(--destructive)]"}`}
            >
              {isDeleting ? <span className="text-[10px] font-bold">OK?</span> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <h3 className="text-[15px] font-semibold text-[var(--foreground)] leading-snug mb-1">{goal.name}</h3>
        {goal.description && (
          <p className="text-[13px] text-[var(--foreground-tertiary)] line-clamp-2 mb-4 leading-relaxed">{goal.description}</p>
        )}

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--foreground-tertiary)]">Progress</span>
            <span className="text-[11px] font-semibold text-[var(--foreground)]">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-active)] overflow-hidden">
            <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {goal.target_date ? (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-tertiary)]">
              <Calendar className="h-3 w-3" />
              <span>{new Date(goal.target_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
            </div>
          ) : <div />}
          <span className="text-[11px] text-[var(--foreground-tertiary)]">
            {progress >= 100 ? "Done" : progress >= 50 ? "On track" : "Started"}
          </span>
        </div>
      </Link>
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-24 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface skeleton h-40" />
        ))}
      </div>
    </div>
  );
}
