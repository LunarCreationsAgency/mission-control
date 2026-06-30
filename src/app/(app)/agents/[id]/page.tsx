"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getAgents, getTasks } from "@/lib/data";
import { type Agent, type Task } from "@/types";
import { ArrowLeft, Bot, Pause, Play, ListTodo, CheckCircle2, Clock } from "lucide-react";
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

  const statusConfig: Record<string, { label: string; color: string }> = {
    todo: { label: "To Do", color: "text-[var(--warning)]" },
    in_progress: { label: "In Progress", color: "text-[var(--secondary)]" },
    review: { label: "Review", color: "text-[var(--agent-light)]" },
    done: { label: "Done", color: "text-[var(--success)]" },
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
      <div className="p-8">
        <div className="h-5 w-32 rounded-md bg-[var(--surface)] animate-pulse mb-6" />
        <div className="h-24 rounded-md bg-[var(--surface)] animate-pulse mb-4" />
        <div className="h-48 rounded-md bg-[var(--surface)] animate-pulse" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <Bot className="h-10 w-10 text-[var(--foreground-quaternary)] mb-3" />
        <p className="text-sm text-[var(--foreground-secondary)]">Agent not found</p>
        <Link href="/agents" className="mt-3 text-sm text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
          ← Back to Agents
        </Link>
      </div>
    );
  }

  const activeTasks = agentTasks.filter((t) => t.status !== "done").length;
  const completedTasks = agentTasks.filter((t) => t.status === "done").length;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--foreground-tertiary)] mb-6">
        <Link href="/agents" className="hover:text-[var(--foreground-secondary)] transition-colors">
          Agents
        </Link>
        <span className="text-[var(--foreground-quaternary)]">/</span>
        <span className="text-[var(--foreground-secondary)]">{agent.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 flex items-center justify-center rounded-md bg-[var(--surface-hover)]">
            <Bot className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">{agent.name}</h1>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md
                ${agent.paused ? "bg-[var(--destructive-subtle)] text-[var(--destructive)]" : "bg-[var(--success-subtle)] text-[var(--success)]"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${agent.paused ? "bg-[var(--destructive)]" : "bg-[var(--success)]"}`} />
                {agent.paused ? "Paused" : "Active"}
              </span>
            </div>
            <p className="text-sm text-[var(--foreground-tertiary)]">{agent.role}</p>
          </div>
        </div>

        <button
          onClick={() => toggleAgent(agent.paused)}
          disabled={toggling}
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors
            ${agent.paused
              ? "border-[var(--success)]/20 bg-[var(--success-subtle)] text-[var(--success)] hover:bg-[var(--success)]/15"
              : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
        >
          {toggling ? (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : agent.paused ? (
            <><Play className="h-3.5 w-3.5" /> Resume</>
          ) : (
            <><Pause className="h-3.5 w-3.5" /> Pause</>
          )}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="surface p-4">
          <span className="text-[11px] font-medium text-[var(--foreground-tertiary)] uppercase tracking-wider">Status</span>
          <p className={`text-lg font-semibold mt-1 ${agent.paused ? "text-[var(--foreground-tertiary)]" : "text-[var(--success)]"}`}>
            {agent.paused ? "Paused" : "Active"}
          </p>
        </div>
        <div className="surface p-4">
          <span className="text-[11px] font-medium text-[var(--foreground-tertiary)] uppercase tracking-wider">Active</span>
          <p className="text-lg font-semibold mt-1 text-[var(--foreground)]">{activeTasks}</p>
        </div>
        <div className="surface p-4">
          <span className="text-[11px] font-medium text-[var(--foreground-tertiary)] uppercase tracking-wider">Done</span>
          <p className="text-lg font-semibold mt-1 text-[var(--foreground)]">{completedTasks}</p>
        </div>
      </div>

      {/* About */}
      <div className="surface p-5 mb-6">
        <h3 className="text-xs font-semibold text-[var(--foreground-tertiary)] uppercase tracking-wider mb-3">About</h3>
        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
          {agent.description || "No description provided."}
        </p>
      </div>

      {/* Assigned Tasks */}
      <div className="surface p-5 mb-6">
        <h3 className="text-xs font-semibold text-[var(--foreground-tertiary)] uppercase tracking-wider mb-3">Assigned Tasks</h3>
        {agentTasks.length === 0 ? (
          <p className="text-sm text-[var(--foreground-tertiary)]">No tasks assigned</p>
        ) : (
          <div className="space-y-1">
            {agentTasks.map((task) => {
              const status = statusConfig[task.status] || statusConfig.todo;
              return (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{task.title}</p>
                    {task.due_date && (
                      <span className="text-[11px] text-[var(--foreground-tertiary)]">
                        {new Date(task.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
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
