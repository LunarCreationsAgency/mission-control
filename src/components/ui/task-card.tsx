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

const priorityConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  low: { bg: "bg-blue-500/10", text: "text-[var(--primary-light)]", dot: "bg-blue-400", label: "Low" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Medium" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400", label: "High" },
  critical: { bg: "bg-red-500/10", text: "text-[var(--destructive)]", dot: "bg-red-400", label: "Critical" },
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
      if (dx > 4 || dy > 4) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    []
  );

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <Link
      href={`/tasks/${task.id}`}
      draggable
      onMouseDown={handleMouseDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`group block bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] p-3.5 hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-all active:scale-[0.97] cursor-grab ${
        isDragging ? "opacity-40" : ""
      } ${isOverdue ? "border-l-[3px] border-l-red-500" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Priority + Status */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-semibold rounded-md px-1.5 py-0.5 ${priority.bg} ${priority.text}`}>
              <span className={`inline-block h-1 w-1 rounded-full mr-1 ${priority.dot}`} />
              {priority.label}
            </span>
            {isOverdue && (
              <span className="text-[10px] font-semibold text-[var(--destructive)] bg-red-500/10 rounded-md px-1.5 py-0.5">Overdue</span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-[var(--foreground)] leading-snug mb-1 truncate">{task.title}</h3>

          {/* Project + Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            {project && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--foreground-tertiary)]">
                <FolderKanban className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{project}</span>
              </span>
            )}
            {task.due_date && (
              <span className={`inline-flex items-center gap-1 text-[11px] ${isOverdue ? "text-[var(--destructive)]" : "text-[var(--foreground-tertiary)]"}`}>
                <Calendar className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>

        <div className="text-[var(--foreground-quaternary)] opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}