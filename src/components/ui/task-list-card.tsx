"use client";

import { type Task, type Project } from "@/types";
import { Calendar, User, ArrowRight, Clock, Trash2, FolderKanban } from "lucide-react";
import Link from "next/link";

interface TaskListCardProps {
  task: Task;
  project?: Project;
  onDelete?: (id: string) => void;
}

const priorityConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  low: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Low" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Medium" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400", label: "High" },
  critical: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Critical" },
};

const statusConfig: Record<string, { dot: string; bg: string; label: string }> = {
  todo: { dot: "bg-slate-400", bg: "bg-slate-500/10", label: "To Do" },
  in_progress: { dot: "bg-[var(--primary)]", bg: "bg-[var(--primary)]/10", label: "In Progress" },
  review: { dot: "bg-[var(--warning)]", bg: "bg-[var(--warning)]/10", label: "Review" },
  done: { dot: "bg-[var(--success)]", bg: "bg-[var(--success)]/10", label: "Done" },
};

export default function TaskListCard({ task, project, onDelete }: TaskListCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <div className="group relative">
      <Link
        href={`/tasks/${task.id}`}
        className={`block rounded-2xl p-4 sm:p-5 bg-white/[0.02] border border-white/[0.04] border-t-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 active:scale-[0.98] select-none touch-manipulation ${
          isOverdue ? "border-l-[3px] border-l-red-500 shadow-[inset_3px_0_0_rgba(239,68,68,0.2)]" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Top row: badges */}
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${priority.bg} ${priority.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold rounded-lg px-2 py-1 ${status.bg} ${status.dot.replace("bg-", "text-")}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-[15px] font-semibold text-[var(--foreground)] leading-snug mb-1.5 pr-8">
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p className="text-[13px] sm:text-[12px] text-[var(--foreground-tertiary)] line-clamp-2 leading-relaxed mb-3">
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-[var(--foreground-tertiary)] flex-wrap">
              {project && (
                <div className="flex items-center gap-1 bg-[var(--primary)]/10 rounded-lg px-2 py-1 text-[var(--primary-light)]">
                  <FolderKanban className="h-3 w-3" />
                  <span>{project.name}</span>
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Agent</span>
                </div>
              )}
              {task.due_date && (
                <div className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : ""}`}>
                  {isOverdue ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                  <span>{new Date(task.due_date).toLocaleDateString("de-DE")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Arrow — larger tap target on mobile */}
          <div className="flex h-10 w-10 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-[var(--foreground-tertiary)] group-hover:bg-white/[0.06] group-hover:text-[var(--foreground-secondary)] transition-all">
            <ArrowRight className="h-5 w-5 sm:h-4 sm:w-4" />
          </div>
        </div>
      </Link>

      {/* Delete button — always visible on mobile (touch), hover-only on desktop */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="absolute top-3 right-3 sm:right-3 flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </button>
      )}
    </div>
  );
}
