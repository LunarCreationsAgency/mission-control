"use client";

import { type Task } from "@/types";
import { Calendar, User, GripVertical } from "lucide-react";
import { useRef, useCallback } from "react";
import Link from "next/link";

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

export default function TaskCard({ task }: TaskCardProps) {
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.setData("currentStatus", task.status);
    e.dataTransfer.effectAllowed = "move";
    isDraggingRef.current = true;
    // Don't propagate to parent link
    e.stopPropagation();
  }, [task.id, task.status]);

  const handleDragEnd = useCallback(() => {
    // Delay reset so click handler can check
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // If this was a drag operation, prevent navigation
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Also check if mouse moved significantly (drag threshold)
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    if (dx > 5 || dy > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
    <Link
      href={`/tasks/${task.id}`}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        liquid-glass-subtle group block cursor-grab p-4 transition-all duration-200 hover:bg-white/5
        active:cursor-grabbing
      `}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-md px-2 py-0.5 ${priorityColors[task.priority] || priorityColors.medium}`}>
          {task.priority}
        </span>
        <GripVertical className="h-3.5 w-3.5 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
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
    </Link>
  );
}
