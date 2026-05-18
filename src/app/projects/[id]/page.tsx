import { ArrowLeft, FolderKanban, Flag, TrendingUp, Calendar, ListTodo, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pbGetProjects, pbGetTasks } from "@/lib/pocketbase";
import { type Project, type Task } from "@/types";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-[var(--primary-light)]", bg: "bg-[var(--primary)]/15", dot: "bg-[var(--primary)]" },
  completed: { label: "Completed", color: "text-[var(--success)]", bg: "bg-[var(--success)]/15", dot: "bg-[var(--success)]" },
  archived: { label: "Archived", color: "text-[var(--foreground-tertiary)]", bg: "bg-white/5", dot: "bg-[var(--foreground-tertiary)]" },
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [projectsResult, tasksResult] = await Promise.all([
    pbGetProjects(),
    pbGetTasks(),
  ]);

  const projects = (projectsResult.items as Project[]) || [];
  const allTasks = (tasksResult.items as Task[]) || [];

  const project = projects.find((p) => p.id === id);

  if (!project) {
    notFound();
  }

  const projectTasks = allTasks.filter((t) => t.project === id);
  const doneTasks = projectTasks.filter((t) => t.status === "done");
  const inProgressTasks = projectTasks.filter((t) => t.status === "in_progress");

  const status = statusConfig[project.status] || statusConfig.active;
  const progress = Math.min(100, Math.max(0, project.progress || 0));
  const progressColor = progress >= 80 ? "bg-[var(--success)]" : progress >= 40 ? "bg-[var(--primary)]" : "bg-[var(--primary)]/60";

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
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)]">
          {project.name}
        </h1>
      </div>

      {/* Main Content */}
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

          {/* Tasks */}
          <div className="liquid-glass p-5 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Tasks</h2>
              <span className="text-xs text-[var(--foreground-tertiary)]">{projectTasks.length} total</span>
            </div>
            {projectTasks.length === 0 ? (
              <p className="text-sm text-[var(--foreground-tertiary)]">No tasks linked to this project.</p>
            ) : (
              <div className="space-y-2">
                {projectTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all"
                  >
                    <div className={`h-2 w-2 rounded-full ${
                      task.status === "done" ? "bg-[var(--success)]" :
                      task.status === "in_progress" ? "bg-[var(--primary)]" :
                      task.status === "review" ? "bg-[var(--warning)]" :
                      "bg-slate-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--foreground)] truncate">{task.title}</p>
                      <p className="text-[10px] text-[var(--foreground-tertiary)] capitalize">{task.status.replace("_", " ")}</p>
                    </div>
                  </Link>
                ))}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                  <Flag className="h-4 w-4" />
                  Status
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${status.bg} ${status.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                  <TrendingUp className="h-4 w-4" />
                  Progress
                </div>
                <span className="text-sm font-semibold text-[var(--foreground)]">{progress}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                  <ListTodo className="h-4 w-4" />
                  Tasks
                </div>
                <span className="text-sm text-[var(--foreground)]">{projectTasks.length} ({doneTasks.length} done)</span>
              </div>

              {project.budget > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                    <Wallet className="h-4 w-4" />
                    Budget
                  </div>
                  <span className="text-sm text-[var(--foreground)]">€{project.budget.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="liquid-glass-subtle p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--foreground-tertiary)]">
                <span>Project ID</span>
                <span>{project.id.slice(0, 8)}...</span>
              </div>
              {project.icon && (
                <div className="flex items-center justify-between text-xs text-[var(--foreground-tertiary)]">
                  <span>Icon</span>
                  <span>{project.icon}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
