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

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const actionIcons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  created: { icon: <Plus className="h-3 w-3" />, color: "text-[var(--primary-light)]", bg: "bg-[var(--primary-subtle)]" },
  updated: { icon: <AlertCircle className="h-3 w-3" />, color: "text-[var(--warning)]", bg: "bg-[var(--warning-subtle)]" },
  completed: { icon: <CheckCircle2 className="h-3 w-3" />, color: "text-[var(--success)]", bg: "bg-[var(--success-subtle)]" },
  paused: { icon: <Pause className="h-3 w-3" />, color: "text-[var(--foreground-tertiary)]", bg: "bg-[var(--foreground-quaternary)]/20" },
  resumed: { icon: <Play className="h-3 w-3" />, color: "text-[var(--success)]", bg: "bg-[var(--success-subtle)]" },
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Dashboard</h1>
          <p className="text-sm text-[var(--foreground-tertiary)] mt-1">Overview of your agent operations</p>
        </div>
        <button
          onClick={() => setTaskModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--background)] hover:bg-[var(--primary-dark)] transition-all"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-lg" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Link href="/tasks" className="surface-hover p-5 group">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-[var(--primary-subtle)] border border-[var(--primary-border)] flex items-center justify-center">
                  <ListTodo className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--foreground-quaternary)] group-hover:text-[var(--foreground-secondary)] transition-colors" />
              </div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{tasks.length}</p>
              <p className="text-sm text-[var(--foreground-tertiary)] mt-1">Total Tasks</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-[var(--foreground-quaternary)]">
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3 text-[var(--status-in-progress)]" />
                  {tasksByStatus("in_progress").length} active
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[var(--status-review)]" />
                  {tasksByStatus("review").length} review
                </span>
              </div>
            </Link>

            <Link href="/agents" className="surface-hover p-5 group">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-[var(--agent-subtle)] border border-[var(--agent-border)] flex items-center justify-center">
                  <Bot className="h-5 w-5 text-[var(--agent)]" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--foreground-quaternary)] group-hover:text-[var(--foreground-secondary)] transition-colors" />
              </div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{agents.length}</p>
              <p className="text-sm text-[var(--foreground-tertiary)] mt-1">Agents</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-[var(--foreground-quaternary)]">
                <span className="flex items-center gap-1">
                  <Play className="h-3 w-3 text-[var(--success)]" />
                  {activeAgents.length} running
                </span>
                <span className="flex items-center gap-1">
                  <Pause className="h-3 w-3 text-[var(--foreground-tertiary)]" />
                  {agents.filter((a) => a.paused).length} paused
                </span>
              </div>
            </Link>

            <Link href="/projects" className="surface-hover p-5 group">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-[var(--coral-subtle)] border border-[var(--coral)]/25 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-[var(--coral)]" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--foreground-quaternary)] group-hover:text-[var(--foreground-secondary)] transition-colors" />
              </div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{projects.length}</p>
              <p className="text-sm text-[var(--foreground-tertiary)] mt-1">Projects</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-[var(--foreground-quaternary)]">
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3 text-[var(--success)]" />
                  {activeProjects.length} active
                </span>
              </div>
            </Link>

            <Link href="/goals" className="surface-hover p-5 group">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-[var(--success-subtle)] border border-[var(--success-border)] flex items-center justify-center">
                  <Target className="h-5 w-5 text-[var(--success)]" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--foreground-quaternary)] group-hover:text-[var(--foreground-secondary)] transition-colors" />
              </div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{goals.length}</p>
              <p className="text-sm text-[var(--foreground-tertiary)] mt-1">Goals</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-[var(--foreground-quaternary)]">
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3 text-[var(--success)]" />
                  {activeGoals.length} active
                </span>
              </div>
            </Link>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Tasks Breakdown */}
            <div className="lg:col-span-2 surface p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-[var(--foreground)]">Tasks by Status</h2>
                <Link href="/tasks" className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {["todo", "in_progress", "review", "done"].map((status) => {
                  const count = tasksByStatus(status).length;
                  const total = tasks.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <span className="w-20 text-xs font-medium text-[var(--foreground-tertiary)] capitalize">{statusLabels[status]}</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              status === "todo" ? "var(--status-todo)" :
                              status === "in_progress" ? "var(--status-in-progress)" :
                              status === "review" ? "var(--status-review)" :
                              "var(--status-done)"
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-medium text-[var(--foreground-secondary)]">{count}</span>
                    </div>
                  );
                })}
              </div>

              {overdueTasks.length > 0 && (
                <div className="mt-5 p-4 rounded-lg bg-[var(--destructive-subtle)] border border-[var(--destructive-border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-[var(--destructive)]" />
                    <span className="text-sm font-semibold text-[var(--destructive)]">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-xs text-[var(--foreground-tertiary)]">Some tasks are past their due date and need attention.</p>
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="surface p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-[var(--foreground)]">Recent Activity</h2>
                <Link href="/activity" className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
                  View all →
                </Link>
              </div>
              <div className="space-y-0">
                {recentLogs.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-tertiary)] py-8 text-center">No recent activity.</p>
                ) : (
                  recentLogs.map((log, i) => {
                    const action = actionIcons[log.action] || actionIcons.updated;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-b-0"
                      >
                        <div className={`mt-0.5 h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${action.bg}`}>
                          <span className={action.color}>{action.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--foreground-secondary)] leading-snug">
                            {log.description}
                          </p>
                          <p className="text-xs text-[var(--foreground-quaternary)] mt-1">{formatTime(log.created)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Quick Access Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link href="/tasks" className="surface-hover p-5 flex items-center gap-4 group">
              <div className="h-12 w-12 rounded-xl bg-[var(--primary-subtle)] border border-[var(--primary-border)] flex items-center justify-center shrink-0">
                <ListTodo className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">Tasks</p>
                <p className="text-sm text-[var(--foreground-tertiary)] mt-0.5">{tasks.length} total, {tasksByStatus("in_progress").length} in progress</p>
              </div>
            </Link>

            <Link href="/agents" className="surface-hover p-5 flex items-center gap-4 group">
              <div className="h-12 w-12 rounded-xl bg-[var(--agent-subtle)] border border-[var(--agent-border)] flex items-center justify-center shrink-0">
                <Bot className="h-6 w-6 text-[var(--agent)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">Agents</p>
                <p className="text-sm text-[var(--foreground-tertiary)] mt-0.5">{agents.length} total, {activeAgents.length} running</p>
              </div>
            </Link>

            <Link href="/projects" className="surface-hover p-5 flex items-center gap-4 group">
              <div className="h-12 w-12 rounded-xl bg-[var(--coral-subtle)] border border-[var(--coral)]/25 flex items-center justify-center shrink-0">
                <FolderKanban className="h-6 w-6 text-[var(--coral)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">Projects</p>
                <p className="text-sm text-[var(--foreground-tertiary)] mt-0.5">{activeProjects.length} active</p>
              </div>
            </Link>
          </div>
        </>
      )}

      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} />
    </div>
  );
}
