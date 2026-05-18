"use client";

import { type Task } from "@/types";
import { Calendar, User, ArrowRight, Clock, Trash2 } from "lucide-react";
import Link from "next/link";

interface TaskListCardProps {
  task: Task;
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

export default function TaskListCard({ task, onDelete }: TaskListCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <div className="group relative">
      <Link
        href={`/tasks/${task.id}`}
        className="block rounded-[20px] p-5 bg-white/[0.02] border border-white/[0.04] border-t-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 active:scale-[0.98]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Top row: badges */}
            <div className="flex items-center gap-2 mb-2">
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
            <h3 className="text-[15px] font-semibold text-[var(--foreground)] leading-snug mb-1.5 truncate">
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p className="text-[12px] text-[var(--foreground-tertiary)] line-clamp-2 leading-relaxed mb-3">
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-4 text-[11px] text-[var(--foreground-tertiary)]">
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

          {/* Arrow */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-[var(--foreground-tertiary)] group-hover:bg-white/[0.06] group-hover:text-[var(--foreground-secondary)] transition-all">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Link>

      {/* Delete button - visible on hover */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="absolute top-3 right-12 flex h-7 w-7 items-center justify-center rounded-lg text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all duration-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
