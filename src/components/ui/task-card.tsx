"use client";

import { type Task } from "@/types";
import { Calendar, User, GripVertical, Trash2, FolderKanban } from "lucide-react";
import { useRef, useCallback } from "react";
import Link from "next/link";

interface TaskCardProps {
  task: Task;
  project?: string;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}

const priorityConfig: Record<string, { pill: string; dot: string; label: string }> = {
  low: { pill: "status-pill-todo", dot: "bg-blue-400", label: "Low" },
  medium: { pill: "status-pill-todo", dot: "bg-amber-400", label: "Medium" },
  high: { pill: "status-pill-review", dot: "bg-orange-400", label: "High" },
  critical: { pill: "status-pill-done", dot: "bg-red-400", label: "Critical" },
};

const priorityBorder: Record<string, string> = {
  low: "border-l-blue-400/60",
  medium: "border-l-amber-400/60",
  high: "border-l-orange-400/60",
  critical: "border-l-red-400/60",
};

export default function TaskCard({
  task,
  project,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
}: TaskCardProps) {
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("taskId", task.id);
      e.dataTransfer.setData("currentStatus", task.status);
      e.dataTransfer.effectAllowed = "move";
      isDraggingRef.current = true;
      onDragStart(task.id);
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      e.dataTransfer.setDragImage(el, rect.width / 2, 20);
      e.stopPropagation();
    },
    [task.id, task.status, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    setTimeout(() => { isDraggingRef.current = false; onDragEnd(); }, 50);
  }, [onDragEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) { e.preventDefault(); e.stopPropagation(); return; }
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    if (dx > 5 || dy > 5) { e.preventDefault(); e.stopPropagation(); }
  }, []);

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group relative border-l-[2.5px] rounded-lg p-3
        bg-[var(--surface-elevated)] border border-[var(--border)]
        hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]
        transition-all duration-150 cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-30 scale-[0.98]" : ""}
        ${isOverdue ? "border-l-red-500" : priorityBorder[task.priority] || priorityBorder.medium}
      `}
    >
      {/* Delete button on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(task.id); }}
          className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--foreground-tertiary)] hover:bg-[var(--destructive-subtle)] hover:text-red-400 transition-all"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <Link
        href={`/tasks/${task.id}`}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className="block"
      >
        {/* Priority badge */}
        <div className="mb-2 flex items-center justify-between">
          <span className={`status-pill ${priority.pill}`}>
            <span className={`dot ${priority.dot}`} />
            {priority.label}
          </span>
          <GripVertical className="h-3 w-3 text-[var(--foreground-quaternary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>

        <h4 className="mb-1 text-[13px] font-medium text-[var(--foreground)] leading-snug pr-8">
          {task.title}
        </h4>

        {task.description && (
          <p className="mb-3 text-[11px] text-[var(--foreground-tertiary)] line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-quaternary)]">
          {project && (
            <div className="inline-flex items-center gap-1 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded px-1.5 py-0.5">
              <FolderKanban className="h-2.5 w-2.5 text-[var(--primary-light)]" />
              <span className="text-[var(--primary-light)] truncate max-w-[80px]">{project}</span>
            </div>
          )}
          {task.assignee && (
            <span className="flex items-center gap-1">
              <User className="h-2.5 w-2.5" />
              Agent
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(task.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}