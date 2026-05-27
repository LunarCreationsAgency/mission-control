"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getAgents, getTasks } from "@/lib/data";
import { type Agent, type Task } from "@/types";
import { ArrowLeft, Bot, Pause, Play, Heart, Clock, Activity, ListTodo, Loader2 } from "lucide-react";
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

  if (loading) {
    return (
      <div className="space-y-6 pt-2 lg:pt-0">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 rounded-[20px]" />
        <div className="skeleton h-64 rounded-[20px]" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-6 pt-2 lg:pt-0">
        <Link href="/agents" className="inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Link>
        <div className="liquid-glass p-12 text-center">
          <p className="text-[var(--foreground-secondary)]">Agent not found.</p>
        </div>
      </div>
    );
  }

  const activeTasks = agentTasks.filter((t) => t.status !== "done").length;
  const completedTasks = agentTasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      {/* Header */}
      <div>
        <Link href="/agents" className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] transition-colors hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="liquid-glass-subtle flex h-14 w-14 items-center justify-center">
              <Bot className="h-7 w-7 text-[var(--primary-light)]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)]">{agent.name}</h1>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${agent.paused ? "bg-slate-500/15 text-slate-400" : "bg-[var(--success)]/15 text-[var(--success)]"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${agent.paused ? "bg-slate-400" : "bg-[var(--success)]"}`} />
                  {agent.paused ? "Paused" : "Active"}
                </span>
              </div>
              <p className="text-sm text-[var(--foreground-secondary)]">{agent.role}</p>
            </div>
          </div>

          <button
            onClick={() => toggleAgent(agent.paused)}
            disabled={toggling}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
              agent.paused
                ? "bg-[var(--primary)]/15 text-[var(--primary-light)] hover:bg-[var(--primary)]/25 border border-[var(--primary)]/20"
                : "bg-white/[0.03] text-[var(--foreground-secondary)] hover:bg-white/[0.06] border border-white/[0.08]"
            }`}
          >
            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : agent.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {agent.paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="liquid-glass p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2 text-[var(--foreground-tertiary)]">
            <Activity className="h-4 w-4" />
            <span className="text-[11px] uppercase tracking-wider">Status</span>
          </div>
          <p className={`text-lg font-bold ${agent.paused ? "text-slate-400" : "text-[var(--success)]"}`}>
            {agent.paused ? "Paused" : "Active"}
          </p>
        </div>
        <div className="liquid-glass p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2 text-[var(--foreground-tertiary)]">
            <ListTodo className="h-4 w-4" />
            <span className="text-[11px] uppercase tracking-wider">Active Tasks</span>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">{activeTasks}</p>
        </div>
        <div className="liquid-glass p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2 text-[var(--foreground-tertiary)]">
            <Clock className="h-4 w-4" />
            <span className="text-[11px] uppercase tracking-wider">Completed</span>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">{completedTasks}</p>
        </div>
      </div>

      {/* Description */}
      <div className="liquid-glass p-5">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">About</h2>
        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
          {agent.description || "No description provided."}
        </p>
      </div>

      {/* Assigned Tasks */}
      <div className="liquid-glass p-5">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Assigned Tasks</h2>
        {agentTasks.length === 0 ? (
          <p className="text-sm text-[var(--foreground-tertiary)]">No tasks assigned to this agent.</p>
        ) : (
          <div className="space-y-2">
            {agentTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between rounded-xl p-3 hover:bg-white/[0.04] transition-all">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                  <p className="text-[11px] text-[var(--foreground-tertiary)]">{task.status}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${task.status === "done" ? "bg-[var(--success)]/15 text-[var(--success)]" : "bg-[var(--primary)]/15 text-[var(--primary-light)]"}`}>
                  {task.status === "done" ? "Done" : "Active"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Heartbeat */}
      <div className="liquid-glass-subtle p-4">
        <div className="flex items-center gap-2 text-xs text-[var(--foreground-tertiary)]">
          <Heart className={`h-3.5 w-3.5 ${agent.paused ? "" : "text-red-400"}`} />
          <span>Last heartbeat: {agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleDateString("de-DE") : "Never"}</span>
        </div>
      </div>
    </div>
  );
}
