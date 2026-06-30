"use client";

import { useState, useEffect, useRef } from "react";
import { useData } from "@/lib/use-data";
import { getTasks, getProjects, getAgents, updateTask, deleteTask, getTaskComments, createTaskComment } from "@/lib/data";
import { type Task, type Project, type Agent, type TaskComment } from "@/types";
import { ArrowLeft, Calendar, User, Target, FolderKanban, Flag, Clock, Pencil, Trash2, Loader2, Eye, Check, X, Send, Bot, MessageSquare, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import TaskModal from "@/components/ui/task-modal";
import CustomSelect from "@/components/ui/custom-select";
import { useToast } from "@/components/ui/toast";

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Low" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Medium" },
  high: { bg: "bg-orange-500/15", text: "text-orange-400", label: "High" },
  critical: { bg: "bg-red-500/15", text: "text-red-400", label: "Critical" },
};

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  todo: { bg: "bg-slate-500/15", text: "text-slate-400", label: "To Do", dot: "bg-slate-400" },
  in_progress: { bg: "bg-[var(--primary)]/15", text: "text-[var(--primary-light)]", label: "In Progress", dot: "bg-[var(--primary)]" },
  review: { bg: "bg-[var(--warning)]/15", text: "text-[var(--warning)]", label: "Review", dot: "bg-[var(--warning)]" },
  done: { bg: "bg-[var(--success)]/15", text: "text-[var(--success)]", label: "Done", dot: "bg-[var(--success)]" },
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
  
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
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

  // Scroll to bottom of comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleApprove = async () => {
    try {
      await updateTask(id, { status: "done", updated: new Date().toISOString() } as Record<string, unknown>);
      success("Task approved");
      refetchTasks();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to approve");
    }
  };

  const handleReject = async () => {
    try {
      // Instead of just setting to todo, we keep it in review and let user add feedback
      // The worker will pick up the feedback comment and reactivate
      toastError("Use the feedback box below to tell the agent what to fix. The task will stay in review until you approve it.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to reject");
    }
  };

  const handleSendFeedback = async () => {
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
      
      // Refresh comments
      const updated = await getTaskComments(id);
      setComments(updated);
      setFeedbackText("");
      success("Feedback sent — agent will address it on next heartbeat");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to send feedback");
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleReassign = async () => {
    if (!newAssignee) return;
    
    setReassigning(true);
    try {
      const newAgent = agents.find((a) => a.id === newAssignee);
      
      await updateTask(id, { 
        assignee: newAssignee,
        status: "todo",
        updated: new Date().toISOString(),
      } as Record<string, unknown>);
      
      // Add system comment
      await createTaskComment(id, {
        task: id,
        author: "System",
        author_type: "system",
        comment_type: "reassignment",
        content: `Reassigned to ${newAgent?.name || "new agent"}. Previous agent: ${assignedAgent?.name || "none"}.`,
      });
      
      const updated = await getTaskComments(id);
      setComments(updated);
      setReassignOpen(false);
      success(`Task reassigned to ${newAgent?.name}`);
      refetchTasks();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to reassign");
    } finally {
      setReassigning(false);
    }
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = async (data: Partial<Task>) => {
    try {
      await updateTask(id, data as Record<string, unknown>);
      success("Task updated");
      setEditModalOpen(false);
      refetchTasks();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update task");
      throw e;
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteTask(id);
      success("Task deleted");
      router.push("/tasks");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to delete task");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-2 lg:pt-0">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-32 rounded-[20px]" />
            <div className="skeleton h-48 rounded-[20px]" />
          </div>
          <div className="skeleton h-64 rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6 pt-2 lg:pt-0">
        <Link href="/tasks" className="inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </Link>
        <div className="liquid-glass p-12 text-center">
          <p className="text-[var(--foreground-secondary)]">Task not found.</p>
        </div>
      </div>
    );
  }

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  const agentOptions = [
    { value: "", label: "Select agent...", icon: <Bot className="h-3 w-3 text-[var(--foreground-tertiary)]" /> },
    ...agents.filter((a) => a.id !== task.assignee).map((a) => ({
      value: a.id,
      label: `${a.name} (${a.skills?.slice(0, 2).join(", ") || a.role})`,
      icon: <div className={`h-2 w-2 rounded-full ${a.paused ? "bg-slate-400" : "bg-emerald-400"}`} />,
    })),
  ];

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <div>
        <Link href="/tasks" className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--foreground-tertiary)] transition-colors hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 ${status.bg} ${status.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1 ${priority.bg} ${priority.text}`}>
                {priority.label}
              </span>
              {task.revision_count && task.revision_count > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 bg-purple-500/15 text-purple-400">
                  <RefreshCw className="h-3 w-3" /> v{task.revision_count + 1}
                </span>
              )}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 bg-red-500/15 text-red-400">
                  <Clock className="h-3 w-3" /> Overdue
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)]">{task.title}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-white/[0.06] transition-all">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(false)}
                  className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-[var(--foreground-secondary)] hover:bg-white/[0.06]">Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 transition-all disabled:opacity-50">
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Review Panel — shown when status === "review" */}
          {task.status === "review" && (
            <div className="bg-[var(--surface-elevated)] rounded-2xl p-5 lg:p-6 border border-[var(--warning)]/20">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-[var(--warning)]" />
                <h2 className="text-base lg:text-lg font-semibold text-[var(--foreground)]">Agent Output — Awaiting Review</h2>
              </div>
              {task.review_notes ? (
                <div className="bg-white/[0.02] rounded-xl p-4 mb-4 whitespace-pre-wrap text-sm text-[var(--foreground-secondary)] leading-relaxed font-mono">
                  {task.review_notes}
                </div>
              ) : (
                <p className="text-sm text-[var(--foreground-tertiary)] mb-4">Agent submitted this task for review but provided no detailed notes.</p>
              )}
              
              {/* Comment Thread */}
              <div className="space-y-3 mb-4">
                {commentsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading comments...
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`flex gap-3 ${
                        comment.author_type === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        comment.author_type === "user"
                          ? "bg-[var(--primary)]/20 text-[var(--primary-light)]"
                          : comment.author_type === "agent"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}>
                        {comment.author_type === "user" ? "DW" : comment.author_type === "agent" ? <Bot className="h-4 w-4" /> : "S"}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        comment.author_type === "user"
                          ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20"
                          : comment.author_type === "agent"
                          ? "bg-purple-500/10 border border-purple-500/20"
                          : "bg-white/[0.03] border border-white/[0.06]"
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${
                            comment.author_type === "user"
                              ? "text-[var(--primary-light)]"
                              : comment.author_type === "agent"
                              ? "text-purple-400"
                              : "text-slate-400"
                          }`}>
                            {comment.author}
                          </span>
                          <span className="text-[10px] text-[var(--foreground-tertiary)]">
                            {new Date(comment.created).toLocaleString("de-DE", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--foreground-tertiary)] text-center py-4">No comments yet. Be the first to leave feedback.</p>
                )}
                <div ref={commentsEndRef} />
              </div>
              
              {/* Feedback Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell the agent what to fix or improve..."
                    rows={2}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 pr-12 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.06] transition-all resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSendFeedback();
                      }
                    }}
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] text-[var(--foreground-tertiary)]">
                    Cmd+Enter
                  </span>
                </div>
                <button
                  onClick={handleSendFeedback}
                  disabled={!feedbackText.trim() || sendingFeedback}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-4 py-3 text-sm transition-all disabled:opacity-50 active:scale-[0.98] shrink-0"
                >
                  {sendingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              </div>
              
              <div className="flex gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                <button onClick={handleApprove} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--success)] px-4 py-3 text-sm font-medium text-white active:scale-[0.98] transition-all">
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button onClick={handleReject} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm font-medium text-[var(--foreground-secondary)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 active:scale-[0.98] transition-all">
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          )}

          {/* Comments shown for non-review statuses too */}
          {task.status !== "review" && comments.length > 0 && (
            <div className="liquid-glass p-5 lg:p-6">
              <h2 className="mb-4 text-base lg:text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[var(--primary-light)]" /> Comments
              </h2>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className={`flex gap-3 ${comment.author_type === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      comment.author_type === "user"
                        ? "bg-[var(--primary)]/20 text-[var(--primary-light)]"
                        : comment.author_type === "agent"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-slate-500/20 text-slate-400"
                    }`}>
                      {comment.author_type === "user" ? "DW" : comment.author_type === "agent" ? <Bot className="h-4 w-4" /> : "S"}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      comment.author_type === "user"
                        ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20"
                        : comment.author_type === "agent"
                        ? "bg-purple-500/10 border border-purple-500/20"
                        : "bg-white/[0.03] border border-white/[0.06]"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${
                          comment.author_type === "user" ? "text-[var(--primary-light)]" : comment.author_type === "agent" ? "text-purple-400" : "text-slate-400"
                        }`}>{comment.author}</span>
                        <span className="text-[10px] text-[var(--foreground-tertiary)]">
                          {new Date(comment.created).toLocaleString("de-DE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="liquid-glass p-5 lg:p-6">
            <h2 className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-[var(--foreground)]">Description</h2>
            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{task.description || "No description provided."}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="liquid-glass p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><Flag className="h-4 w-4" /> Status</div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${status.bg} ${status.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><Flag className="h-4 w-4" /> Priority</div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 ${priority.bg} ${priority.text}`}>{priority.label}</span>
              </div>
              {assignedAgent && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><User className="h-4 w-4" /> Assignee</div>
                  <span className="text-sm text-[var(--foreground)]">{assignedAgent.name}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><Calendar className="h-4 w-4" /> Due Date</div>
                  <span className={`text-sm ${isOverdue ? "text-red-400 font-medium" : "text-[var(--foreground)]"}`}>{new Date(task.due_date).toLocaleDateString("de-DE")}</span>
                </div>
              )}
              {project && (
                <Link href={`/projects/${project.id}`} className="flex items-center justify-between hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><FolderKanban className="h-4 w-4" /> Project</div>
                  <span className="text-sm text-[var(--primary-light)]">{project.name}</span>
                </Link>
              )}
              {task.revision_count && task.revision_count > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-tertiary)]"><RefreshCw className="h-4 w-4" /> Revisions</div>
                  <span className="text-sm text-purple-400">{task.revision_count}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Reassign Section */}
          <div className="liquid-glass p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Reassign</h3>
            {!reassignOpen ? (
              <button
                onClick={() => setReassignOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-[var(--foreground-secondary)] hover:bg-white/[0.06] transition-all"
              >
                <RefreshCw className="h-4 w-4" /> Reassign to Another Agent
              </button>
            ) : (
              <div className="space-y-3">
                <CustomSelect
                  label="New Agent"
                  value={newAssignee}
                  options={agentOptions}
                  onChange={(v) => setNewAssignee(v)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setReassignOpen(false); setNewAssignee(""); }}
                    className="flex-1 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-[var(--foreground-secondary)] hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReassign}
                    disabled={!newAssignee || reassigning}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-3 py-2 text-xs transition-all disabled:opacity-50"
                  >
                    {reassigning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Reassign
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="liquid-glass-subtle p-4">
            <div className="space-y-2 text-xs text-[var(--foreground-tertiary)]">
              <p>Created: {new Date(task.created).toLocaleDateString("de-DE")}</p>
              <p>Updated: {new Date(task.updated).toLocaleDateString("de-DE")}</p>
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
