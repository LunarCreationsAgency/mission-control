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

const priorityConfig: Record<string, { pill: string; dot: string; label: string }> = {
  low: { pill: "bg-blue-500/10 text-[var(--primary-light)]", dot: "bg-blue-400", label: "Low" },
  medium: { pill: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400", label: "Medium" },
  high: { pill: "bg-orange-500/10 text-orange-400", dot: "bg-orange-400", label: "High" },
  critical: { pill: "bg-red-500/10 text-[var(--destructive)]", dot: "bg-red-400", label: "Critical" },
};

const statusConfig: Record<string, { dot: string; text: string }> = {
  todo: { dot: "bg-amber-400", text: "text-amber-400" },
  in_progress: { dot: "bg-blue-400", text: "text-[var(--primary-light)]" },
  review: { dot: "bg-violet-400", text: "text-violet-400" },
  done: { dot: "bg-emerald-400", text: "text-[var(--success)]" },
};

export default function TaskListCard({ task, project, agent, onDelete }: TaskListCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={`group block rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition-all active:scale-[0.97] select-none touch-manipulation ${
        isOverdue ? "border-l-[3px] border-l-red-500" : ""
      } hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Top: priority + status */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md px-2 py-0.5 ${priority.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
            <span className={`flex items-center gap-1.5 text-[11px] ${status.text}`}>
              <Circle className="h-1.5 w-1.5" fill="currentColor" stroke="none" />
              {task.status === "in_progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
          </div>

          <h3 className="text-[15px] font-semibold text-[var(--foreground)] leading-snug mb-2">
            {task.title}
          </h3>

          {task.description && (
            <p className="text-[13px] text-[var(--foreground-tertiary)] line-clamp-2 leading-relaxed mb-3">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {project && (
              <div className="inline-flex items-center gap-1 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded-md px-2 py-0.5 text-[11px] text-[var(--primary-light)]">
                <FolderKanban className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{project.name}</span>
              </div>
            )}
            {agent && (
              <span className="text-[11px] text-[var(--foreground-tertiary)]">{agent.name}</span>
            )}
            {task.due_date && (
              <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? "text-[var(--destructive)] font-medium" : "text-[var(--foreground-tertiary)]"}`}>
                {isOverdue ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                {new Date(task.due_date).toLocaleDateString("de-DE")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 items-center">
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(task.id); }}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-tertiary)] active:bg-[var(--destructive-subtle)] active:text-[var(--destructive)] active:border-[var(--destructive-border)] transition-all lg:opacity-0 lg:group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-tertiary)]">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}