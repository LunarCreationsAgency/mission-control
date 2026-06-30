"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type Task, type Project, type Goal, type Agent, type ActivityLog } from "@/types";
import {
  ListTodo, Bot, Target, FolderKanban, Plus,
  Play, Pause, CheckCircle2, AlertCircle, ArrowUpRight,
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

const actionIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  created: { icon: <Plus className="h-3 w-3" />, color: "text-[var(--primary-light)]" },
  updated: { icon: <AlertCircle className="h-3 w-3" />, color: "text-[var(--warning)]" },
  completed: { icon: <CheckCircle2 className="h-3 w-3" />, color: "text-[var(--success)]" },
  paused: { icon: <Pause className="h-3 w-3" />, color: "text-[var(--foreground-tertiary)]" },
  resumed: { icon: <Play className="h-3 w-3" />, color: "text-[var(--success)]" },
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--foreground-tertiary)] mt-0.5">Overview of your agent operations</p>
        </div>
        <button
          onClick={() => setTaskModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-dark)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-md bg-[var(--surface)] animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/tasks" className="surface-hover p-5 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--foreground-tertiary)]">Tasks</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--foreground-quaternary)] group-hover:text-[var(--foreground-secondary)] transition-colors" />
              </div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{tasks.length}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--foreground-quaternary)]">
                <span className="flex items-center gap-1">{tasksByStatus("in_progress").length} active</span>
                <span className="flex items-center gap-1">{tasksByStatus("review").length} review</span>
              </div>
            </Link>

            <Link href="/agents" className="surface-hover p-5 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--foreground-tertiary)]">Agents</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--foreground-quaternary)] group-hover:text-[var(--foreground-secondary)] transition-colors" />
              </div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{agents.length}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--foreground-quaternary)]">
                <span className="flex items-center gap-1">{activeAgents.length} running</span>
                <span className="flex items-center gap-1">{agents.filter((a) => a.paused).length} paused</span>
              </div>
            </Link>

            <Link href="/projects" className="surface-hover p-5 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--foreground-tertiary)]">Projects</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--foreground-quaternary)] group-hover:text-[var(--foreground-secondary)] transition-colors" />
              </div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{projects.length}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--foreground-quaternary)]">
                <span className="flex items-center gap-1">{activeProjects.length} active</span>
              </div>
            </Link>

            <Link href="/goals" className="surface-hover p-5 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--foreground-tertiary)]">Goals</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--foreground-quaternary)] group-hover:text-[var(--foreground-secondary)] transition-colors" />
              </div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{goals.length}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--foreground-quaternary)]">
                <span className="flex items-center gap-1">{activeGoals.length} active</span>
              </div>
            </Link>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Tasks Breakdown */}
            <div className="lg:col-span-2 surface p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Tasks by Status</h2>
                <Link href="/tasks" className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {["todo", "in_progress", "review", "done"].map((status) => {
                  const count = tasksByStatus(status).length;
                  const total = tasks.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <span className="w-24 text-xs text-[var(--foreground-tertiary)] capitalize">{statusLabels[status]}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
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
                      <span className="w-8 text-right text-xs font-medium text-[var(--foreground-secondary)]">{count}</span>
                    </div>
                  );
                })}
              </div>

              {overdueTasks.length > 0 && (
                <div className="mt-6 p-3 rounded-md bg-[var(--destructive-subtle)] border border-[var(--destructive-subtle)]">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[var(--destructive)]" />
                    <span className="text-sm font-medium text-[var(--destructive)]">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="surface p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Recent Activity</h2>
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
                        <div className="mt-0.5 h-6 w-6 rounded-md bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                          <span className={action.color}>{action.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--foreground-secondary)] leading-snug">
                            {log.description}
                          </p>
                          <p className="text-xs text-[var(--foreground-quaternary)] mt-0.5">{formatTime(log.created)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Link href="/tasks" className="surface-hover p-4 flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-md bg-[var(--primary-subtle)] flex items-center justify-center shrink-0">
                <ListTodo className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Tasks</p>
                <p className="text-xs text-[var(--foreground-tertiary)]">{tasks.length} total · {tasksByStatus("in_progress").length} in progress</p>
              </div>
            </Link>

            <Link href="/agents" className="surface-hover p-4 flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-md bg-[var(--agent-subtle)] flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-[var(--agent)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Agents</p>
                <p className="text-xs text-[var(--foreground-tertiary)]">{agents.length} total · {activeAgents.length} running</p>
              </div>
            </Link>

            <Link href="/projects" className="surface-hover p-4 flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-md bg-[var(--success-subtle)] flex items-center justify-center shrink-0">
                <FolderKanban className="h-4 w-4 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Projects</p>
                <p className="text-xs text-[var(--foreground-tertiary)]">{activeProjects.length} active</p>
              </div>
            </Link>
          </div>
        </>
      )}

      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} />
    </div>
  );
}
