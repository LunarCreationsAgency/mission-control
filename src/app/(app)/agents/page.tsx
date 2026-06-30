"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getAgents, updateAgent } from "@/lib/data";
import { type Agent, type Task } from "@/types";
import { useRouter } from "next/navigation";
import { Bot, Play, Pause, Plus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

export default function AgentsPage() {
  const { success, error: toastError } = useToast();
  const { data: agents = [], loading, refetch } = useData<Agent[]>("agents", getAgents, { refreshInterval: 30000 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  const handleTogglePause = async (id: string, paused: boolean) => {
    setUpdatingId(id);
    try {
      await updateAgent(id, { paused: !paused } as Record<string, unknown>);
      success(paused ? "Agent resumed" : "Agent paused");
      await refetch();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update agent");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <AgentsSkeleton />;

  return (
    <div className="space-y-6  pt-2 lg:pt-0 pb-24 lg:pb-0">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-1 mb-2">
        <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Agents</h1>
        <span className="text-sm text-[var(--foreground-tertiary)]">{agents.length}</span>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Team</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Agents</h1>
        </div>
        <div className="glass flex items-center gap-2 px-3.5 py-2">
          <Bot className="h-4 w-4 text-[var(--primary-light)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">{agents.length}</span>
          <span className="text-xs text-[var(--foreground-tertiary)]">team members</span>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            updatingId={updatingId}
            onTogglePause={handleTogglePause}
          />
        ))}
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  updatingId,
  onTogglePause,
}: {
  agent: Agent;
  updatingId: string | null;
  onTogglePause: (id: string, paused: boolean) => void;
}) {
  const isUpdating = updatingId === agent.id;
  const initials = agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const deptColors: Record<string, string> = {
    development: "bg-blue-500/10 text-blue-400",
    design: "bg-purple-500/10 text-purple-400",
    ops: "bg-amber-500/10 text-amber-400",
    strategy: "bg-emerald-500/10 text-emerald-400",
  };
  const deptColor = deptColors[agent.department || ""] || "bg-white/5 text-[var(--foreground-tertiary)]";

  return (
    <Link href={`/agents/${agent.id}`} className="block active:scale-[0.98] transition-transform">
      <div className="bg-[var(--surface-elevated)] rounded-2xl p-4">
        {/* Top row: avatar + name + status toggle */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary-light)]">
            <Bot className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[var(--foreground)] truncate">{agent.name}</h3>
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-lg px-2 py-0.5 ${agent.paused ? "bg-red-500/10 text-red-400" : "bg-[var(--success)]/10 text-[var(--success)]"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${agent.paused ? "bg-red-400" : "bg-[var(--success)]"}`} />
                {agent.paused ? "Paused" : "Active"}
              </span>
            </div>
            <p className="text-[13px] text-[var(--foreground-tertiary)]">{agent.role}</p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePause(agent.id, agent.paused);
            }}
            disabled={isUpdating}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              agent.paused
                ? "bg-[var(--success)]/10 text-[var(--success)] active:bg-[var(--success)]/20"
                : "bg-red-500/10 text-red-400 active:bg-red-500/20"
            }`}
          >
            {isUpdating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : agent.paused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Department */}
        <span className={`inline-flex text-[11px] font-medium rounded-lg px-2 py-1 ${deptColor}`}>
          {agent.department}
        </span>

        {/* Skills */}
        {agent.skills && agent.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {agent.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="inline-block text-[10px] rounded-lg bg-[var(--surface-elevated)] text-[var(--foreground-tertiary)] px-2 py-0.5">
                {skill}
              </span>
            ))}
            {agent.skills.length > 4 && (
              <span className="text-[10px] text-[var(--foreground-tertiary)]">+{agent.skills.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function AgentsSkeleton() {
  return (
    <div className="space-y-6 pt-2 lg:pt-0 pb-24 lg:pb-0">
      <div className="lg:hidden skeleton h-6 w-20 rounded-lg mb-2" />
      <div className="hidden lg:flex items-end justify-between mb-8">
        <div><div className="skeleton h-3 w-16 mb-2" /><div className="skeleton h-8 w-24" /></div>
        <div className="skeleton h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => <div key={i} className="bg-[var(--surface-elevated)] rounded-2xl h-32 animate-pulse" />)}
      </div>
    </div>
  );
}
