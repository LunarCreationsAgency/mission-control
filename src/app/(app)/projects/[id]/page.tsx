"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, FolderKanban, Flag, TrendingUp, ListTodo, Wallet,
  Trash2, Pencil, LayoutDashboard, CheckSquare, Palette, Rocket,
  ExternalLink, Globe, Copy, Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Project, type Task } from "@/types";
import { getProjects, getTasks, deleteProject, updateProject } from "@/lib/data";
import ProjectModal from "@/components/ui/project-modal";
import { useToast } from "@/components/ui/toast";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary)]/15", dot: "bg-[var(--primary)]" },
  completed: { label: "Completed", color: "text-[var(--success)]", bg: "bg-[var(--success)]/15", dot: "bg-[var(--success)]" },
  archived: { label: "Archived", color: "text-[var(--foreground-tertiary)]", bg: "bg-white/5", dot: "bg-[var(--foreground-tertiary)]" },
};

const taskStatusConfig: Record<string, { label: string; dot: string }> = {
  todo: { label: "To Do", dot: "bg-slate-400" },
  in_progress: { label: "In Progress", dot: "bg-[var(--primary)]" },
  review: { label: "Review", dot: "bg-[var(--warning)]" },
  done: { label: "Done", dot: "bg-[var(--success)]" },
};

const taskTypeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  design: { icon: "🎨", color: "text-purple-300", bg: "bg-purple-500/15" },
  code: { icon: "💻", color: "text-blue-300", bg: "bg-blue-500/15" },
  content: { icon: "📝", color: "text-emerald-300", bg: "bg-emerald-500/15" },
  deploy: { icon: "🚀", color: "text-orange-300", bg: "bg-orange-500/15" },
  planning: { icon: "📋", color: "text-slate-300", bg: "bg-slate-500/15" },
  shop: { icon: "🛒", color: "text-pink-300", bg: "bg-pink-500/15" },
};

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "design", label: "Design", icon: Palette },
  { id: "deploy", label: "Deploy", icon: Rocket },
] as const;

