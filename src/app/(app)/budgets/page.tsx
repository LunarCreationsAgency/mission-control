"use client";

import { useData } from "@/lib/use-data";
import { getProjects } from "@/lib/data";
import { type Project } from "@/types";
import { Wallet, TrendingUp, FolderKanban, Loader2 } from "lucide-react";
import Link from "next/link";

export default function BudgetsPage() {
  const { data: projects = [], loading, error } = useData<Project[]>("projects", getProjects);

  const budgetedProjects = projects.filter((p) => p.budget > 0);
  const totalBudget = budgetedProjects.reduce((sum, p) => sum + p.budget, 0);
  const maxBudget = Math.max(...budgetedProjects.map((p) => p.budget), 1);

  if (loading) {
    return (
      <div className="space-y-8 pt-2 lg:pt-0">
        <div>
          <div className="skeleton h-3 w-20 mb-2" />
          <div className="skeleton h-8 w-32" />
        </div>
        <div className="skeleton h-64 rounded-[20px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 pt-2 lg:pt-0">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Finance</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Budgets</h1>
        </div>
        <div className="liquid-glass border-red-500/20 p-8 text-center">
          <p className="text-sm text-red-400">Failed to load budgets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter pt-2 lg:pt-0">
      {/* Header */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
          Finance
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Budgets</h1>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          Track budget allocation across projects
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass p-5 animated-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="liquid-glass-subtle flex h-9 w-9 items-center justify-center">
              <Wallet className="h-4 w-4 text-[var(--primary-light)]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Total Budget</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            €{totalBudget.toLocaleString()}
          </p>
        </div>

        <div className="liquid-glass p-5 animated-card" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="liquid-glass-subtle flex h-9 w-9 items-center justify-center">
              <FolderKanban className="h-4 w-4 text-[var(--primary-light)]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Budgeted Projects</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {budgetedProjects.length}
          </p>
          <p className="text-[11px] text-[var(--foreground-tertiary)]">
            of {projects.length} total
          </p>
        </div>

        <div className="liquid-glass p-5 animated-card" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="liquid-glass-subtle flex h-9 w-9 items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[var(--primary-light)]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Avg per Project</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            €{budgetedProjects.length > 0 ? Math.round(totalBudget / budgetedProjects.length).toLocaleString() : "0"}
          </p>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="liquid-glass p-6 animated-card" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="liquid-glass-subtle flex h-10 w-10 items-center justify-center">
            <Wallet className="h-5 w-5 text-[var(--primary-light)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Budget Breakdown</h2>
            <p className="text-[11px] text-[var(--foreground-tertiary)]">Per-project allocation</p>
          </div>
        </div>

        {budgetedProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--foreground-tertiary)]">No projects have budgets set.</p>
            <p className="text-[11px] text-[var(--foreground-tertiary)] mt-1">Edit a project to add a budget.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetedProjects
              .sort((a, b) => b.budget - a.budget)
              .map((project) => {
                const pct = (project.budget / maxBudget) * 100;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block group">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-t-white/[0.06] hover:bg-white/[0.04] transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-[var(--primary-light)] transition-colors">
                          {project.name}
                        </p>
                        <p className="text-[11px] text-[var(--foreground-tertiary)]">
                          {project.status}
                        </p>
                      </div>
                      <div className="w-32 sm:w-48">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-[var(--foreground-tertiary)]">Budget</span>
                          <span className="text-[11px] font-semibold text-[var(--foreground)]">€{project.budget.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
