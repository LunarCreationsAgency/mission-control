import { ListTodo, Bot, Target, FolderKanban } from "lucide-react";
import KpiCard from "@/components/ui/kpi-card";
import { getTasks, getAgents, getGoals, getProjects } from "@/lib/data";

export default async function DashboardPage() {
  // Fetch all data in parallel
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
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Overview of your AI agent operations</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Tasks"
          value={tasks.length}
          subtitle={`${inProgressTasks} in progress`}
          icon={<ListTodo className="h-5 w-5" />}
          accent="var(--primary)"
        />
        <KpiCard
          title="Agents Online"
          value={activeAgents}
          subtitle={`of ${agents.length} total`}
          icon={<Bot className="h-5 w-5" />}
          accent="var(--success)"
        />
        <KpiCard
          title="Active Goals"
          value={activeGoals}
          subtitle={`of ${goals.length} total`}
          icon={<Target className="h-5 w-5" />}
          accent="var(--warning)"
        />
        <KpiCard
          title="Projects"
          value={projects.length}
          subtitle="Active missions"
          icon={<FolderKanban className="h-5 w-5" />}
          accent="#a855f7"
        />
      </div>

      {/* Coming soon placeholder */}
      <div className="liquid-glass mt-8 p-8 text-center">
        <p className="text-[var(--muted)]">More dashboard widgets coming soon... 🚀</p>
      </div>
    </div>
  );
}
