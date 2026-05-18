"use client";

import { type Task } from "@/types";
import TaskCard from "./task-card";
import { Plus, Trash2 } from "lucide-react";
import { useState, useCallback } from "react";

interface KanbanColumnProps {
  title: string;
  status: Task["status"];
  tasks: Task[];
  accent: string;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  draggingId: string | null;
}

export default function KanbanColumn({
  title,
  status,
  tasks,
  accent,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  draggingId,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only set isOver false if leaving the column (not entering a child)
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
    <div className="flex min-w-[270px] flex-1 flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full" style={{ background: accent }} />
          <h3 className="text-[13px] font-semibold text-[var(--foreground)] tracking-tight">{title}</h3>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/[0.04] px-1.5 text-[10px] font-semibold text-[var(--foreground-tertiary)] border border-white/[0.06]">
            {tasks.length}
          </span>
        </div>
        <button className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--foreground-tertiary)] hover:bg-white/[0.04] hover:text-[var(--foreground-secondary)] transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Column Body */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex flex-1 flex-col gap-2 rounded-[18px] border p-2.5 transition-all duration-300 min-h-[200px]
          ${isOver
            ? "border-[var(--primary)]/30 bg-[var(--primary)]/5 shadow-[0_0_40px_rgba(59,130,246,0.08)] scale-[1.01]"
            : "border-white/[0.03] bg-white/[0.01]"
          }
        `}
      >
        {tasks.length === 0 && !isOver ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-[11px] text-[var(--foreground-tertiary)]">Drop tasks here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
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
