export default function BudgetsPage() {
  return (
    <div className="space-y-8 page-enter pt-2 lg:pt-0">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
          Finance
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Budgets</h1>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          Track costs and spending across projects
        </p>
      </div>
      <div className="liquid-glass p-12 text-center animated-card">
        <p className="text-sm text-[var(--foreground-secondary)]">Budget tracking coming soon...</p>
      </div>
    </div>
  );
}
