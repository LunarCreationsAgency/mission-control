"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useData } from "@/lib/use-data";
import { getTasks, getProjects, getAgents, updateTask, deleteTask, getTaskComments, createTaskComment } from "@/lib/data";
import { type Task, type Project, type Agent, type TaskComment } from "@/types";
import {
  ArrowLeft,
  Calendar,
  User,
  Target,
  FolderKanban,
  Flag,
  Clock,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  Send,
  Bot,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  Sparkles,
  AlertCircle,
  GitBranch,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import TaskModal from "@/components/ui/task-modal";
import CustomSelect from "@/components/ui/custom-select";
import { useToast } from "@/components/ui/toast";

const priorityConfig: Record<string, { bg: string; text: string; label: string; icon: typeof Flag }> = {
  low: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Low", icon: Flag },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Medium", icon: Flag },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", label: "High", icon: Flag },
  critical: { bg: "bg-red-500/10", text: "text-red-400", label: "Critical", icon: Flag },
};

const statusConfig: Record<string, { label: string; pill: string; dot: string }> = {
  todo: { label: "To Do", pill: "status-pill-todo", dot: "bg-amber-400" },
  in_progress: { label: "In Progress", pill: "status-pill-in_progress", dot: "bg-blue-400" },
  review: { label: "Review", pill: "status-pill-review", dot: "bg-violet-400" },
  done: { label: "Done", pill: "status-pill-done", dot: "bg-emerald-400" },
};

