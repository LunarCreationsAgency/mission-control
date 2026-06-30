"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, FolderKanban, Flag, TrendingUp, ListTodo, Wallet,
  Trash2, Pencil, LayoutDashboard, CheckSquare, Palette, Rocket,
  ExternalLink, Globe, Copy, Check, Type, Image, Sparkles, Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Project, type Task } from "@/types";
import { getProjects, getTasks, deleteProject, updateProject } from "@/lib/data";
import ProjectModal from "@/components/ui/project-modal";
import { useToast } from "@/components/ui/toast";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary-subtle)]", dot: "bg-[var(--primary)]" },
  completed: { label: "Completed", color: "text-[var(--success)]", bg: "bg-[var(--success-subtle)]", dot: "bg-[var(--success)]" },
  archived: { label: "Archived", color: "text-[var(--foreground-tertiary)]", bg: "bg-[var(--surface)]", dot: "bg-[var(--foreground-tertiary)]" },
};

const taskStatusConfig: Record<string, { label: string; dot: string }> = {
  todo: { label: "To Do", dot: "bg-[var(--foreground-tertiary)]" },
  in_progress: { label: "In Progress", dot: "bg-[var(--primary)]" },
  review: { label: "Review", dot: "bg-[var(--warning)]" },
  done: { label: "Done", dot: "bg-[var(--success)]" },
};

const taskTypeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  design: { icon: "🎨", color: "text-[var(--agent-light)]", bg: "bg-purple-500/15" },
  code: { icon: "💻", color: "text-[var(--primary-light)]", bg: "bg-blue-500/15" },
  content: { icon: "📝", color: "text-[var(--success)]", bg: "bg-emerald-500/15" },
  deploy: { icon: "🚀", color: "text-[var(--warning)]", bg: "bg-orange-500/15" },
  planning: { icon: "📋", color: "text-[var(--foreground-secondary)]", bg: "bg-slate-500/15" },
  shop: { icon: "🛒", color: "text-[var(--coral)]", bg: "bg-pink-500/15" },
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
        <div className="surface h-8 w-48" />
        <div className="surface h-4 w-32" />
        <div className="surface h-10 w-96 rounded-lg" />
        <div className="surface h-64 rounded-lg" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="space-y-6 pt-2 lg:pt-0">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
        <div className="surface-elevated p-12 text-center">
          <p className="text-[var(--foreground-secondary)]">Project not found.</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[project.status] || statusConfig.active;
  const progress = Math.min(100, Math.max(0, project.progress || 0));
  const progressColor = progress >= 80 ? "bg-[var(--success)]" : progress >= 40 ? "bg-[var(--primary)]" : "bg-[var(--primary-subtle)]";
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
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 bg-[var(--success-subtle)] text-[var(--success)] hover:bg-[var(--success-subtle)] transition-colors"
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
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
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

      {/* Tabs — mobile: pill-style, scrollable with snap; desktop: tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-3 px-3 sm:-mx-0 sm:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`snap-start flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] select-none  ${
                isActive
                  ? "bg-[var(--primary-subtle)] text-[var(--primary-light)]"
                  : "text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "tasks" && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--surface-hover)] text-[10px] font-bold px-1.5">
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
            <div className="surface-elevated p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Progress</h2>
                <span className="text-2xl font-bold text-[var(--foreground)]">{progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--surface-elevated)] overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-colors ${progressColor}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--foreground-tertiary)]">
                {doneTasks.length} of {projectTasks.length} tasks completed
              </p>
            </div>

            {/* Description */}
            <div className="surface-elevated p-5 lg:p-6">
              <h2 className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-[var(--foreground)]">Description</h2>
              <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                {project.description || "No description provided."}
              </p>
            </div>

            {/* Recent Tasks */}
            <div className="surface-elevated p-5 lg:p-6">
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
                        className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors"
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
            <div className="surface-elevated p-5">
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
              <div className="surface-elevated p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">
                  Live URL
                </h3>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
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
                  className="flex items-center justify-center gap-2 mt-3 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary-light)] py-2.5 text-sm font-medium hover:bg-[var(--primary-subtle)] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Site
                </a>
              </div>
            )}

            <button
              onClick={handleDelete}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors ${
                deleting
                  ? "bg-red-500/15 text-[var(--destructive)] hover:bg-red-500/25"
                  : "bg-[var(--surface)] text-[var(--foreground-tertiary)] hover:bg-red-500/15 hover:text-[var(--destructive)]"
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
            <div className="surface-elevated p-12 text-center">
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
                    className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors"
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
                            task.priority === "critical" ? "bg-red-500/15 text-[var(--destructive)]" :
                            task.priority === "high" ? "bg-orange-500/15 text-[var(--warning)]" :
                            task.priority === "medium" ? "bg-[var(--warning-subtle)] text-[var(--warning)]" :
                            "bg-blue-500/15 text-[var(--primary-light)]"
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

      {activeTab === "design" && <DesignTab project={project} onUpdate={handleUpdate} />}

      {activeTab === "deploy" && <DeployTab project={project} onUpdate={handleUpdate} />}

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

function DesignTab({ project, onUpdate }: { project: Project; onUpdate: (u: Partial<Project>) => void }) {
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState({
    primary: project.color_primary || "#6366f1",
    secondary: project.color_secondary || "#8b5cf6",
    accent: project.color_accent || "#ec4899",
    background: project.color_background || "#0f0f23",
  });
  const [fonts, setFonts] = useState({
    heading: project.font_heading || "Inter",
    body: project.font_body || "Inter",
  });
  const [logoUrl, setLogoUrl] = useState(project.logo_url || "");
  const [vibe, setVibe] = useState(project.design_vibe || "");

  const colorPresets = [
    { name: "Cyberpunk", colors: { primary: "#00f0ff", secondary: "#7000ff", accent: "#ff0055", background: "#0a0a1a" } },
    { name: "Minimal", colors: { primary: "#171717", secondary: "#525252", accent: "#ef4444", background: "#fafafa" } },
    { name: "Nature", colors: { primary: "#059669", secondary: "#10b981", accent: "[var(--primary)]", background: "#f0fdf4" } },
    { name: "Ocean", colors: { primary: "#2563eb", secondary: "#3b82f6", accent: "#06b6d4", background: "#f0f9ff" } },
    { name: "Sunset", colors: { primary: "#ea580c", secondary: "[var(--coral)]", accent: "#eab308", background: "#fff7ed" } },
    { name: "Dark Luxury", colors: { primary: "#d4af37", secondary: "#a855f7", accent: "#ec4899", background: "[var(--background)]" } },
  ];

  const fontOptions = ["Inter", "Roboto", "Poppins", "Playfair Display", "Montserrat", "Space Grotesk", "JetBrains Mono", "Fira Code"];

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      color_primary: colors.primary,
      color_secondary: colors.secondary,
      color_accent: colors.accent,
      color_background: colors.background,
      font_heading: fonts.heading,
      font_body: fonts.body,
      logo_url: logoUrl,
      design_vibe: vibe,
    });
    setSaving(false);
  };

  const applyPreset = (preset: typeof colorPresets[number]) => {
    setColors(preset.colors);
  };

  return (
    <div className="space-y-6">
      {/* Color Palette */}
      <div className="surface-elevated p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="h-5 w-5 text-[var(--primary-light)]" />
          <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Color Palette</h2>
        </div>

        {/* Presets */}
        <div className="mb-5">
          <p className="text-xs text-[var(--foreground-tertiary)] mb-2">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex gap-0.5">
                  <div className="h-4 w-4 rounded-full" style={{ background: preset.colors.primary }} />
                  <div className="h-4 w-4 rounded-full" style={{ background: preset.colors.secondary }} />
                  <div className="h-4 w-4 rounded-full" style={{ background: preset.colors.accent }} />
                </div>
                <span className="text-xs text-[var(--foreground)]">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "primary", label: "Primary", value: colors.primary },
            { key: "secondary", label: "Secondary", value: colors.secondary },
            { key: "accent", label: "Accent", value: colors.accent },
            { key: "background", label: "Background", value: colors.background },
          ].map((c) => (
            <div key={c.key} className="space-y-2">
              <label className="text-xs text-[var(--foreground-tertiary)]">{c.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={c.value}
                  onChange={(e) => setColors({ ...colors, [c.key]: e.target.value })}
                  className="h-10 w-10 rounded-lg border-0 p-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={c.value}
                  onChange={(e) => setColors({ ...colors, [c.key]: e.target.value })}
                  className="flex-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--primary)]/40"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="mt-5 p-6 rounded-lg" style={{ background: colors.background }}>
          <p className="text-sm font-semibold mb-3" style={{ color: colors.primary }}>Preview Heading</p>
          <p className="text-sm mb-3" style={{ color: colors.secondary }}>Secondary text and descriptions appear here.</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: colors.accent + "20", color: colors.accent }}>
              <Sparkles className="h-3 w-3" /> Accent Button
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: colors.primary + "20", color: colors.primary }}>
              Primary CTA
            </span>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="surface-elevated p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Type className="h-5 w-5 text-[var(--primary-light)]" />
          <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Typography</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-[var(--foreground-tertiary)]">Heading Font</label>
            <select
              value={fonts.heading}
              onChange={(e) => setFonts({ ...fonts, heading: e.target.value })}
              className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/40"
            >
              {fontOptions.map((f) => (
                <option key={f} value={f} className="bg-[var(--surface-elevated)] text-[var(--foreground)]">{f}</option>
              ))}
            </select>
            <p className="text-lg font-bold mt-2" style={{ fontFamily: fonts.heading }}>Aa Heading Sample</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[var(--foreground-tertiary)]">Body Font</label>
            <select
              value={fonts.body}
              onChange={(e) => setFonts({ ...fonts, body: e.target.value })}
              className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/40"
            >
              {fontOptions.map((f) => (
                <option key={f} value={f} className="bg-[var(--surface-elevated)] text-[var(--foreground)]">{f}</option>
              ))}
            </select>
            <p className="text-sm mt-2" style={{ fontFamily: fonts.body }}>The quick brown fox jumps over the lazy dog.</p>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="surface-elevated p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Image className="h-5 w-5 text-[var(--primary-light)]" />
          <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Logo</h2>
        </div>
        <div className="space-y-3">
          <label className="text-xs text-[var(--foreground-tertiary)]">Logo URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40"
            />
          </div>
          {logoUrl && (
            <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
              <img src={logoUrl} alt="Logo preview" className="max-h-24 max-w-full object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* Design Vibe */}
      <div className="surface-elevated p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="h-5 w-5 text-[var(--primary-light)]" />
          <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Design Vibe</h2>
        </div>
        <div className="space-y-3">
          <label className="text-xs text-[var(--foreground-tertiary)]">Mood / Direction</label>
          <textarea
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="e.g., 'Dark cyberpunk with neon accents. Premium feel, minimal UI, bold typography.'"
            rows={3}
            className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 resize-none"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] text-[var(--foreground)] px-5 py-2.5 text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Design Tokens"}
        </button>
      </div>
    </div>
  );
}

