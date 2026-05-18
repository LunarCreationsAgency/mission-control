import { ListTodo, Bot, Target, FolderKanban } from "lucide-react";
import KpiCard from "@/components/ui/kpi-card";
import { getTasks, getAgents, getGoals, getProjects } from "@/lib/data";

export default async function DashboardPage() {
  const [tasks, agents, goals, projects] = await Promise.all([
    getTasks().catch(() => []),
    getAgents().catch(() => []),
    getGoals().catch(() => []),
    getProjects().catch(() => []),
  ]);

  const inProgressTasks = tasks.filter((t) => (t as Record<string, unknown>).status === "in_progress").length;
  const activeAgents = agents.filter((a) => !(a as Record<string, unknown>).paused).length;
  const activeGoals = goals.filter((g) => (g as Record<string, unknown>).status === "active").length;

  return (
    <div className="space-y-8 page-enter pt-2 lg:pt-0">
      {/* Header */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
          Overview
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-1.5 text-sm text-[var(--foreground-secondary)]">
          Overview of your AI agent operations
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Tasks"
          value={tasks.length}
          subtitle={`${inProgressTasks} in progress`}
          icon={<ListTodo className="h-5 w-5" />}
          accent="var(--primary)"
          delay={0}
        />
        <KpiCard
          title="Agents Online"
          value={activeAgents}
          subtitle={`of ${agents.length} total`}
          icon={<Bot className="h-5 w-5" />}
          accent="var(--success)"
          delay={0.1}
        />
        <KpiCard
          title="Active Goals"
          value={activeGoals}
          subtitle={`of ${goals.length} total`}
          icon={<Target className="h-5 w-5" />}
          accent="var(--warning)"
          delay={0.2}
        />
        <KpiCard
          title="Projects"
          value={projects.length}
          subtitle="Active missions"
          icon={<FolderKanban className="h-5 w-5" />}
          accent="#a855f7"
          delay={0.3}
        />
      </div>

      {/* Coming soon */}
      <div className="liquid-glass p-8 text-center animated-card" style={{ animationDelay: "0.4s" }}>
        <p className="text-sm text-[var(--foreground-secondary)]">
          More dashboard widgets coming soon... 🚀
        </p>
      </div>
    </div>
  );
}