export default function TaskDetailPage() {
  const { success, error: toastError } = useToast();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: tasks = [], loading: tasksLoading, refetch: refetchTasks } = useData<Task[]>("tasks", getTasks);
  const { data: projects = [], loading: projectsLoading } = useData<Project[]>("projects", getProjects);
  const { data: agents = [], loading: agentsLoading } = useData<Agent[]>("agents", getAgents);

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [newAssignee, setNewAssignee] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loading = tasksLoading || projectsLoading || agentsLoading;
  const task = tasks.find((t) => t.id === id);
  const project = task?.project ? projects.find((p) => p.id === task.project) : undefined;
  const assignedAgent = task?.assignee ? agents.find((a) => a.id === task.assignee) : undefined;

  // Load comments
  useEffect(() => {
    if (id) {
      setCommentsLoading(true);
      getTaskComments(id)
        .then((data) => setComments(data))
        .catch(() => setComments([]))
        .finally(() => setCommentsLoading(false));
    }
  }, [id]);

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [feedbackText]);

  const handleApprove = useCallback(async () => {
    try {
      await updateTask(id, { status: "done", updated: new Date().toISOString() } as Record<string, unknown>);
      success("Task approved ✓");
      refetchTasks();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to approve");
    }
  }, [id, success, toastError, refetchTasks]);

  const handleReject = useCallback(async () => {
    toastError("Use the feedback box to tell the agent what to fix. The task stays in review until you approve.");
  }, [toastError]);

  const handleSendFeedback = useCallback(async () => {
    if (!feedbackText.trim()) return;
    setSendingFeedback(true);
    try {
      await createTaskComment(id, {
        task: id,
        author: "Dustin W",
        author_type: "user",
        comment_type: "feedback",
        content: feedbackText.trim(),
      });
      const updated = await getTaskComments(id);
      setComments(updated);
      setFeedbackText("");
      success("Feedback sent — agent will address it on next heartbeat");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to send feedback");
    } finally {
      setSendingFeedback(false);
    }
  }, [id, feedbackText, success, toastError]);

  const handleReassign = useCallback(async () => {
    if (!newAssignee) return;
    setReassigning(true);
    try {
      const newAgent = agents.find((a) => a.id === newAssignee);
      await updateTask(id, {
        assignee: newAssignee,
        status: "todo",
        updated: new Date().toISOString(),
      } as Record<string, unknown>);
      await createTaskComment(id, {
        task: id,
        author: "System",
        author_type: "system",
        comment_type: "reassignment",
        content: `Reassigned to ${newAgent?.name || "new agent"}. Previous: ${assignedAgent?.name || "none"}.`,
      });
      const updated = await getTaskComments(id);
      setComments(updated);
      setReassignOpen(false);
      setNewAssignee("");
      success(`Reassigned to ${newAgent?.name}`);
      refetchTasks();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to reassign");
    } finally {
      setReassigning(false);
    }
  }, [id, newAssignee, agents, assignedAgent, success, toastError, refetchTasks]);

  const handleEdit = useCallback(async (data: Partial<Task>) => {
    try {
      await updateTask(id, data as Record<string, unknown>);
      success("Task updated");
      setEditModalOpen(false);
      refetchTasks();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update task");
      throw e;
    }
  }, [id, success, toastError, refetchTasks]);

  const handleDelete = useCallback(async () => {
    try {
      setDeleting(true);
      await deleteTask(id);
      success("Task deleted");
      router.push("/tasks");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to delete task");
      setDeleting(false);
    }
  }, [id, success, toastError, router]);

  // Format relative time
  const relativeTime = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-6 pb-4">
          <div className="skeleton h-5 w-32 mb-4" />
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="flex-1 px-6">
          <div className="skeleton h-full w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <AlertCircle className="h-12 w-12 text-[var(--foreground-quaternary)] mb-4" />
        <p className="text-[var(--foreground-secondary)] text-lg font-medium">Task not found</p>
        <Link href="/tasks" className="mt-4 text-sm text-[var(--primary-light)] hover:underline">
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;
  const isReview = task.status === "review";
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  // Separate comments by type for visual grouping
  const feedbackComments = comments.filter((c) => c.author_type === "user" && c.comment_type === "feedback");
  const agentComments = comments.filter((c) => c.author_type === "agent");
  const systemComments = comments.filter((c) => c.author_type === "system");

  const agentOptions = [
    { value: "", label: "Choose agent…", icon: <Bot className="h-3 w-3 text-[var(--foreground-tertiary)]" /> },
    ...agents.filter((a) => a.id !== task.assignee).map((a) => ({
      value: a.id,
      label: `${a.name} · ${a.role}`,
      icon: <div className={`h-2 w-2 rounded-full ${a.paused ? "bg-zinc-500" : "bg-emerald-400"}`} />,
    })),
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] lg:h-screen">
      {/* ── Header Bar ── */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="px-4 lg:px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--foreground-tertiary)] mb-3">
            <Link href="/tasks" className="hover:text-[var(--foreground-secondary)] transition-colors">
              Tasks
            </Link>
            <span className="text-[var(--foreground-quaternary)]">/</span>
            <span className="text-[var(--foreground-secondary)]">{task.title}</span>
          </div>

          {/* Title Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className={`status-pill ${status.pill}`}>
                  <span className={`dot ${status.dot}`} />
                  {status.label}
                </span>
                <span className={`status-pill ${priority.bg} ${priority.text}`}>
                  {priority.label}
                </span>
                {task.revision_count && task.revision_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                    <RefreshCw className="h-3 w-3" /> v{task.revision_count + 1}
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" /> Overdue
                  </span>
                )}
              </div>
              <h1 className="text-xl lg:text-2xl font-semibold text-[var(--foreground)] tracking-tight leading-tight">
                {task.title}
              </h1>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] transition-all"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground-tertiary)] hover:bg-[var(--destructive-subtle)] hover:border-[var(--destructive-border)] hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {deleting && <Loader2 className="h-3 w-3 animate-spin" />} Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content: Chat + Sidebar ── */}
      <div className="flex-1 flex min-h-0">
        {/* ── Chat Thread (Main Column) ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Review Banner */}
          {isReview && (
            <div className="flex-shrink-0 px-4 lg:px-6 py-3 bg-violet-500/[0.06] border-b border-violet-500/[0.12]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium text-violet-300">Agent submitted work for review</span>
                <span className="text-xs text-violet-400/60 ml-auto">Approve or send feedback below</span>
              </div>
            </div>
          )}

          {/* Scrollable Comment Area */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
            {/* Agent Deliverable — shown in review */}
            {isReview && task.review_notes && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="chat-avatar agent">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-violet-300">{assignedAgent?.name || "Agent"}</span>
                    <span className="text-xs text-[var(--foreground-tertiary)] ml-2">{relativeTime(task.updated)}</span>
                  </div>
                </div>
                <div className="deliverable-block ml-11">
                  {task.review_notes}
                </div>
              </div>
            )}

            {/* Comment Thread */}
            <div className="chat-thread">
              {commentsLoading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-[var(--foreground-tertiary)]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading thread…
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => {
                  const isUser = comment.author_type === "user";
                  const isAgent = comment.author_type === "agent";
                  const isSystem = comment.author_type === "system";

                  return (
                    <div key={comment.id} className={`chat-message ${isUser ? "user" : ""}`}>
                      <div className={`chat-avatar ${isUser ? "user" : isAgent ? "agent" : "system"}`}>
                        {isUser ? "DW" : isAgent ? <Bot className="h-4 w-4" /> : <GitBranch className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${isUser ? "text-[var(--primary-light)]" : isAgent ? "text-violet-300" : "text-[var(--foreground-tertiary)]"}`}>
                            {comment.author}
                          </span>
                          {comment.comment_type === "feedback" && (
                            <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">feedback</span>
                          )}
                          {comment.comment_type === "reassignment" && (
                            <span className="text-[10px] font-medium text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">reassigned</span>
                          )}
                          <span className="text-[11px] text-[var(--foreground-quaternary)]">
                            {relativeTime(comment.created)}
                          </span>
                        </div>
                        <div className={`chat-bubble ${isUser ? "user" : isAgent ? "agent" : "system"}`}>
                          <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center py-16 text-center">
                  <MessageSquare className="h-8 w-8 text-[var(--foreground-quaternary)] mb-3" />
                  <p className="text-sm text-[var(--foreground-tertiary)]">No comments yet</p>
                  <p className="text-xs text-[var(--foreground-quaternary)] mt-1">
                    {isReview ? "Send feedback to the agent" : "Start a conversation"}
                  </p>
                </div>
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Description (for non-review tasks) */}
            {!isReview && task.description && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-3">Description</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{task.description}</p>
              </div>
            )}
          </div>

          {/* ── Input Area ── */}
          <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--background)]">
            <div className="px-4 lg:px-6 py-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={isReview ? "Tell the agent what to fix…" : "Add a comment…"}
                    rows={1}
                    className="w-full rounded-lg bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-quaternary)] focus:outline-none focus:border-[var(--primary-border)] focus:bg-[var(--surface-elevated)] transition-all resize-none overflow-hidden"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSendFeedback();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleSendFeedback}
                  disabled={!feedbackText.trim() || sendingFeedback}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-4 py-3 text-sm transition-all disabled:opacity-40 disabled:hover:bg-[var(--primary)]"
                >
                  {sendingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>

              {/* Review Actions */}
              {isReview && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                  <button
                    onClick={handleApprove}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 text-sm transition-all"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] px-4 py-2 text-sm transition-all"
                  >
                    <X className="h-4 w-4" /> Request Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Properties Sidebar ── */}
        <div className="hidden lg:flex w-[280px] flex-shrink-0 border-l border-[var(--border)] bg-[var(--surface)] flex-col">
          {/* Agent Assignment */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Assignee</h3>
              <button
                onClick={() => setReassignOpen(!reassignOpen)}
                className="text-[10px] font-medium text-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
              >
                Reassign
              </button>
            </div>
            {assignedAgent ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{assignedAgent.name}</p>
                  <p className="text-[11px] text-[var(--foreground-tertiary)]">{assignedAgent.role}</p>
                </div>
                <div className={`ml-auto h-2 w-2 rounded-full ${assignedAgent.paused ? "bg-zinc-500" : "bg-emerald-400"}`} />
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-quaternary)]">Unassigned</p>
            )}

            {/* Reassign Panel */}
            {reassignOpen && (
              <div className="mt-3 pt-3 border-t border-[var(--border)] animate-fade-in">
                <CustomSelect
                  label=""
                  value={newAssignee}
                  options={agentOptions}
                  onChange={(v) => setNewAssignee(v)}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { setReassignOpen(false); setNewAssignee(""); }}
                    className="flex-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReassign}
                    disabled={!newAssignee || reassigning}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-3 py-1.5 text-xs transition-all disabled:opacity-40"
                  >
                    {reassigning && <Loader2 className="h-3 w-3 animate-spin" />}
                    Reassign
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-3">Properties</h3>
            <div className="space-y-0">
              <div className="property-row">
                <span className="property-label">Status</span>
                <span className={`status-pill ${status.pill}`}>
                  <span className={`dot ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              <div className="property-row">
                <span className="property-label">Priority</span>
                <span className={`status-pill ${priority.bg} ${priority.text}`}>{priority.label}</span>
              </div>
              <div className="property-row">
                <span className="property-label">Type</span>
                <span className="text-sm text-[var(--foreground)] capitalize">{task.type || "—"}</span>
              </div>
              {task.revision_count !== undefined && task.revision_count > 0 && (
                <div className="property-row">
                  <span className="property-label">Revisions</span>
                  <span className="text-sm text-violet-400 font-medium">{task.revision_count}</span>
                </div>
              )}
              {project && (
                <div className="property-row">
                  <span className="property-label">Project</span>
                  <Link href={`/projects/${project.id}`} className="text-sm text-[var(--primary-light)] hover:underline">
                    {project.name}
                  </Link>
                </div>
              )}
              {task.due_date && (
                <div className="property-row">
                  <span className="property-label">Due</span>
                  <span className={`text-sm ${isOverdue ? "text-red-400 font-medium" : "text-[var(--foreground)]"}`}>
                    {new Date(task.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                  </span>
                </div>
              )}
            </div>

            {/* Description in sidebar for review tasks */}
            {isReview && task.description && (
              <div className="mt-6 pt-4 border-t border-[var(--border)]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-3">Description</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{task.description}</p>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="px-5 py-3 border-t border-[var(--border)]">
            <div className="flex justify-between text-[11px] text-[var(--foreground-quaternary)]">
              <span>Created {relativeTime(task.created)}</span>
              <span>Updated {relativeTime(task.updated)}</span>
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEdit}
        initialTask={task}
        mode="edit"
      />
    </div>
  );
}