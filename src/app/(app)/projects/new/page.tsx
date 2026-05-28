"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ArrowLeft, ArrowRight, Sparkles, FileText, AlertTriangle } from "lucide-react";

interface WizardStep {
  id: string;
  question: string;
  description?: string;
  type: "single" | "multi" | "text" | "url" | "number" | "select";
  options?: Array<{ label: string; value: string; icon?: string }>;
  required?: boolean;
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
  budget?: number;
}

interface WizardSession {
  currentStep: number;
  totalSteps: number;
  answers: Record<string, unknown>;
  status: "discovering" | "ready_to_plan" | "plan_generated" | "approved";
  plan?: Plan;
}

export default function NewProjectWizard() {
  const router = useRouter();
  const [session, setSession] = useState<WizardSession | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep | null>(null);
  const [progress, setProgress] = useState({ current: 1, total: 7 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Current answer state
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(new Set());
  const [textAnswer, setTextAnswer] = useState("");

  const startWizard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setSession(data.session);
      setCurrentStep(data.step);
      setProgress(data.progress);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start wizard");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !currentStep || loading) return;

    let answer: unknown;
    if (currentStep.type === "single" || currentStep.type === "select") {
      answer = selectedSingle;
    } else if (currentStep.type === "multi") {
      answer = Array.from(selectedMulti);
    } else if (currentStep.type === "text" || currentStep.type === "url" || currentStep.type === "number") {
      answer = textAnswer.trim() || undefined;
    }

    if (currentStep.required && !answer) {
      setError("Please make a selection before continuing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          session,
          stepId: currentStep.id,
          answer,
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      setSession(data.session);
      setProgress(data.progress);

      if (data.plan) {
        // Wizard complete — show plan
        setCurrentStep(null);
      } else {
        // Next step
        setCurrentStep(data.step);
        setSelectedSingle(null);
        setSelectedMulti(new Set());
        setTextAnswer("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  const approvePlan = async () => {
    if (!session?.plan || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", session }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.project?.id) {
        router.push(`/projects/${data.project.id}`);
      } else {
        throw new Error("Project created but no ID returned");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
      setCreating(false);
    }
  };

  const goBack = () => {
    if (!session || session.currentStep <= 0) {
      router.push("/projects");
      return;
    }
    // Go to previous step
    const prevStep = session.currentStep - 1;
    // This would need API support for going back — for now just reload
    window.location.reload();
  };

  const toggleMulti = (value: string) => {
    const next = new Set(selectedMulti);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    setSelectedMulti(next);
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

  // ─── NOT STARTED ───
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center page-enter">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-[var(--primary-light)]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">New Project</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mb-8">
            Answer a few questions and we'll generate a complete project plan with tasks, timeline, and budget.
          </p>
          <button
            onClick={startWizard}
            disabled={loading}
            className="flex items-center justify-center gap-2 mx-auto rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-8 py-4 text-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Start Project Wizard
              </>
            )}
          </button>
          <button
            onClick={() => router.push("/projects")}
            className="mt-4 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PLAN GENERATED ───
  if (session.plan) {
    const plan = session.plan;
    return (
      <div className="min-h-[calc(100vh-64px)] page-enter">
        <div className="max-w-2xl mx-auto px-5 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Your Project Plan</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mb-6">
            Review the generated plan below. You can edit tasks after the project is created.
          </p>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Project Card */}
          <div className="liquid-glass p-5 mb-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{plan.project_name}</h2>
            <p className="text-sm text-[var(--foreground-secondary)] mt-1">{plan.description}</p>
            <div className="flex gap-6 mt-4 pt-4 border-t border-white/[0.04]">
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--foreground)]">{plan.tasks.length}</p>
                <p className="text-[10px] text-[var(--foreground-tertiary)] uppercase tracking-wider">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {plan.budget ? `€${plan.budget.toLocaleString()}` : "—"}
                </p>
                <p className="text-[10px] text-[var(--foreground-tertiary)] uppercase tracking-wider">Budget</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {plan.tasks.reduce((a, t) => a + t.estimated_hours, 0)}h
                </p>
                <p className="text-[10px] text-[var(--foreground-tertiary)] uppercase tracking-wider">Est. Hours</p>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-2 mb-8">
            {plan.tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-lg shrink-0">{getTypeIcon(task.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                  <p className="text-xs text-[var(--foreground-tertiary)] mt-0.5">{task.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${getTypeColor(task.type)}`}>
                      {task.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                      task.priority === "high"
                        ? "bg-red-500/10 text-red-400"
                        : task.priority === "medium"
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-slate-500/10 text-slate-400"
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] text-[var(--foreground-tertiary)]">
                      ~{task.estimated_hours}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={approvePlan}
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--success)] hover:bg-emerald-600 text-white font-medium px-6 py-4 text-sm transition-all disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Approve & Create Project
                </>
              )}
            </button>
            <button
              onClick={() => router.push("/projects")}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-4 text-sm text-[var(--foreground-secondary)] hover:bg-white/[0.06] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── WIZARD STEP ───
  if (!currentStep) return null;

  const isMulti = currentStep.type === "multi";
  const isText = currentStep.type === "text" || currentStep.type === "url" || currentStep.type === "number";
  const hasAnswer = isMulti
    ? selectedMulti.size > 0
    : isText
    ? textAnswer.trim().length > 0
    : selectedSingle !== null;

  return (
    <div className="min-h-[calc(100vh-64px)] page-enter">
      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--foreground-tertiary)]">Step {progress.current} of {progress.total}</span>
            <span className="text-xs text-[var(--primary-light)] font-medium">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">{currentStep.question}</h2>
          {currentStep.description && (
            <p className="text-sm text-[var(--foreground-secondary)]">{currentStep.description}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentStep.options?.map((opt) => {
            const isSelected = isMulti
              ? selectedMulti.has(opt.value)
              : selectedSingle === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => {
                  if (isMulti) {
                    toggleMulti(opt.value);
                  } else {
                    setSelectedSingle(opt.value);
                  }
                  setError(null);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-[var(--primary)]/40 bg-[var(--primary)]/10"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{opt.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-[var(--primary-light)] ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Text Input */}
        {isText && (
          <div className="mb-8">
            <input
              type={currentStep.type === "url" ? "url" : currentStep.type === "number" ? "number" : "text"}
              value={textAnswer}
              onChange={(e) => {
                setTextAnswer(e.target.value);
                setError(null);
              }}
              placeholder={
                currentStep.type === "url"
                  ? "https://example.com"
                  : currentStep.type === "number"
                  ? "Enter a number..."
                  : "Type your answer..."
              }
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.06] transition-all"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={submitAnswer}
            disabled={loading || (currentStep.required && !hasAnswer)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-6 py-4 text-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {progress.current === progress.total ? (
                  <>Generate Plan <Sparkles className="h-4 w-4" /></>
                ) : (
                  <>Continue <ArrowRight className="h-4 w-4" /></>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
