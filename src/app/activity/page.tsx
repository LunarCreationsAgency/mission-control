"use client";

import { useState, useEffect, useCallback } from "react";
import { type ActivityLog } from "@/types";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/activity-logs", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const groupByDate = (logs: ActivityLog[]) => {
    const groups: Record<string, ActivityLog[]> = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    logs.forEach((log) => {
      const date = new Date(log.created).toDateString();
      let label = date;
      if (date === today) label = "Today";
      else if (date === yesterday) label = "Yesterday";
      else label = new Date(log.created).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

      if (!groups[label]) groups[label] = [];
      groups[label].push(log);
    });

    return groups;
  };

  const groupedLogs = groupByDate(logs);
  const sortedKeys = Object.keys(groupedLogs);

  if (loading) return <ActivitySkeleton />;

  if (error) {
    return (
      <div className="space-y-8 page-enter pt-2 lg:pt-0">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
            Timeline
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Activity</h1>
        </div>
        <div className="liquid-glass border-red-500/20 p-8 text-center animated-card">
          <p className="text-sm text-red-400">Failed to load activity</p>
          <button onClick={fetchLogs} className="mt-3 text-xs text-[var(--primary-light)] hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter pt-2 lg:pt-0">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
            Timeline
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Activity</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Recent actions across your workspace
          </p>
        </div>
        <div className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2">
          <Activity className="h-4 w-4 text-[var(--primary-light)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">{logs.length}</span>
          <span className="text-xs text-[var(--foreground-tertiary)]">events</span>
        </div>
      </div>

      {/* Activity Feed */}
      {logs.length === 0 ? (
        <div className="liquid-glass p-12 text-center animated-card">
          <Activity className="h-12 w-12 text-[var(--foreground-tertiary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--foreground-secondary)]">No activity yet. Actions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedKeys.map((dateLabel) => (
            <div key={dateLabel}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-3 sticky top-0 bg-[var(--background)]/80 backdrop-blur-sm py-2 z-10">
                {dateLabel}
              </h3>
              <div className="space-y-2">
                {groupedLogs[dateLabel].map((log, i) => (
                  <ActivityItem key={log.id} log={log} delay={i * 0.03} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ log, delay }: { log: ActivityLog; delay: number }) {
  const actionConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    created: {
      icon: <Plus className="h-3.5 w-3.5" />,
      color: "text-[var(--primary-light)]",
      bg: "bg-[var(--primary)]/15",
      label: "Created",
    },
    updated: {
      icon: <Pencil className="h-3.5 w-3.5" />,
      color: "text-[var(--warning)]",
      bg: "bg-[var(--warning)]/15",
      label: "Updated",
    },
    deleted: {
      icon: <Trash2 className="h-3.5 w-3.5" />,
      color: "text-red-400",
      bg: "bg-red-500/15",
      label: "Deleted",
    },
    paused: {
      icon: <Pause className="h-3.5 w-3.5" />,
      color: "text-[var(--foreground-tertiary)]",
      bg: "bg-white/5",
      label: "Paused",
    },
    resumed: {
      icon: <Play className="h-3.5 w-3.5" />,
      color: "text-[var(--success)]",
      bg: "bg-[var(--success)]/15",
      label: "Resumed",
    },
    completed: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      color: "text-[var(--success)]",
      bg: "bg-[var(--success)]/15",
      label: "Completed",
    },
  };

  const config = actionConfig[log.action] || {
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-[var(--foreground-tertiary)]",
    bg: "bg-white/5",
    label: log.action,
  };

  const time = new Date(log.created).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="group flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-t-white/[0.06] hover:bg-white/[0.04] transition-all duration-200 animated-card"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Icon */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.color}`}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-[var(--foreground)]">
            <span className="font-medium">{config.label}</span>{" "}
            <span className="text-[var(--foreground-secondary)]">{log.entity_type}</span>
          </p>
          <span className="text-[10px] text-[var(--foreground-tertiary)] shrink-0">{time}</span>
        </div>
        <p className="text-[12px] text-[var(--foreground-tertiary)] truncate">
          {log.entity_name || log.details || "No details"}
        </p>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-8 pt-2 lg:pt-0">
      <div className="flex items-end justify-between">
        <div>
          <div className="skeleton h-3 w-20 mb-2" />
          <div className="skeleton h-8 w-28" />
        </div>
        <div className="skeleton h-9 w-28 rounded-xl" />
      </div>
      <div className="space-y-6">
        <div>
          <div className="skeleton h-4 w-24 mb-3" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-16 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
