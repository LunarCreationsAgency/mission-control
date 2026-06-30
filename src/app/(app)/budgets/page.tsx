"use client";

import { useData } from "@/lib/use-data";
import { getProjects } from "@/lib/data";
import { type Project } from "@/types";
import { Wallet, TrendingUp, FolderKanban } from "lucide-react";
import Link from "next/link";

export default function BudgetsPage() {
  const { data: projects = [], loading, error } = useData<Project[]>("projects", getProjects);

  const budgetedProjects = projects.filter((p) => p.budget > 0);
  const totalBudget = budgetedProjects.reduce((sum, p) => sum + p.budget, 0);
  const maxBudget = Math.max(...budgetedProjects.map((p) => p.budget), 1);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-7 w-32 bg-[var(--surface)] rounded-md animate-pulse mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-[var(--surface)] rounded-md animate-pulse" />)}
        </div>
        <div className="h-64 bg-[var(--surface)] rounded-md animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
        <p className="text-sm text-[var(--destructive)] mb-4">Failed to load budgets</p>
        <button className="px-4 py-2 rounded-md bg-[var(--primary)] text-white text-sm font-medium">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--foreground-tertiary)] mb-2">Finance</p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Budgets</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-md bg-[var(--primary-subtle)] flex items-center justify-center">
              <Wallet className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Total</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--foreground)]">€{totalBudget.toLocaleString()}</p>
        </div>

        <div className="surface p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-md bg-[var(--success-subtle)] flex items-center justify-center">
              <FolderKanban className="h-4 w-4 text-[var(--success)]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Projects</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--foreground)]">{budgetedProjects.length}</p>
          <p className="text-[11px] text-[var(--foreground-tertiary)]">of {projects.length} total</p>
        </div>

        <div className="surface p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-md bg-[var(--warning-subtle)] flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[var(--warning)]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Average</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--foreground)]">
            €{budgetedProjects.length > 0 ? Math.round(totalBudget / budgetedProjects.length).toLocaleString() : "0"}
          </p>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="surface p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-5">Breakdown</h2>

        {budgetedProjects.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="h-8 w-8 text-[var(--foreground-quaternary)] mx-auto mb-3" />
            <p className="text-sm text-[var(--foreground-secondary)]">No budgets yet</p>
            <p className="text-[11px] text-[var(--foreground-tertiary)] mt-1">Edit a project to add a budget</p>
          </div>
        ) : (
          <div className="space-y-2">
            {budgetedProjects
              .sort((a, b) => b.budget - a.budget)
              .map((project) => {
                const pct = (project.budget / maxBudget) * 100;
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}
                    className="block hover:bg-[var(--surface-hover)] transition-colors rounded-md"
                  >
                    <div className="flex items-center gap-4 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{project.name}</p>
                        <p className="text-[11px] text-[var(--foreground-tertiary)]">{project.status}</p>
                      </div>
                      <div className="w-24 sm:w-32 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-[var(--foreground-tertiary)]">Budget</span>
                          <span className="text-[11px] font-semibold text-[var(--foreground)]">€{project.budget.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
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
