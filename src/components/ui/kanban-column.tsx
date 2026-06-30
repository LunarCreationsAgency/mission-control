"use client";

import { type Task } from "@/types";
import TaskCard from "./task-card";
import { Plus } from "lucide-react";
import { useState, useCallback } from "react";

interface KanbanColumnProps {
  title: string;
  status: Task["status"];
  tasks: Task[];
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  draggingId: string | null;
  getProjectName?: (projectId?: string) => string | undefined;
}

const statusPillMap: Record<string, string> = {
  todo: "status-pill-todo",
  in_progress: "status-pill-in_progress",
  review: "status-pill-review",
  done: "status-pill-done",
};

const statusDotMap: Record<string, string> = {
  todo: "bg-[var(--warning)]",
  in_progress: "bg-blue-400",
  review: "bg-violet-400",
  done: "bg-emerald-400",
};

export default function KanbanColumn({
  title,
  status,
  tasks,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  draggingId,
  getProjectName,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      const taskId = e.dataTransfer.getData("taskId");
      const currentStatus = e.dataTransfer.getData("currentStatus");
      if (taskId && currentStatus !== status) {
        onUpdate(taskId, { status });
      }
    },
    [status, onUpdate]
  );

  return (
    <div className="flex min-w-[280px] flex-1 flex-col">
      {/* Column Header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className={`status-pill ${statusPillMap[status] || statusPillMap.todo}`}>
            <span className={`dot ${statusDotMap[status]}`} />
            {title}
          </span>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] px-1.5 text-[10px] font-semibold text-[var(--foreground-tertiary)]">
            {tasks.length}
          </span>
        </div>
        <button className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--foreground-quaternary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground-secondary)] transition-all">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Column Body */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex flex-1 flex-col gap-1.5 rounded-lg border p-2 transition-all duration-200 min-h-[200px]
          ${isOver
            ? "border-[var(--primary-border)] bg-[var(--primary-subtle)]"
            : "border-[var(--border)] bg-[var(--surface)]"
          }
        `}
      >
        {tasks.length === 0 && !isOver ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-[11px] text-[var(--foreground-quaternary)]">Drop tasks here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              project={getProjectName?.(task.project)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingId === task.id}
            />
          ))
        )}
      </div>
    </div>
  );
}