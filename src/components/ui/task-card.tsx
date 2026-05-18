"use client";

import { type Task } from "@/types";
import { Calendar, User, GripVertical, Trash2, Pencil, FolderKanban } from "lucide-react";
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

const priorityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  low: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  critical: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
};

const statusColors: Record<string, string> = {
  todo: "border-l-zinc-500",
  in_progress: "border-l-[var(--primary)]",
  review: "border-l-[var(--warning)]",
  done: "border-l-[var(--success)]",
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

      // Create a custom drag image (optional)
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      e.dataTransfer.setDragImage(el, rect.width / 2, 20);
      e.stopPropagation();
    },
    [task.id, task.status, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      isDraggingRef.current = false;
      onDragEnd();
    }, 50);
  }, [onDragEnd]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      if (dx > 5 || dy > 5) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    []
  );

  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group relative border-l-[2.5px] rounded-[14px] p-3.5
        bg-white/[0.02] border border-white/[0.04] border-t-white/[0.06]
        hover:bg-white/[0.04] hover:border-white/[0.08]
        transition-all duration-200 cursor-grab
        ${isDragging ? "opacity-30 scale-95 rotate-1" : ""}
        ${statusColors[task.status] || statusColors.todo}
      `}
    >
      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      <Link
        href={`/tasks/${task.id}`}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className="block"
      >
        <div className="mb-2 flex items-center justify-between gap-2 pr-12">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg px-2 py-0.5 ${priority.bg} ${priority.text}`}
            >
              <span className={`h-1 w-1 rounded-full ${priority.dot}`} />
              {task.priority}
            </span>
          </div>
          <GripVertical className="h-3 w-3 text-[var(--foreground-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>

        <h4 className="mb-1 text-[13px] font-medium text-[var(--foreground)] leading-snug">
          {task.title}
        </h4>

        {task.description && (
          <p className="mb-3 text-[11px] text-[var(--foreground-tertiary)] line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-[10px] text-[var(--foreground-tertiary)]">
          {project && (
            <div className="flex items-center gap-1 bg-[var(--primary)]/10 rounded px-1.5 py-0.5">
              <FolderKanban className="h-3 w-3 text-[var(--primary-light)]" />
              <span className="text-[var(--primary-light)]">{project}</span>
            </div>
          )}
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Agent</span>
            </div>
          )}
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.due_date).toLocaleDateString("de-DE")}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
