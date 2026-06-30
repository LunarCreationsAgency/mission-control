"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getAgents, updateAgent } from "@/lib/data";
import { type Agent } from "@/types";
import { useRouter } from "next/navigation";
import { Bot, Play, Pause, ArrowUpRight } from "lucide-react";
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">Agents</h1>
          <p className="text-sm text-[var(--foreground-tertiary)] mt-0.5">{agents.length} team members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
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

  const deptColors: Record<string, string> = {
    development: "text-[var(--primary-light)]",
    design: "text-purple-400",
    ops: "text-[var(--warning)]",
    strategy: "text-[var(--success)]",
  };
  const deptColor = deptColors[agent.department || ""] || "text-[var(--foreground-tertiary)]";

  return (
    <div className="surface-hover p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-[var(--surface-hover)] flex items-center justify-center">
            <Bot className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <Link href={`/agents/${agent.id}`} className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary-light)] transition-colors">
              {agent.name}
            </Link>
            <p className={`text-xs font-medium mt-0.5 ${deptColor}`}>
              {agent.department || "General"}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePause(agent.id, agent.paused);
          }}
          disabled={isUpdating}
          className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors
            ${agent.paused
              ? "bg-[var(--success-subtle)] text-[var(--success)] hover:bg-[var(--success)]/15"
              : "bg-[var(--destructive-subtle)] text-[var(--destructive)] hover:bg-[var(--destructive)]/15"
            }`}
        >
          {isUpdating ? (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : agent.paused ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium
          ${agent.paused ? "text-[var(--destructive)]" : "text-[var(--success)]"}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${agent.paused ? "bg-[var(--destructive)]" : "bg-[var(--success)]"}`} />
          {agent.paused ? "Paused" : "Running"}
        </span>
        {agent.model && (
          <span className="text-xs text-[var(--foreground-quaternary)]">{agent.model}</span>
        )}
      </div>
    </div>
  );
}

function AgentsSkeleton() {
  return (
    <div className="p-8">
      <div className="h-8 w-32 rounded-md bg-[var(--surface)] animate-pulse mb-8" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 rounded-md bg-[var(--surface)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
