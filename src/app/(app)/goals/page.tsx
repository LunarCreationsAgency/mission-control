"use client";

import { useState, useEffect, useCallback } from "react";
import { type Goal } from "@/types";
import { Target, Loader2, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/goals", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGoals(data.goals || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  if (loading) return <GoalsSkeleton />;
  if (error) {
    return (
      <div className="space-y-8 page-enter pt-2 lg:pt-0">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Objectives</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Goals</h1>
        </div>
        <div className="liquid-glass border-red-500/20 p-8 text-center animated-card">
          <p className="text-sm text-red-400">Failed to load goals</p>
          <button onClick={fetchGoals} className="mt-3 text-xs text-[var(--primary-light)] hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter pt-2 lg:pt-0">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
            Objectives
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Goals</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Track progress on your strategic objectives
          </p>
        </div>
        <div className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2">
          <Target className="h-4 w-4 text-[var(--primary-light)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">{goals.length}</span>
          <span className="text-xs text-[var(--foreground-tertiary)]">total</span>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="liquid-glass p-12 text-center animated-card">
          <Target className="h-12 w-12 text-[var(--foreground-tertiary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--foreground-secondary)]">No goals yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map((goal, i) => (
            <Link key={goal.id} href={`/goals/${goal.id}`} className="block">
              <GoalCard goal={goal} delay={i * 0.05} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, delay }: { goal: Goal; delay: number }) {
  const progress = Math.min(100, Math.max(0, goal.progress || 0));
  const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary)]/15", dot: "bg-[var(--primary)]" },
    completed: { label: "Completed", color: "text-[var(--success)]", bg: "bg-[var(--success)]/15", dot: "bg-[var(--success)]" },
    paused: { label: "Paused", color: "text-[var(--foreground-tertiary)]", bg: "bg-white/5", dot: "bg-[var(--foreground-tertiary)]" },
  };
  const status = statusConfig[goal.status] || statusConfig.active;

  const progressColor = progress >= 80 ? "bg-[var(--success)]" : progress >= 40 ? "bg-[var(--primary)]" : "bg-[var(--primary)]/60";

  return (
    <div className="liquid-glass group p-6 animated-card hover-lift" style={{ animationDelay: `${delay}s` }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 ${status.bg} ${status.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[var(--foreground)] leading-snug truncate">
            {goal.name}
          </h3>
        </div>
        <div className="liquid-glass-subtle flex items-center justify-center h-11 w-11 shrink-0 ml-3">
          <Target className="h-5 w-5 text-[var(--primary-light)]" />
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-[12px] text-[var(--foreground-tertiary)] line-clamp-2 mb-4 leading-relaxed">
          {goal.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-[var(--foreground-tertiary)]">Progress</span>
          <span className="text-[11px] font-semibold text-[var(--foreground)]">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        {goal.target_date ? (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-tertiary)]">
            <Calendar className="h-3 w-3" />
            <span>Target: {new Date(goal.target_date).toLocaleDateString("de-DE")}</span>
          </div>
        ) : (
          <div />
        )}
        <span className="text-[11px] text-[var(--foreground-tertiary)]">
          {progress >= 100 ? "🎉 Complete" : progress >= 80 ? "Almost there" : progress >= 40 ? "In progress" : "Just started"}
        </span>
      </div>
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