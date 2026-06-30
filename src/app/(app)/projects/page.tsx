"use client";

import { useState, useEffect, useCallback } from "react";
import { type Project, type Task } from "@/types";
import { FolderKanban, Plus, Trash2, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import ProjectModal from "@/components/ui/project-modal";
import { getProjects, getTasks, createProject, deleteProject } from "@/lib/data";
import { useToast } from "@/components/ui/toast";

export default function ProjectsPage() {
  const { success, error: toastError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData] = await Promise.all([
        getProjects(),
        getTasks(),
      ]);
      setProjects(projectsData as Project[]);
      setTasks(tasksData as Task[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (project: Partial<Project>) => {
    try {
      await createProject(project as Record<string, unknown>);
      success("Project created");
      await fetchData();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to create project");
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      try {
        await deleteProject(id);
        success("Project deleted");
        setDeletingId(null);
        await fetchData();
      } catch (e) {
        toastError(e instanceof Error ? e.message : "Failed to delete project");
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId((prev) => (prev === id ? null : prev)), 3000);
    }
  };

  const getTaskCount = (projectId: string) =>
    tasks.filter((t) => t.project === projectId).length;

  const getDoneTaskCount = (projectId: string) =>
    tasks.filter((t) => t.project === projectId && t.status === "done").length;

  if (loading) return <ProjectsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-sm text-[var(--destructive)] mb-4">Failed to load projects</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--foreground)] text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Mobile: Compact header, no giant title */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 mb-2">
        <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Projects</h1>
        <span className="text-sm text-[var(--foreground-tertiary)]">{projects.length}</span>
      </div>

      {/* Desktop: Full header */}
      <div className="hidden lg:flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
            Portfolio
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Projects</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="surface flex items-center gap-2 px-3.5 py-2">
            <FolderKanban className="h-4 w-4 text-[var(--primary-light)]" />
            <span className="text-sm font-semibold">{projects.length}</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="surface flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-[var(--surface-hover)]"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <FolderKanban className="h-12 w-12 text-[var(--foreground-tertiary)] mb-4" />
          <p className="text-sm text-[var(--foreground-secondary)] mb-6">No projects yet</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-medium text-[var(--foreground)]"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 px-3 lg:px-0 pb-24">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={getTaskCount(project.id)}
              doneCount={getDoneTaskCount(project.id)}
              onDelete={handleDelete}
              isDeleting={deletingId === project.id}
            />
          ))}
        </div>
      )}

      {/* Mobile: Floating Action Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary)] text-[var(--foreground)] shadow-lg shadow-blue-500/30 active:scale-90 transition-transform"
        aria-label="New project"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function ProjectCard({
  project,
  taskCount,
  doneCount,
  onDelete,
  isDeleting,
}: {
  project: Project;
  taskCount: number;
  doneCount: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const progress = Math.min(100, Math.max(0, project.progress || 0));
  const progressColor =
    progress >= 80
      ? "bg-[var(--success)]"
      : progress >= 40
      ? "bg-[var(--primary)]"
      : "bg-[var(--primary-subtle)]";

  const statusStyle: Record<string, { label: string; dot: string; bg: string }> = {
    active: { label: "Active", dot: "bg-[var(--primary)]", bg: "bg-[var(--primary-subtle)]" },
    completed: { label: "Done", dot: "bg-[var(--success)]", bg: "bg-[var(--success-subtle)]" },
    archived: { label: "Archived", dot: "bg-slate-500", bg: "bg-[var(--surface)]" },
  };
  const status = statusStyle[project.status] || statusStyle.active;

  return (
    <div className="lg:group lg:relative">
      {/* Mobile: Full-width card, no surface-elevated border, proper shadow */}
      <div className="lg:hidden bg-[var(--surface-elevated)] rounded-lg overflow-hidden active:scale-[0.98] transition-transform">
        <Link href={`/projects/${project.id}`} className="block p-4">
          {/* Row 1: Status badge (left) + Delete (right) */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 shrink-0 ${status.bg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              <span className="text-[var(--foreground)]">{status.label}</span>
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(project.id);
              }}
              className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all ${
                isDeleting
                  ? "bg-red-500/20 text-[var(--destructive)]"
                  : "bg-[var(--surface-elevated)] text-[var(--foreground-tertiary)] active:bg-red-500/20 active:text-[var(--destructive)]"
              }`}
            >
              {isDeleting ? (
                <span className="text-[10px] font-bold">OK?</span>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Row 2: Title */}
          <h3 className="text-base font-semibold text-[var(--foreground)] leading-snug mb-1">
            {project.name}
          </h3>

          {/* Row 3: Description */}
          {project.description && (
            <p className="text-[13px] text-[var(--foreground-tertiary)] line-clamp-2 mb-3 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Row 4: Progress bar + % */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
              <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-semibold text-[var(--foreground)] shrink-0">{progress}%</span>
          </div>

          {/* Row 5: Tasks count + Chevron */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--foreground-tertiary)]">
              {doneCount}/{taskCount} tasks
            </span>
            <ChevronRight className="h-4 w-4 text-[var(--foreground-tertiary)]" />
          </div>
        </Link>
      </div>

      {/* Desktop: Liquid surface card */}
      <div className="hidden lg:block surface-elevated group p-6   relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(project.id);
          }}
          className={`absolute top-3 right-3 z-10 flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
            isDeleting
              ? "bg-red-500/20 text-[var(--destructive)]"
              : "bg-[var(--surface-elevated)] text-[var(--foreground-tertiary)] hover:bg-red-500/20 hover:text-[var(--destructive)]"
          }`}
        >
          {isDeleting ? (
            <span className="text-[10px] font-bold">OK?</span>
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>

        <Link href={`/projects/${project.id}`} className="block">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 ${status.bg}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)] leading-snug truncate">
                {project.name}
              </h3>
            </div>
            <div className="surface flex items-center justify-center h-11 w-11 shrink-0">
              <FolderKanban className="h-5 w-5 text-[var(--primary-light)]" />
            </div>
          </div>

          {project.description && (
            <p className="text-[12px] text-[var(--foreground-tertiary)] line-clamp-2 mb-4 leading-relaxed">
              {project.description}
            </p>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-[var(--foreground-tertiary)]">Progress</span>
              <span className="text-[11px] font-semibold text-[var(--foreground)]">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
              <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-[var(--foreground-tertiary)]">
              {doneCount}/{taskCount} tasks
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-3 px-3 lg:px-0 pb-24">
      {/* Mobile skeleton */}
      <div className="lg:hidden space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--surface-elevated)] rounded-lg p-4 h-36 animate-pulse" />
        ))}
      </div>
      {/* Desktop skeleton */}
      <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-52 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