function DeployTab({ project, onUpdate }: { project: Project; onUpdate: (u: Partial<Project>) => void }) {
  const { success, error: toastError } = useToast();
  const [deploying, setDeploying] = useState(false);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [githubRepo, setGithubRepo] = useState(project.github_repo || "");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deploy", projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success("Deployment triggered!");
      if (data.deployment?.url) {
        onUpdate({ deployed_url: data.deployment.url });
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setDeploying(false);
    }
  };

  const sanitizeVercelName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const cleanName = sanitizeVercelName(newProjectName.trim());
    if (!cleanName) {
      toastError("Invalid project name. Use letters, numbers, dots, hyphens, underscores only.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-project", name: cleanName, projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success("Vercel project created!");
      if (data.project?.id) {
        onUpdate({ vercel_project_id: data.project.id });
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveGithub = async () => {
    try {
      await onUpdate({ github_repo: githubRepo.trim() });
      success("GitHub repo saved");
    } catch (e) {
      toastError("Failed to save");
    }
  };

  const handleCreateRepo = async () => {
    if (!githubRepo.trim()) return;
    const cleanName = githubRepo.trim();
    setCreating(true);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-repo", name: cleanName, description: `Source code for ${project.name}`, projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      success("GitHub repo created and linked!");
      if (data.repo?.full_name) {
        setGithubRepo(data.repo.full_name);
        onUpdate({ github_repo: data.repo.full_name });
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to create repo");
    } finally {
      setCreating(false);
    }
  };

  const loadDeployments = async () => {
    if (!project.vercel_project_id) return;
    setLoadingDeployments(true);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeployments(data.deployments?.deployments || []);
    } catch (e) {
      console.error("Failed to load deployments:", e);
    } finally {
      setLoadingDeployments(false);
    }
  };

  useEffect(() => {
    if (project.vercel_project_id) {
      loadDeployments();
    }
  }, [project.vercel_project_id]);

  const statusColors: Record<string, string> = {
    READY: "bg-[var(--success)]",
    BUILDING: "bg-[var(--warning)]",
    ERROR: "bg-red-500",
    CANCELED: "bg-slate-500",
  };

  return (
    <div className="space-y-6">
      {/* Vercel Connection */}
      <div className="surface-elevated p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Rocket className="h-5 w-5 text-[var(--primary-light)]" />
          <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Vercel Connection</h2>
        </div>

        {project.vercel_project_id ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <Globe className="h-5 w-5 text-[var(--success)]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--foreground-tertiary)]">Vercel Project ID</p>
                <p className="text-sm text-[var(--foreground)] truncate font-mono">{project.vercel_project_id}</p>
              </div>
            </div>

            {project.deployed_url ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <Globe className="h-5 w-5 text-[var(--success)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--foreground-tertiary)]">Live URL</p>
                    <p className="text-sm text-[var(--foreground)] truncate">{project.deployed_url}</p>
                  </div>
                  <button onClick={() => copyToClipboard(project.deployed_url!)} className="text-[var(--foreground-tertiary)] hover:text-[var(--foreground)]">
                    {copied ? <Check className="h-4 w-4 text-[var(--success)]" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <a href={project.deployed_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-lg bg-[var(--primary)] text-[var(--foreground)] py-2.5 text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors">
                  <ExternalLink className="h-4 w-4" /> Open Live Site
                </a>
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-secondary)]">Project linked but not yet deployed.</p>
            )}

            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-[var(--primary)] text-[var(--foreground)] py-2.5 text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
            >
              <Rocket className="h-4 w-4" />
              {deploying ? "Deploying..." : "Deploy to Production"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--foreground-secondary)]">
              No Vercel project linked. Create one or connect an existing project.
            </p>
            <div className="space-y-2">
              <label className="text-xs text-[var(--foreground-tertiary)]">New Vercel Project Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="my-awesome-site"
                  className="flex-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40"
                />
                <button
                  onClick={handleCreateProject}
                  disabled={creating || !newProjectName.trim()}
                  className="rounded-lg bg-[var(--primary)] text-[var(--foreground)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
                >
                  {creating ? "..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GitHub Repo */}
      <div className="surface-elevated p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-5">
          <ExternalLink className="h-5 w-5 text-[var(--primary-light)]" />
          <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">GitHub Repository</h2>
        </div>
        <div className="space-y-3">
          {project.github_repo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <ExternalLink className="h-5 w-5 text-[var(--success)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--foreground-tertiary)]">Linked Repository</p>
                  <p className="text-sm text-[var(--foreground)] truncate font-mono">{project.github_repo}</p>
                </div>
                <a
                  href={`https://github.com/${project.github_repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary-light)] hover:underline text-xs flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> Open
                </a>
              </div>
              <button
                onClick={() => { setGithubRepo(""); onUpdate({ github_repo: "" }); }}
                className="text-xs text-[var(--foreground-tertiary)] hover:text-[var(--destructive)] transition-colors"
              >
                Unlink repository
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--foreground-secondary)]">
                No repository linked. Create one on GitHub or enter an existing repo.
              </p>
              <div className="space-y-2">
                <label className="text-xs text-[var(--foreground-tertiary)]">Repository Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="my-awesome-site"
                    className="flex-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40"
                  />
                  <button
                    onClick={handleCreateRepo}
                    disabled={creating || !githubRepo.trim()}
                    className="rounded-lg bg-[var(--primary)] text-[var(--foreground)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
                  >
                    {creating ? "..." : "Create"}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--foreground-tertiary)]">
                  Creates a private GitHub repo + auto-links to Vercel project
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="h-px flex-1 bg-[var(--surface-elevated)]" />
                <span className="text-[10px] text-[var(--foreground-tertiary)]">or link existing</span>
                <div className="h-px flex-1 bg-[var(--surface-elevated)]" />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="owner/existing-repo"
                  className="flex-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40"
                />
                <button onClick={handleSaveGithub} className="rounded-lg bg-[var(--surface-hover)] text-[var(--foreground)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--surface-elevated)] transition-colors">
                  Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deployment History */}
      {project.vercel_project_id && (
        <div className="surface-elevated p-5 lg:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Deployment History</h2>
            <button onClick={loadDeployments} disabled={loadingDeployments} className="text-xs text-[var(--primary-light)] hover:underline">
              {loadingDeployments ? "Loading..." : "Refresh"}
            </button>
          </div>

          {deployments.length === 0 ? (
            <p className="text-sm text-[var(--foreground-tertiary)]">No deployments yet.</p>
          ) : (
            <div className="space-y-2">
              {deployments.slice(0, 10).map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <div className={`h-2 w-2 rounded-full ${statusColors[d.state] || "bg-[var(--foreground-tertiary)]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--foreground)] truncate">{d.meta?.githubCommitMessage || d.id.slice(0, 8)}</p>
                    <p className="text-xs text-[var(--foreground-tertiary)]">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  {d.url && (
                    <a href={`https://${d.url}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary-light)] hover:underline text-xs">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
