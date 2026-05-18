import { ArrowLeft, Target, Calendar, FolderKanban, Flag, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pbGetGoals } from "@/lib/pocketbase";
import { type Goal } from "@/types";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary)]/15", dot: "bg-[var(--primary)]" },
  completed: { label: "Completed", color: "text-[var(--success)]", bg: "bg-[var(--success)]/15", dot: "bg-[var(--success)]" },
  paused: { label: "Paused", color: "text-[var(--foreground-tertiary)]", bg: "bg-white/5", dot: "bg-[var(--foreground-tertiary)]" },
};

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await pbGetGoals();
  const goals = (result.items as Goal[]) || [];
  const goal = goals.find((g) => g.id === id);

  if (!goal) {
    notFound();
  }

  const status = statusConfig[goal.status] || statusConfig.active;
  const progress = Math.min(100, Math.max(0, goal.progress || 0));
  const progressColor = progress >= 80 ? "bg-[var(--success)]" : progress >= 40 ? "bg-[var(--primary)]" : "bg-[var(--primary)]/60";

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      {/* Header */}
      <div>
        <Link
          href="/goals"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] transition-colors hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Goals
        </Link>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 ${status.bg} ${status.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)]">
          {goal.name}
        </h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Left Column - Progress & Description */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Progress */}
          <div className="liquid-glass p-5 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">
                Progress
              </h2>
              <span className="text-2xl font-bold text-[var(--foreground)]">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--foreground-tertiary)]">
              {progress >= 100
                ? "🎉 Goal completed! Great work."
                : progress >= 80
                ? "Almost there! Final stretch."
                : progress >= 40
                ? "Good progress. Keep it up."
                : "Just getting started. Build momentum."}
            </p>
          </div>

          {/* Description */}
          <div className="liquid-glass p-5 lg:p-6">
            <h2 className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-[var(--foreground)]">
              Description
            </h2>
            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
              {goal.description || "No description provided."}
            </p>
          </div>

          {/* Tasks placeholder */}
          <div className="liquid-glass p-5 lg:p-6">
            <h2 className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-[var(--foreground)]">
              Linked Tasks
            </h2>
            <p className="text-sm text-[var(--foreground-tertiary)]">
              Task list coming soon...
            </p>
          </div>
        </div>

        {/* Right Column - Meta */}
        <div className="space-y-4">
          <div className="liquid-glass p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">
              Details
            </h3>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                  <Flag className="h-4 w-4" />
                  Status
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${status.bg} ${status.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                  <TrendingUp className="h-4 w-4" />
                  Progress
                </div>
                <span className="text-sm font-semibold text-[var(--foreground)]">{progress}%</span>
              </div>

              {/* Target Date */}
              {goal.target_date && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                    <Calendar className="h-4 w-4" />
                    Target Date
                  </div>
                  <span className="text-sm text-[var(--foreground)]">
                    {new Date(goal.target_date).toLocaleDateString("de-DE")}
                  </span>
                </div>
              )}

              {/* Project */}
              {goal.project && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                    <FolderKanban className="h-4 w-4" />
                    Project
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{goal.project}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="liquid-glass-subtle p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--foreground-tertiary)]">
                <span>Goal ID</span>
                <span>{goal.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--foreground-tertiary)]">
                <span>Project Link</span>
                <span>{goal.project || "None"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
