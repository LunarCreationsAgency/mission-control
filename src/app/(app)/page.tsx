"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type Task, type Project, type Goal, type Agent, type ActivityLog } from "@/types";
import {
  ListTodo, Bot, Target, FolderKanban, Plus,
  Play, Pause, CheckCircle2, AlertCircle, ArrowUpRight, Loader2,
  Clock, CalendarDays, CircleDot,
} from "lucide-react";
import Link from "next/link";
import TaskModal from "@/components/ui/task-modal";

const statusColors: Record<string, string> = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  done: "#10b981",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const actionIcons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  created: { icon: <Plus className="h-3 w-3" />, color: "text-[var(--primary-light)]", bg: "bg-[var(--primary)]/15" },
  updated: { icon: <AlertCircle className="h-3 w-3" />, color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/15" },
  completed: { icon: <CheckCircle2 className="h-3 w-3" />, color: "text-[var(--success)]", bg: "bg-[var(--success)]/15" },
  paused: { icon: <Pause className="h-3 w-3" />, color: "text-[var(--foreground-tertiary)]", bg: "bg-white/5" },
  resumed: { icon: <Play className="h-3 w-3" />, color: "text-[var(--success)]", bg: "bg-[var(--success)]/15" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [workerRunning, setWorkerRunning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, projectsRes, goalsRes, agentsRes, logsRes] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/goals", { cache: "no-store" }),
        fetch("/api/agents", { cache: "no-store" }),
        fetch("/api/activity-logs", { cache: "no-store" }),
      ]);
      const [tasksData, projectsData, goalsData, agentsData, logsData] = await Promise.all([
        tasksRes.json(), projectsRes.json(), goalsRes.json(), agentsRes.json(), logsRes.json(),
      ]);
      setTasks(tasksData.tasks || []);
      setProjects(projectsData.projects || []);
      setGoals(goalsData.goals || []);
      setAgents(agentsData.agents || []);
      setLogs(logsData.logs || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tasksByStatus = (status: string) => tasks.filter((t) => t.status === status);
  const activeProjects = projects.filter((p) => p.status === "active");
  const activeAgents = agents.filter((a) => !a.paused);
  const activeGoals = goals.filter((g) => g.status === "active");
  const recentLogs = logs.slice(0, 6);
  const overdueTasks = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done");
  const completionRate = tasks.length > 0 ? Math.round((tasksByStatus("done").length / tasks.length) * 100) : 0;
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const upcomingTasks = tasks.filter((t) => t.due_date && new Date(t.due_date) >= new Date() && new Date(t.due_date) <= next7Days && t.status !== "done");
  const agentTaskCounts = agents.map((a) => ({
    ...a,
    taskCount: tasks.filter((t) => t.assignee === a.id).length,
  })).sort((a, b) => b.taskCount - a.taskCount);

  const reviewCount = tasks.filter((t) => t.status === "review").length;

  const handleCreateTask = async (taskData: Partial<Task>) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error("Failed");
    await fetchData();
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 lg:space-y-8 page-enter pt-2 lg:pt-0 pb-24 lg:pb-0">
      {/* Mobile: compact header */}
      <div className="lg:hidden flex items-center justify-between px-1">
        <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
        <button
          onClick={() => setTaskModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="text-xs">Task</span>
        </button>
      </div>

      {/* Desktop: full header */}
      <div className="hidden lg:flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/projects/new")} className="glass flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-all hover:text-[var(--foreground)] hover:bg-white/[0.04]">
            <FolderKanban className="h-4 w-4" />
            New Project
          </button>
          <button onClick={() => setTaskModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] transition-all">
            <Plus className="h-4 w-4" />New Task
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard title="Tasks" value={tasks.length} subtitle={`${tasksByStatus("in_progress").length} active`} icon={<ListTodo className="h-5 w-5" />} accent="var(--primary)" href="/tasks" />
        <KpiCard title="Agents" value={activeAgents.length} subtitle={`${agents.length} total`} icon={<Bot className="h-5 w-5" />} accent="var(--success)" href="/agents" />
        <KpiCard title="Goals" value={activeGoals.length} subtitle={`${goals.length} total`} icon={<Target className="h-5 w-5" />} accent="var(--warning)" href="/goals" />
        <KpiCard title="Projects" value={projects.length} subtitle={`${activeProjects.length} active`} icon={<FolderKanban className="h-5 w-5" />} accent="#a855f7" href="/projects" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Left Column — 2/3 */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Task Distribution */}
          <div className="bg-[var(--surface-elevated)] rounded-2xl p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Task Distribution</h2>
              <Link href="/tasks" className="hidden lg:flex items-center gap-1 text-xs text-[var(--foreground-tertiary)]">View all <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
            <div className="space-y-3">
              {["todo", "in_progress", "review", "done"].map((status) => {
                const count = tasksByStatus(status).length;
                const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-24 shrink-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: statusColors[status] }} />
                      <span className="text-xs text-[var(--foreground-secondary)]">{statusLabels[status]}</span>
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: statusColors[status] }} />
                    </div>
                    <span className="text-xs font-semibold text-[var(--foreground)] w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-[var(--surface-elevated)] rounded-2xl p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Active Projects</h2>
              <Link href="/projects" className="hidden lg:flex items-center gap-1 text-xs text-[var(--foreground-tertiary)]">View all <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-[var(--foreground-tertiary)]">No active projects</p>
            ) : (
              <div className="space-y-4">
                {activeProjects.slice(0, 4).map((project) => {
                  const projectTasks = tasks.filter((t) => t.project === project.id);
                  const doneTasks = projectTasks.filter((t) => t.status === "done");
                  const progress = projectTasks.length > 0
                    ? Math.round((doneTasks.length / projectTasks.length) * 100)
                    : project.progress || 0;
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`} className="block group active:scale-[0.98] transition-transform">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-medium text-[var(--foreground)] truncate pr-4">{project.name}</h3>
                        <span className="text-xs font-semibold text-[var(--foreground)]">{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${progress >= 80 ? "bg-[var(--success)]" : "bg-[var(--primary)]"}`} style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--foreground-tertiary)]">{doneTasks.length}/{projectTasks.length} tasks</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column — 1/3 */}
        <div className="space-y-4 lg:space-y-6">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div className="bg-[var(--surface-elevated)] rounded-2xl p-4 lg:p-5 border-l-[3px] border-l-red-500">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-red-400" />
                <h2 className="text-sm font-semibold text-red-400">Overdue</h2>
                <span className="text-xs font-bold text-red-400">{overdueTasks.length}</span>
              </div>
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 active:bg-red-500/10 transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="text-xs text-[var(--foreground-secondary)] truncate">{task.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingTasks.length > 0 && (
            <div className="bg-[var(--surface-elevated)] rounded-2xl p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-[var(--primary-light)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Upcoming</h2>
                <span className="text-xs font-bold text-[var(--primary-light)]">{upcomingTasks.length}</span>
              </div>
              <div className="space-y-2">
                {upcomingTasks.slice(0, 3).map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] active:bg-white/[0.04] transition-colors">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-light)] shrink-0" />
                    <span className="text-xs text-[var(--foreground-secondary)] truncate">{task.title}</span>
                    <span className="text-[10px] text-[var(--foreground-tertiary)] shrink-0">{new Date(task.due_date!).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Agent Load */}
          <div className="bg-[var(--surface-elevated)] rounded-2xl p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Agent Load</h2>
              <Link href="/agents" className="hidden lg:flex items-center gap-1 text-xs text-[var(--foreground-tertiary)]">View <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
            {agentTaskCounts.length === 0 ? (
              <p className="text-sm text-[var(--foreground-tertiary)]">No agents</p>
            ) : (
              <div className="space-y-3">
                {agentTaskCounts.slice(0, 5).map((agent) => {
                  const maxTasks = Math.max(...agentTaskCounts.map((a) => a.taskCount), 1);
                  const loadPct = (agent.taskCount / maxTasks) * 100;
                  return (
                    <div key={agent.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--foreground)] truncate">{agent.name}</p>
                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mt-1">
                          <div className="h-full rounded-full bg-[var(--primary)]/70 transition-all" style={{ width: `${loadPct}%` }} />
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--foreground)]">{agent.taskCount}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Worker Control */}
          <div className="bg-[var(--surface-elevated)] rounded-2xl p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Worker</h2>
              {reviewCount > 0 && (
                <span className="text-[10px] font-bold text-[var(--warning)]">{reviewCount} in review</span>
              )}
            </div>
            <button
              onClick={async () => {
                try {
                  setWorkerRunning(true);
                  const res = await fetch("/api/worker/run", { method: "POST" });
                  const data = await res.json();
                  if (data.ok) {
                    await fetchData();
                  }
                } catch { /* ignore */ }
                setWorkerRunning(false);
              }}
              disabled={workerRunning}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/20 px-4 py-3 text-sm font-medium text-[var(--primary-light)] hover:bg-[var(--primary)]/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {workerRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {workerRunning ? "Running..." : "Run Worker"}
            </button>
          </div>

          {/* Activity */}
          <div className="bg-[var(--surface-elevated)] rounded-2xl p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Activity</h2>
              <Link href="/activity" className="hidden lg:flex items-center gap-1 text-xs text-[var(--foreground-tertiary)]">View <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-[var(--foreground-tertiary)]">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => {
                  const config = actionIcons[log.action] || { icon: <CircleDot className="h-3 w-3" />, color: "text-[var(--foreground-tertiary)]", bg: "bg-white/5" };
                  const time = new Date(log.created).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={log.id} className="flex items-start gap-2.5">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${config.bg} ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--foreground)] truncate">
                          <span className="capitalize">{log.action}</span> {log.entity_type}
                        </p>
                        <p className="text-[10px] text-[var(--foreground-tertiary)] truncate">{log.entity_name || time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="bg-[var(--surface-elevated)] rounded-2xl p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Goals</h2>
              <Link href="/goals" className="hidden lg:flex items-center gap-1 text-xs text-[var(--foreground-tertiary)]">View <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
            {activeGoals.length === 0 ? (
              <p className="text-sm text-[var(--foreground-tertiary)]">No active goals</p>
            ) : (
              <div className="space-y-3">
                {activeGoals.slice(0, 3).map((goal) => (
                  <Link key={goal.id} href={`/goals/${goal.id}`} className="block active:scale-[0.98] transition-transform">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--foreground)] truncate">{goal.name}</span>
                      <span className="text-xs font-semibold text-[var(--foreground)]">{goal.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${goal.progress >= 80 ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`} style={{ width: `${goal.progress}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB on mobile */}
      <button
        onClick={() => setTaskModalOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-lg shadow-blue-500/30 active:scale-90 transition-transform"
        aria-label="New task"
      >
        <Plus className="h-6 w-6" />
      </button>

      <TaskModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} onSubmit={handleCreateTask} mode="create" />
    </div>
  );
}

/* --- Sub-components --- */

function KpiCard({ title, value, subtitle, icon, accent, href }: { title: string; value: number; subtitle: string; icon: React.ReactNode; accent: string; href: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else { setDisplayValue(Math.floor(current)); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <Link href={href} className="block">
      <div className="bg-[var(--surface-elevated)] rounded-2xl p-4 lg:p-5 active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--foreground-tertiary)]">{title}</p>
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)]">{displayValue}</h3>
            <p className="mt-1 text-[11px] text-[var(--foreground-secondary)]">{subtitle}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
            <span style={{ color: accent }}>{icon}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 lg:space-y-8 pt-2 lg:pt-0 pb-24 lg:pb-0">
      <div className="lg:hidden skeleton h-6 w-24 rounded-lg mb-2" />
      <div className="hidden lg:flex items-end justify-between">
        <div><div className="skeleton h-3 w-20 mb-2" /><div className="skeleton h-8 w-32" /></div>
        <div className="flex gap-2"><div className="skeleton h-9 w-24 rounded-xl" /><div className="skeleton h-9 w-28 rounded-xl" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[1,2,3,4].map((i) => <div key={i} className="skeleton h-24 lg:h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="skeleton h-56 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
