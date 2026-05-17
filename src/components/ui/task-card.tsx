"use client";

import { type Task } from "@/types";
import { Calendar, User } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, status: Task["status"]) => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  return (
    <div className="liquid-glass-subtle group cursor-pointer p-4 transition-all duration-200 hover:bg-white/5">
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-md px-2 py-0.5 ${priorityColors[task.priority] || priorityColors.medium}`}>
          {task.priority}
        </span>
      </div>
      <h4 className="mb-1 text-sm font-medium text-[var(--foreground)]">{task.title}</h4>
      {task.description && (
        <p className="mb-3 text-xs text-[var(--muted)] line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-3 text-[10px] text-[var(--muted)]">
        {task.assignee && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>Agent</span>
          </div>
        )}
        {task.due_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.due_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
