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
  Filter,
  X,
} from "lucide-react";
import CustomSelect from "@/components/ui/custom-select";

const entityOptions = [
  { value: "", label: "All Types", icon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> },
  { value: "task", label: "Tasks", icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> },
  { value: "project", label: "Projects", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-light)]" /> },
  { value: "goal", label: "Goals", icon: <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> },
  { value: "agent", label: "Agents", icon: <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> },
];

const actionOptions = [
  { value: "", label: "All Actions", icon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> },
  { value: "created", label: "Created", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-light)]" /> },
  { value: "updated", label: "Updated", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" /> },
  { value: "deleted", label: "Deleted", icon: <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> },
  { value: "completed", label: "Completed", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> },
  { value: "paused", label: "Paused", icon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> },
  { value: "resumed", label: "Resumed", icon: <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> },
];

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = filterEntity || filterAction;

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

  const filteredLogs = logs.filter((log) => {
    if (filterEntity && log.entity_type !== filterEntity) return false;
    if (filterAction && log.action !== filterAction) return false;
    return true;
  });

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

  const groupedLogs = groupByDate(filteredLogs);
  const sortedKeys = Object.keys(groupedLogs);

  const clearFilters = () => {
    setFilterEntity("");
    setFilterAction("");
  };

  if (loading) return <ActivitySkeleton />;

  if (error) {
    return (
      <div className="space-y-8  pt-2 lg:pt-0">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
            Timeline
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Activity</h1>
        </div>
        <div className="surface-elevated border-red-500/20 p-8 text-center ">
          <p className="text-sm text-[var(--destructive)]">Failed to load activity</p>
          <button onClick={fetchLogs} className="mt-3 text-xs text-[var(--primary-light)] hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8  pt-2 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
            Timeline
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Activity</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Recent actions across your workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="surface flex items-center gap-2 px-3.5 py-2">
            <Activity className="h-4 w-4 text-[var(--primary-light)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">{filteredLogs.length}</span>
            <span className="text-xs text-[var(--foreground-tertiary)]">{hasFilters ? "filtered" : "events"}</span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`surface flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
              hasFilters ? "text-[var(--primary-light)] bg-[var(--primary-subtle)]" : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filter
            {hasFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--foreground)]">
                {[filterEntity, filterAction].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 " style={{ animation: "fadeInScale 0.2s ease forwards" }}>
          <div className="w-full sm:w-auto sm:min-w-[180px] lg:min-w-[200px]">
            <CustomSelect
              label="Entity Type"
              value={filterEntity}
              options={entityOptions}
              onChange={(v) => setFilterEntity(v)}
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[180px] lg:min-w-[200px]">
            <CustomSelect
              label="Action"
              value={filterAction}
              options={actionOptions}
              onChange={(v) => setFilterAction(v)}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs font-medium text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      )}

      {/* Activity Feed */}
      {filteredLogs.length === 0 ? (
        <div className="surface-elevated p-12 text-center ">
          <Activity className="h-12 w-12 text-[var(--foreground-tertiary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--foreground-secondary)]">
            {hasFilters ? "No activity matches your filters" : "No activity yet. Actions will appear here."}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-xs text-[var(--primary-light)] hover:underline">
              Clear filters
            </button>
          )}
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
      bg: "bg-[var(--primary-subtle)]",
      label: "Created",
    },
    updated: {
      icon: <Pencil className="h-3.5 w-3.5" />,
      color: "text-[var(--warning)]",
      bg: "bg-[var(--warning-subtle)]",
      label: "Updated",
    },
    deleted: {
      icon: <Trash2 className="h-3.5 w-3.5" />,
      color: "text-[var(--destructive)]",
      bg: "bg-red-500/15",
      label: "Deleted",
    },
    paused: {
      icon: <Pause className="h-3.5 w-3.5" />,
      color: "text-[var(--foreground-tertiary)]",
      bg: "bg-[var(--surface)]",
      label: "Paused",
    },
    resumed: {
      icon: <Play className="h-3.5 w-3.5" />,
      color: "text-[var(--success)]",
      bg: "bg-[var(--success-subtle)]",
      label: "Resumed",
    },
    completed: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      color: "text-[var(--success)]",
      bg: "bg-[var(--success-subtle)]",
      label: "Completed",
    },
  };

  const config = actionConfig[log.action] || {
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-[var(--foreground-tertiary)]",
    bg: "bg-[var(--surface)]",
    label: log.action,
  };

  const time = new Date(log.created).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="group flex items-start gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] border-t-white/[0.06] hover:bg-[var(--surface-elevated)] transition-all duration-200 "
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
              <div key={i} className="skeleton h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
