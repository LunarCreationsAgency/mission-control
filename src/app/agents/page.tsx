"use client";

import { useState, useEffect, useCallback } from "react";
import { type Agent } from "@/types";
import { Bot, Pause, Play, Heart, Loader2 } from "lucide-react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/agents", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data.agents || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const toggleAgent = useCallback(async (id: string, paused: boolean) => {
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: !paused }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, paused: !paused } : a))
      );
    } catch (e) {
      console.error("Failed to toggle agent:", e);
      fetchAgents();
    }
  }, [fetchAgents]);

  if (loading) return <AgentsSkeleton />;

  if (error) {
    return (
      <div className="space-y-8 page-enter pt-2 lg:pt-0">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
            Team
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Agents</h1>
        </div>
        <div className="liquid-glass border-red-500/20 p-8 text-center animated-card">
          <p className="text-sm text-red-400">Failed to load agents</p>
          <button onClick={fetchAgents} className="mt-3 text-xs text-[var(--primary-light)] hover:underline">
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
            Team
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Agents</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Manage your AI agent team
          </p>
        </div>
        <div className="liquid-glass-subtle flex items-center gap-2 px-3.5 py-2">
          <Bot className="h-4 w-4 text-[var(--primary-light)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">{agents.length}</span>
          <span className="text-xs text-[var(--foreground-tertiary)]">total</span>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, i) => (
          <div
            key={agent.id}
            className="liquid-glass group p-5 transition-all duration-300 hover-lift animated-card"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="liquid-glass-subtle flex h-11 w-11 items-center justify-center">
                  <Bot className="h-5 w-5 text-[var(--primary-light)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{agent.name}</h3>
                  <p className="text-[11px] text-[var(--foreground-tertiary)]">{agent.role}</p>
                </div>
              </div>
              {/* Status dot */}
              <div className={`h-2 w-2 rounded-full ${agent.paused ? "bg-slate-500" : "bg-[var(--success)]"}`} />
            </div>

            {/* Description */}
            <p className="text-[12px] text-[var(--foreground-secondary)] leading-relaxed mb-4 line-clamp-2">
              {agent.description || "No description"}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--foreground-tertiary)]">
                <Heart className={`h-3 w-3 ${agent.paused ? "" : "text-red-400"}`} />
                <span>{agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleDateString("de-DE") : "Never"}</span>
              </div>
              <button
                onClick={() => toggleAgent(agent.id, agent.paused)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  agent.paused
                    ? "bg-[var(--primary)]/15 text-[var(--primary-light)] hover:bg-[var(--primary)]/25"
                    : "bg-white/[0.04] text-[var(--foreground-tertiary)] hover:bg-white/[0.08] hover:text-[var(--foreground)]"
                }`}
              >
                {agent.paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {agent.paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentsSkeleton() {
  return (
    <div className="space-y-8 pt-2 lg:pt-0">
      <div className="flex items-end justify-between">
        <div>
          <div className="skeleton h-3 w-16 mb-2" />
          <div className="skeleton h-8 w-28" />
        </div>
        <div className="skeleton h-9 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-40 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
