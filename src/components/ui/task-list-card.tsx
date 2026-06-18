"use client";

import { type Task, type Project, type Agent } from "@/types";
import { Calendar, ArrowRight, Clock, Trash2, FolderKanban, Circle } from "lucide-react";
import Link from "next/link";

interface TaskListCardProps {
  task: Task;
  project?: Project;
  agent?: Agent;
  onDelete?: (id: string) => void;
}

const priorityConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  low: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Low" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Medium" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400", label: "High" },
  critical: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Critical" },
};

const statusConfig: Record<string, { dot: string; text: string }> = {
  todo: { dot: "bg-slate-400", text: "text-slate-400" },
  in_progress: { dot: "bg-[var(--primary)]", text: "text-[var(--primary-light)]" },
  review: { dot: "bg-[var(--warning)]", text: "text-[var(--warning)]" },
  done: { dot: "bg-[var(--success)]", text: "text-[var(--success)]" },
};

export default function TaskListCard({ task, project, agent, onDelete }: TaskListCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={`group block bg-[var(--surface-elevated)] rounded-2xl p-4 active:scale-[0.97] transition-transform select-none touch-manipulation ${
        isOverdue ? "border-l-[3px] border-l-red-500" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Left: content */}
        <div className="flex-1 min-w-0">
          {/* Top row: priority badge + status dot */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${priority.bg} ${priority.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
            <span className={`flex items-center gap-1 text-[11px] ${status.text}`}>
              <Circle className={`h-2 w-2 rounded-full ${status.dot}`} fill="currentColor" stroke="none" />
              {task.status === "in_progress" ? "In Progress" : task.status === "todo" ? "To Do" : task.status === "review" ? "Review" : "Done"}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-semibold text-[var(--foreground)] leading-snug mb-2">
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="text-[13px] text-[var(--foreground-tertiary)] line-clamp-2 leading-relaxed mb-3">
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {project && (
              <div className="inline-flex items-center gap-1 bg-[var(--primary)]/10 rounded-lg px-2 py-1 text-[var(--primary-light)] text-[11px]">
                <FolderKanban className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{project.name}</span>
              </div>
            )}
            {agent && (
              <span className="text-[11px] text-[var(--foreground-tertiary)]">
                {agent.name}
              </span>
            )}
            {task.due_date && (
              <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? "text-red-400" : "text-[var(--foreground-tertiary)]"}`}>
                {isOverdue ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                <span>{new Date(task.due_date).toLocaleDateString("de-DE")}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: actions column */}
        <div className="flex flex-col gap-2 shrink-0 items-center">
          {/* Delete button — always visible on mobile, hover on desktop */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-[var(--foreground-tertiary)] active:bg-red-500/20 active:text-red-400 transition-all lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {/* Chevron */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[var(--foreground-tertiary)]">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
