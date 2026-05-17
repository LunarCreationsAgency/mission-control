"use client";

import { type Task } from "@/types";
import TaskCard from "./task-card";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
  title: string;
  status: Task["status"];
  tasks: Task[];
  accent: string;
  onUpdate: (id: string, status: Task["status"]) => void;
}

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export default function KanbanColumn({ title, status, tasks, accent, onUpdate }: KanbanColumnProps) {
  const nextStatus: Record<string, Task["status"]> = {
    todo: "in_progress",
    in_progress: "review",
    review: "done",
    done: "done",
  };

  const handleCardClick = (task: Task) => {
    if (task.status !== "done") {
      onUpdate(task.id, nextStatus[task.status]);
    }
  };

  return (
    <div className="flex min-w-[280px] flex-1 flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: accent }} />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
          <span className="text-xs text-[var(--muted)]">({tasks.length})</span>
        </div>
        <button className="liquid-glass-subtle flex h-6 w-6 items-center justify-center text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Column Body */}
      <div className="flex flex-1 flex-col gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-[var(--muted)]">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} onClick={() => handleCardClick(task)}>
              <TaskCard task={task} onUpdate={onUpdate} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
