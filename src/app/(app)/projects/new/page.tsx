"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Check, Loader2, ArrowLeft, MessageSquare, FileText, AlertTriangle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface ExtractedInfo {
  project_type?: string;
  project_name?: string;
  audience?: string;
  purpose?: string;
  design_style?: string;
  designStyle?: string;
  features?: string[];
  timeline?: string;
  budget?: number;
  source_url?: string;
  has_auth?: boolean;
  has_payment?: boolean;
  has_blog?: boolean;
  has_contact?: boolean;
  domain?: string;
  competitor?: string;
}

interface PlanTask {
  title: string;
  type: string;
  description: string;
  priority: string;
  estimated_hours: number;
}

interface Plan {
  project_name: string;
  description: string;
  tasks: PlanTask[];
}

interface Session {
  messages: Message[];
  extracted: ExtractedInfo;
  status: "discovering" | "ready_to_plan" | "plan_generated" | "approved";
  plan?: Plan;
}

export default function NewProjectWizard() {
  const router = useRouter();
  const [session, setSession] = useState<Session>({
    messages: [{
      role: "assistant",
      text: "Hey! Let's plan your project together. What are you building? (e.g., homepage, webapp, shop, blog, landing page, or tell me about an existing site you want to rebuild)",
    }],
    extracted: {},
    status: "discovering",
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setError(null);

    const newMessages = [...session.messages, { role: "user" as const, text }];
    const updatedSession = { ...session, messages: newMessages };

    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", session: updatedSession, message: text }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSession(data);
    } catch (e) {
      console.error("Failed to send message:", e);
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", session }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSession(data);
    } catch (e) {
      console.error("Failed to generate plan:", e);
      setError(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const approvePlan = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", session }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.project?.id) {
        router.push(`/projects/${data.project.id}`);
      } else {
        throw new Error("Project created but no ID returned");
      }
    } catch (e) {
      console.error("Failed to approve plan:", e);
      setError(e instanceof Error ? e.message : "Failed to create project");
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      design: "bg-purple-500/20 text-purple-300",
      code: "bg-blue-500/20 text-blue-300",
      content: "bg-emerald-500/20 text-emerald-300",
      deploy: "bg-orange-500/20 text-orange-300",
      planning: "bg-slate-500/20 text-slate-300",
    };
    return colors[type] || "bg-slate-500/20 text-slate-300";
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      design: "🎨",
      code: "💻",
      content: "📝",
      deploy: "🚀",
      planning: "📋",
    };
    return icons[type] || "📋";
  };

  const isReadyToPlan = session.status === "ready_to_plan";
  const hasPlan = !!session.plan;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row page-enter">
      {/* Left Panel — Chat */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-white/[0.04]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]">
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-4 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[var(--primary-light)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">Planning Session</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {session.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-[var(--primary)]/20 text-[var(--foreground)] rounded-br-md"
                    : "bg-white/[0.04] text-[var(--foreground-secondary)] rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/[0.04] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--primary-light)]" />
                  <span className="text-xs text-[var(--foreground-tertiary)]">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-white/[0.04]">
          {isReadyToPlan && !hasPlan ? (
            <div className="flex gap-3">
              <button
                onClick={generatePlan}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-4 py-3 text-sm transition-all disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Generate Plan
              </button>
              <button
                onClick={() => sendMessage("I'd like to discuss more details before generating the plan.")}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-[var(--foreground-secondary)] hover:bg-white/[0.06] transition-all"
              >
                Keep Talking
              </button>
            </div>
          ) : hasPlan ? (
            <div className="flex gap-3">
              <button
                onClick={approvePlan}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--success)] hover:bg-emerald-600 text-white font-medium px-4 py-3 text-sm transition-all disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Approve & Create Project
                  </>
                )}
              </button>
              <button
                onClick={() => sendMessage("I want to modify the plan. Let's discuss changes.")}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-[var(--foreground-secondary)] hover:bg-white/[0.06] transition-all"
              >
                Edit Plan
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.06] transition-all"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Plan Preview */}
      <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col min-h-0 bg-white/[0.01]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.04]">
          <FileText className="h-4 w-4 text-[var(--primary-light)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">Plan Preview</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {hasPlan && session.plan ? (
            <div className="space-y-4">
              <div className="liquid-glass p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{session.plan.project_name}</h3>
                <p className="text-xs text-[var(--foreground-secondary)] mt-1">{session.plan.description}</p>
                <div className="flex gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[var(--foreground)]">{session.plan.tasks.length}</p>
                    <p className="text-[10px] text-[var(--foreground-tertiary)] uppercase">Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[var(--foreground)]">{session.extracted.budget ? `€${session.extracted.budget}` : "—"}</p>
                    <p className="text-[10px] text-[var(--foreground-tertiary)] uppercase">Budget</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[var(--foreground)]">{session.extracted.timeline || "—"}</p>
                    <p className="text-[10px] text-[var(--foreground-tertiary)] uppercase">Timeline</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {session.plan.tasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-lg shrink-0">{getTypeIcon(task.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--foreground)] truncate">{task.title}</p>
                      <p className="text-[10px] text-[var(--foreground-tertiary)] mt-0.5 line-clamp-2">{task.description}</p>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium ${getTypeColor(task.type)}`}>
                        {task.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="liquid-glass p-4 text-center">
                <Sparkles className="h-8 w-8 text-[var(--primary-light)] mx-auto mb-2" />
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Answer the questions in the chat to generate your project plan.
                </p>
              </div>

              {session.extracted.project_type && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Extracted Info</h4>
                  <InfoRow label="Type" value={session.extracted.project_type} />
                  {session.extracted.audience && <InfoRow label="Audience" value={session.extracted.audience} />}
                  {session.extracted.purpose && <InfoRow label="Purpose" value={session.extracted.purpose} />}
                  {session.extracted.designStyle && <InfoRow label="Style" value={session.extracted.designStyle} />}
                  {session.extracted.timeline && <InfoRow label="Timeline" value={session.extracted.timeline} />}
                  {session.extracted.budget && <InfoRow label="Budget" value={`€${session.extracted.budget}`} />}
                  {session.extracted.domain && <InfoRow label="Domain" value={session.extracted.domain} />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
      <span className="text-[11px] text-[var(--foreground-tertiary)]">{label}</span>
      <span className="text-xs font-medium text-[var(--foreground)]">{value}</span>
    </div>
  );
}
