"use client";

import { type Task } from "@/types";
import TaskCard from "./task-card";
import { Plus } from "lucide-react";
import { useState, useCallback } from "react";

interface KanbanColumnProps {
  title: string;
  status: Task["status"];
  tasks: Task[];
  accent: string;
  onUpdate: (id: string, status: Task["status"]) => void;
}

export default function KanbanColumn({ title, status, tasks, accent, onUpdate }: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    const currentStatus = e.dataTransfer.getData("currentStatus");
    if (taskId && currentStatus !== status) {
      onUpdate(taskId, status);
    }
  }, [status, onUpdate]);

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
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex flex-1 flex-col gap-2 rounded-xl border p-2 transition-all duration-200 min-h-[200px]
          ${isOver 
            ? "border-white/20 bg-white/[0.06]" 
            : "border-white/[0.04] bg-white/[0.02]"
          }
        `}
      >
        {tasks.length === 0 && !isOver ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-[var(--muted)]">Drop tasks here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={onUpdate} />
          ))
        )}
      </div>
    </div>
  );
}