type TabId = typeof tabs[number]["id"];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [resolvedId, setResolvedId] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editModal, setEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    params.then((p) => setResolvedId(p.id));
  }, [params]);

  const fetchData = useCallback(async () => {
    if (!resolvedId) return;
    try {
      setLoading(true);
      const [projectsData, tasksData] = await Promise.all([
        getProjects(),
        getTasks(),
      ]);
      const projects = projectsData as Project[];
      const tasks = tasksData as Task[];

      const found = projects.find((p) => p.id === resolvedId);
      if (!found) {
        setNotFound(true);
      } else {
        setProject(found);
        setProjectTasks(tasks.filter((t) => t.project === resolvedId));
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (updates: Partial<Project>) => {
    try {
      await updateProject(resolvedId, updates as Record<string, unknown>);
      success("Project updated");
      await fetchData();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (deleting) {
      try {
        await deleteProject(resolvedId);
        success("Project deleted");
        router.push("/projects");
      } catch (e) {
        toastError(e instanceof Error ? e.message : "Failed to delete");
      }
      return;
    }
    setDeleting(true);
    setTimeout(() => setDeleting(false), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-2 lg:pt-0">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-10 w-96 rounded-xl" />
        <div className="skeleton h-64 rounded-[20px]" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="space-y-6 pt-2 lg:pt-0">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
        <div className="liquid-glass p-12 text-center">
          <p className="text-[var(--foreground-secondary)]">Project not found.</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[project.status] || statusConfig.active;
  const progress = Math.min(100, Math.max(0, project.progress || 0));
  const progressColor = progress >= 80 ? "bg-[var(--success)]" : progress >= 40 ? "bg-[var(--primary)]" : "bg-[var(--primary)]/60";
  const doneTasks = projectTasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      {/* Header */}
      <div>
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] transition-colors hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 ${status.bg} ${status.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {project.deployed_url && (
            <a
              href={project.deployed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 bg-[var(--success)]/15 text-[var(--success)] hover:bg-[var(--success)]/25 transition-colors"
            >
              <Globe className="h-3 w-3" />
              Live
            </a>
          )}
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {project.name}
          </h1>
          <button
            onClick={() => setEditModal(true)}
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/[0.06] transition-colors"
            title="Edit project"
          >
            <Pencil className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />
          </button>
        </div>

        {project.source_url && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[var(--foreground-tertiary)]">Source:</span>
            <a
              href={project.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--primary-light)] hover:underline flex items-center gap-1"
            >
              {project.source_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[var(--primary)]/15 text-[var(--primary-light)]"
                  : "text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "tasks" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-bold">
                  {projectTasks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Progress */}
            <div className="liquid-glass p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Progress</h2>
                <span className="text-2xl font-bold text-[var(--foreground)]">{progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--foreground-tertiary)]">
                {doneTasks.length} of {projectTasks.length} tasks completed
              </p>
            </div>

            {/* Description */}
            <div className="liquid-glass p-5 lg:p-6">
              <h2 className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-[var(--foreground)]">Description</h2>
              <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                {project.description || "No description provided."}
              </p>
            </div>

            {/* Recent Tasks */}
            <div className="liquid-glass p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Recent Tasks</h2>
                <button
                  onClick={() => setActiveTab("tasks")}
                  className="text-xs text-[var(--primary-light)] hover:underline"
                >
                  View all
                </button>
              </div>
              {projectTasks.length === 0 ? (
                <p className="text-sm text-[var(--foreground-tertiary)]">No tasks yet.</p>
              ) : (
                <div className="space-y-2">
                  {projectTasks.slice(0, 5).map((task) => {
                    const typeConfig = taskTypeConfig[task.type || "planning"] || taskTypeConfig.planning;
                    const statusCfg = taskStatusConfig[task.status] || taskStatusConfig.todo;
                    return (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all"
                      >
                        <span className="text-lg">{typeConfig.icon}</span>
                        <div className={`h-2 w-2 rounded-full shrink-0 ${statusCfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--foreground)] truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${typeConfig.bg} ${typeConfig.color}`}>
                              {task.type || "planning"}
                            </span>
                            <span className="text-[10px] text-[var(--foreground-tertiary)] capitalize">
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Meta */}
          <div className="space-y-4">
            <div className="liquid-glass p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">
                Details
              </h3>
              <div className="space-y-4">
                <DetailRow icon={<Flag className="h-4 w-4" />} label="Status" value={status.label} />
                <DetailRow icon={<TrendingUp className="h-4 w-4" />} label="Progress" value={`${progress}%`} />
                <DetailRow icon={<ListTodo className="h-4 w-4" />} label="Tasks" value={`${projectTasks.length} (${doneTasks.length} done)`} />
                {project.budget > 0 && (
                  <DetailRow icon={<Wallet className="h-4 w-4" />} label="Budget" value={`€${project.budget.toLocaleString()}`} />
                )}
              </div>
            </div>

            {project.deployed_url && (
              <div className="liquid-glass p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">
                  Live URL
                </h3>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <Globe className="h-4 w-4 text-[var(--primary-light)]" />
                  <span className="text-xs text-[var(--foreground)] truncate flex-1">{project.deployed_url}</span>
                  <button
                    onClick={() => copyToClipboard(project.deployed_url!)}
                    className="text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-[var(--success)]" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <a
                  href={project.deployed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-3 rounded-xl bg-[var(--primary)]/15 text-[var(--primary-light)] py-2.5 text-sm font-medium hover:bg-[var(--primary)]/25 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Site
                </a>
              </div>
            )}

            <button
              onClick={handleDelete}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
                deleting
                  ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                  : "bg-white/[0.02] text-[var(--foreground-tertiary)] hover:bg-red-500/15 hover:text-red-400"
              }`}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Click again to confirm deletion" : "Delete project"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">All Tasks</h2>
            <span className="text-sm text-[var(--foreground-tertiary)]">
              {doneTasks.length}/{projectTasks.length} done
            </span>
          </div>

          {projectTasks.length === 0 ? (
            <div className="liquid-glass p-12 text-center">
              <p className="text-[var(--foreground-secondary)]">No tasks yet.</p>
              <p className="text-xs text-[var(--foreground-tertiary)] mt-1">
                Tasks are created automatically when you use the planning wizard.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {projectTasks.map((task) => {
                const typeConfig = taskTypeConfig[task.type || "planning"] || taskTypeConfig.planning;
                const statusCfg = taskStatusConfig[task.status] || taskStatusConfig.todo;
                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all"
                  >
                    <span className="text-xl">{typeConfig.icon}</span>
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                          {task.type || "planning"}
                        </span>
                        <span className="text-[10px] text-[var(--foreground-tertiary)] capitalize">
                          {statusCfg.label}
                        </span>
                        {task.priority && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            task.priority === "critical" ? "bg-red-500/15 text-red-300" :
                            task.priority === "high" ? "bg-orange-500/15 text-orange-300" :
                            task.priority === "medium" ? "bg-amber-500/15 text-amber-300" :
                            "bg-blue-500/15 text-blue-300"
                          }`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.due_date && (
                      <span className="text-[10px] text-[var(--foreground-tertiary)] shrink-0">
                        {new Date(task.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "design" && (
        <div className="space-y-4">
          <div className="liquid-glass p-12 text-center">
            <Palette className="h-12 w-12 text-[var(--foreground-tertiary)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Design Studio</h3>
            <p className="text-sm text-[var(--foreground-secondary)] max-w-md mx-auto">
              Coming soon: Color picker, typography selector, logo upload, and design tokens for this project.
            </p>
          </div>
        </div>
      )}

      {activeTab === "deploy" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="liquid-glass p-6">
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-4">Deployment</h3>
              {project.deployed_url ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Globe className="h-5 w-5 text-[var(--success)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--foreground-tertiary)]">Live URL</p>
                      <p className="text-sm text-[var(--foreground)] truncate">{project.deployed_url}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(project.deployed_url!)}
                      className="text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"
                    >
                      {copied ? <Check className="h-4 w-4 text-[var(--success)]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <a
                    href={project.deployed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--primary)] text-white py-2.5 text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Live Site
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    This project hasn't been deployed yet.
                  </p>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-xs text-[var(--foreground-tertiary)] mb-2">Set deployed URL</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://..."
                        id="deploy-url-input"
                        className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById("deploy-url-input") as HTMLInputElement;
                          if (input?.value) {
                            handleUpdate({ deployed_url: input.value });
                          }
                        }}
                        className="rounded-lg bg-[var(--primary)] text-white px-3 py-2 text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="liquid-glass p-6">
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-4">Source</h3>
              {project.source_url ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Globe className="h-5 w-5 text-[var(--primary-light)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--foreground-tertiary)]">Original Site</p>
                      <p className="text-sm text-[var(--foreground)] truncate">{project.source_url}</p>
                    </div>
                    <a
                      href={project.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--foreground-secondary)]">
                  No source URL set. This project was created from scratch.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <ProjectModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        onSubmit={handleUpdate}
        project={project}
      />
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
    </div>
  );
}
