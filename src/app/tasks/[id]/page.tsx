import { ArrowLeft, Calendar, User, Target, FolderKanban, Flag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pbGetTasks } from "@/lib/pocketbase";
import { type Task } from "@/types";

const priorityBgColors: Record<string, string> = {
  low: "bg-blue-500/15 text-blue-400",
  medium: "bg-yellow-500/15 text-yellow-400",
  high: "bg-orange-500/15 text-orange-400",
  critical: "bg-red-500/15 text-red-400",
};

const statusBgColors: Record<string, string> = {
  todo: "bg-slate-500/15 text-slate-400",
  in_progress: "bg-[var(--primary)]/15 text-[var(--primary)]",
  review: "bg-[var(--warning)]/15 text-[var(--warning)]",
  done: "bg-[var(--success)]/15 text-[var(--success)]",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await pbGetTasks();
  const tasks = (result.items as Task[]) || [];
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/tasks"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1 ${statusBgColors[task.status] || statusBgColors.todo}`}>
            {statusLabels[task.status] || task.status}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1 ${priorityBgColors[task.priority] || priorityBgColors.medium}`}>
            {task.priority}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{task.title}</h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="liquid-glass p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Description</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Activity placeholder */}
          <div className="liquid-glass p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Activity</h2>
            <p className="text-sm text-[var(--muted)]">Activity feed coming soon...</p>
          </div>
        </div>

        {/* Right Column - Meta */}
        <div className="space-y-4">
          <div className="liquid-glass p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              Details
            </h3>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Flag className="h-4 w-4" />
                  Status
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 ${statusBgColors[task.status] || statusBgColors.todo}`}>
                  {statusLabels[task.status] || task.status}
                </span>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Flag className="h-4 w-4" />
                  Priority
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 ${priorityBgColors[task.priority] || priorityBgColors.medium}`}>
                  {task.priority}
                </span>
              </div>

              {/* Assignee */}
              {task.assignee && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <User className="h-4 w-4" />
                    Assignee
                  </div>
                  <span className="text-sm text-[var(--foreground)]">Agent</span>
                </div>
              )}

              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </div>
                  <span className="text-sm text-[var(--foreground)]">
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Project */}
              {task.project && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <FolderKanban className="h-4 w-4" />
                    Project
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{task.project}</span>
                </div>
              )}

              {/* Goal */}
              {task.goal && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
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
            <div className="space-y-2 text-xs text-[var(--muted)]">
              <p>Created: {new Date(task.created).toLocaleDateString()}</p>
              <p>Updated: {new Date(task.updated).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
