"use client";

import { useState, useEffect, useCallback } from "react";
import { type Project, type Task } from "@/types";
import { FolderKanban, Plus, Trash2, ChevronRight } from "lucide-react";
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
        getProjects(), getTasks(),
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

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const getTaskCount = (projectId: string) => tasks.filter((t) => t.project === projectId).length;
  const getDoneTaskCount = (projectId: string) => tasks.filter((t) => t.project === projectId && t.status === "done").length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-32 rounded-md bg-[var(--surface)]  mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-md bg-[var(--surface)] " />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <p className="text-sm text-[var(--destructive)] mb-4">Failed to load projects</p>
        <button onClick={fetchData} className="px-4 py-2 rounded-md bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">Projects</h1>
          <p className="text-sm text-[var(--foreground-tertiary)] mt-0.5">{projects.length} projects</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-dark)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((project) => {
          const taskCount = getTaskCount(project.id);
          const doneCount = getDoneTaskCount(project.id);
          const progress = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;

          return (
            <div key={project.id} className="surface-hover p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-[var(--surface-hover)] flex items-center justify-center">
                    <FolderKanban className="h-4 w-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <Link href={`/projects/${project.id}`} className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary-light)] transition-colors">
                      {project.name}
                    </Link>
                    <span className={`ml-2 text-[11px] font-medium px-2 py-0.5 rounded-md
                      ${project.status === "active" ? "bg-[var(--success-subtle)] text-[var(--success)]" : "bg-[var(--foreground-quaternary)]/20 text-[var(--foreground-tertiary)]"}`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className={`h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                    ${deletingId === project.id ? "bg-[var(--destructive-subtle)] text-[var(--destructive)]" : "text-[var(--foreground-tertiary)] hover:text-[var(--destructive)] hover:bg-[var(--destructive-subtle)]"}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-sm text-[var(--foreground-secondary)] mb-4 line-clamp-2">
                {project.description || "No description"}
              </p>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[var(--foreground-tertiary)]">{doneCount}/{taskCount} tasks</span>
                    <span className="text-[var(--foreground-secondary)] font-medium">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <Link href={`/projects/${project.id}`} className="text-[var(--foreground-tertiary)] hover:text-[var(--primary)] transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <ProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
