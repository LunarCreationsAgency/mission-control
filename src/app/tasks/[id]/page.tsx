import { ArrowLeft, Calendar, User, Target, FolderKanban, Flag, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pbGetTasks } from "@/lib/pocketbase";
import { type Task } from "@/types";

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Low" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Medium" },
  high: { bg: "bg-orange-500/15", text: "text-orange-400", label: "High" },
  critical: { bg: "bg-red-500/15", text: "text-red-400", label: "Critical" },
};

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  todo: { bg: "bg-slate-500/15", text: "text-slate-400", label: "To Do", dot: "bg-slate-400" },
  in_progress: { bg: "bg-[var(--primary)]/15", text: "text-[var(--primary-light)]", label: "In Progress", dot: "bg-[var(--primary)]" },
  review: { bg: "bg-[var(--warning)]/15", text: "text-[var(--warning)]", label: "Review", dot: "bg-[var(--warning)]" },
  done: { bg: "bg-[var(--success)]/15", text: "text-[var(--success)]", label: "Done", dot: "bg-[var(--success)]" },
};

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await pbGetTasks();
  const tasks = (result.items as Task[]) || [];
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    notFound();
  }

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      {/* Header */}
      <div>
        <Link
          href="/tasks"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] transition-colors hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 ${status.bg} ${status.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 ${priority.bg} ${priority.text}`}>
            {priority.label}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 bg-red-500/15 text-red-400">
              <Clock className="h-3 w-3" />
              Overdue
            </span>
          )}
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)]">{task.title}</h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="liquid-glass p-5 lg:p-6">
            <h2 className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-[var(--foreground)]">Description</h2>
            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Activity placeholder */}
          <div className="liquid-glass p-5 lg:p-6">
            <h2 className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-[var(--foreground)]">Activity</h2>
            <p className="text-sm text-[var(--foreground-tertiary)]">Activity feed coming soon...</p>
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
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${status.bg} ${status.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                  <Flag className="h-4 w-4" />
                  Priority
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${priority.bg} ${priority.text}`}>
                  {priority.label}
                </span>
              </div>

              {/* Assignee */}
              {task.assignee && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                    <User className="h-4 w-4" />
                    Assignee
                  </div>
                  <span className="text-sm text-[var(--foreground)]">Agent</span>
                </div>
              )}

              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </div>
                  <span className={`text-sm ${isOverdue ? "text-red-400 font-medium" : "text-[var(--foreground)]"}`}>
                    {new Date(task.due_date).toLocaleDateString("de-DE")}
                  </span>
                </div>
              )}

              {/* Project */}
              {task.project && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                    <FolderKanban className="h-4 w-4" />
                    Project
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{task.project}</span>
                </div>
              )}

              {/* Goal */}
              {task.goal && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                    <Target className="h-4 w-4" />
                    Goal
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{task.goal}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="liquid-glass-subtle p-4">
            <div className="space-y-2 text-xs text-[var(--foreground-tertiary)]">
              <p>Created: {new Date(task.created).toLocaleDateString("de-DE")}</p>
              <p>Updated: {new Date(task.updated).toLocaleDateString("de-DE")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
