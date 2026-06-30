"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getAgents, getTasks } from "@/lib/data";
import { type Agent, type Task } from "@/types";
import { ArrowLeft, Bot, Pause, Play, Clock, Activity, ListTodo, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export default function AgentDetailPage() {
  const { success, error: toastError } = useToast();
  const params = useParams();
  const id = params.id as string;

  const { data: agents = [], loading: agentsLoading, refetch: refetchAgents } = useData<Agent[]>("agents", getAgents, { refreshInterval: 30000 });
  const { data: tasks = [], loading: tasksLoading } = useData<Task[]>("tasks", getTasks, { refreshInterval: 30000 });

  const loading = agentsLoading || tasksLoading;
  const agent = agents.find((a) => a.id === id);
  const agentTasks = tasks.filter((t) => t.assignee === id);

  const [toggling, setToggling] = useState(false);

  const toggleAgent = async (paused: boolean) => {
    if (!agent) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: !paused }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      success(paused ? "Agent resumed" : "Agent paused");
      refetchAgents();
    } catch (e) {
      toastError("Failed to update agent");
    } finally {
      setToggling(false);
    }
  };

  const statusConfig: Record<string, { label: string; pill: string; dot: string }> = {
    todo: { label: "To Do", pill: "status-pill-todo", dot: "bg-amber-400" },
    in_progress: { label: "In Progress", pill: "status-pill-in_progress", dot: "bg-blue-400" },
    review: { label: "Review", pill: "status-pill-review", dot: "bg-violet-400" },
    done: { label: "Done", pill: "status-pill-done", dot: "bg-emerald-400" },
  };

  const priorityConfig: Record<string, { bg: string; text: string }> = {
    low: { bg: "bg-blue-500/10", text: "text-[var(--primary-light)]" },
    medium: { bg: "bg-amber-500/10", text: "text-amber-400" },
    high: { bg: "bg-orange-500/10", text: "text-orange-400" },
    critical: { bg: "bg-red-500/10", text: "text-[var(--destructive)]" },
  };

  const relativeTime = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-5 w-32" />
        <div className="surface h-28 skeleton" />
        <div className="surface h-48 skeleton" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Bot className="h-10 w-10 text-[var(--foreground-quaternary)] mb-3" />
        <p className="text-sm text-[var(--foreground-secondary)]">Agent not found</p>
        <Link href="/agents" className="mt-3 text-sm text-[var(--primary-light)] hover:underline">
          ← Back to Agents
        </Link>
      </div>
    );
  }

  const activeTasks = agentTasks.filter((t) => t.status !== "done").length;
  const completedTasks = agentTasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--foreground-tertiary)]">
        <Link href="/agents" className="hover:text-[var(--foreground-secondary)] transition-colors">
          Agents
        </Link>
        <span className="text-[var(--foreground-quaternary)]">/</span>
        <span className="text-[var(--foreground-secondary)]">{agent.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary-subtle)] border border-[var(--primary-border)]">
            <Bot className="h-6 w-6 text-[var(--primary-light)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">{agent.name}</h1>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${agent.paused ? "bg-red-500/10 text-[var(--destructive)]" : "bg-emerald-500/10 text-[var(--success)]"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${agent.paused ? "bg-red-400" : "bg-emerald-400"} ${!agent.paused ? "animate-pulse" : ""}`} />
                {agent.paused ? "Paused" : "Active"}
              </span>
            </div>
            <p className="text-sm text-[var(--foreground-tertiary)]">{agent.role}</p>
          </div>
        </div>

        <button
          onClick={() => toggleAgent(agent.paused)}
          disabled={toggling}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
            agent.paused
              ? "border-emerald-500/20 bg-emerald-500/10 text-[var(--success)] hover:bg-emerald-500/20"
              : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : agent.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {agent.paused ? "Resume" : "Pause"}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="surface p-4">
          <div className="flex items-center gap-1.5 mb-2 text-[var(--foreground-tertiary)]">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Status</span>
          </div>
          <p className={`text-lg font-semibold ${agent.paused ? "text-[var(--foreground-tertiary)]" : "text-[var(--success)]"}`}>
            {agent.paused ? "Paused" : "Active"}
          </p>
        </div>
        <div className="surface p-4">
          <div className="flex items-center gap-1.5 mb-2 text-[var(--foreground-tertiary)]">
            <ListTodo className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active</span>
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">{activeTasks}</p>
        </div>
        <div className="surface p-4">
          <div className="flex items-center gap-1.5 mb-2 text-[var(--foreground-tertiary)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Done</span>
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">{completedTasks}</p>
        </div>
      </div>

      {/* About */}
      <div className="surface p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-3">About</h3>
        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
          {agent.description || "No description provided."}
        </p>
      </div>

      {/* Assigned Tasks */}
      <div className="surface p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-3">Assigned Tasks</h3>
        {agentTasks.length === 0 ? (
          <p className="text-sm text-[var(--foreground-tertiary)]">No tasks assigned</p>
        ) : (
          <div className="space-y-1">
            {agentTasks.map((task) => {
              const status = statusConfig[task.status] || statusConfig.todo;
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              return (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold ${priority.bg} ${priority.text} px-1.5 py-0.5 rounded-full`}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="text-[11px] text-[var(--foreground-tertiary)]">
                          {new Date(task.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`status-pill ${status.pill}`}>
                    <span className={`dot ${status.dot}`} />
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Heartbeat */}
      <div className="surface px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-[var(--foreground-tertiary)]">
          <Clock className="h-3.5 w-3.5" />
          <span>Last heartbeat: {agent.last_heartbeat ? relativeTime(agent.last_heartbeat) : "Never"}</span>
        </div>
      </div>
    </div>
  );
}