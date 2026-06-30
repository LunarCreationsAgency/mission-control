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
      <div className="space-y-6 pt-2 lg:pt-0 pb-24 lg:pb-0">
        <div className="lg:hidden surface h-6 w-24 rounded-lg mb-2" />
        <div className="hidden lg:block"><div className="surface h-3 w-20 mb-2" /><div className="surface h-8 w-32" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="surface h-28 rounded-lg" />)}
        </div>
        <div className="surface h-64 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-sm text-[var(--destructive)] mb-4">Failed to load budgets</p>
        <button className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--foreground)] text-sm font-medium">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-1 mb-2">
        <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Budgets</h1>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block mb-8">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Finance</p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Budgets</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[var(--surface-elevated)] rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-subtle)] text-[var(--primary-light)]">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Total</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">€{totalBudget.toLocaleString()}</p>
        </div>

        <div className="bg-[var(--surface-elevated)] rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-subtle)] text-[var(--success)]">
              <FolderKanban className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Projects</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{budgetedProjects.length}</p>
          <p className="text-[11px] text-[var(--foreground-tertiary)]">of {projects.length} total</p>
        </div>

        <div className="bg-[var(--surface-elevated)] rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning-subtle)] text-[var(--warning)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Average</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            €{budgetedProjects.length > 0 ? Math.round(totalBudget / budgetedProjects.length).toLocaleString() : "0"}
          </p>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="bg-[var(--surface-elevated)] rounded-lg p-4 lg:p-6">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Breakdown</h2>

        {budgetedProjects.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="h-10 w-10 text-[var(--foreground-tertiary)] mx-auto mb-3" />
            <p className="text-sm text-[var(--foreground-secondary)]">No budgets yet</p>
            <p className="text-[11px] text-[var(--foreground-tertiary)] mt-1">Edit a project to add a budget</p>
          </div>
        ) : (
          <div className="space-y-3">
            {budgetedProjects
              .sort((a, b) => b.budget - a.budget)
              .map((project) => {
                const pct = (project.budget / maxBudget) * 100;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block  transition-transform"
                  >
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--surface)]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{project.name}</p>
                        <p className="text-[11px] text-[var(--foreground-tertiary)]">{project.status}</p>
                      </div>
                      <div className="w-24 sm:w-32 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-[var(--foreground-tertiary)]">Budget</span>
                          <span className="text-[11px] font-semibold text-[var(--foreground)]">€{project.budget.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
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
