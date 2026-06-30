"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const add = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    const timer = setTimeout(() => remove(id), duration);
    timers.current.set(id, timer);
  }, [remove]);

  const success = useCallback((message: string, duration?: number) => add(message, "success", duration), [add]);
  const error = useCallback((message: string, duration?: number) => add(message, "error", duration), [add]);
  const info = useCallback((message: string, duration?: number) => add(message, "info", duration), [add]);

  return (
    <ToastContext.Provider value={{ toast: add, success, error, info }}>
      {children}
      {typeof window !== "undefined" && createPortal(
        <div className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm w-full">
          {toasts.map((t, i) => (
            <ToastItem key={t.id} toast={t} index={i} onDismiss={() => remove(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, index, onDismiss }: { toast: Toast; index: number; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle className="h-4 w-4 text-[var(--success)]" />,
    error: <AlertTriangle className="h-4 w-4 text-red-400" />,
    info: <Info className="h-4 w-4 text-[var(--primary-light)]" />,
  };

  const borders = {
    success: "border-l-[var(--success)]",
    error: "border-l-red-400",
    info: "border-l-[var(--primary-light)]",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-4 pr-3 ${borders[toast.type]} border-l-[3px] shadow-lg backdrop-blur-xl`}
      style={{
        background: "rgba(22,22,30,0.95)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderLeftWidth: "3px",
        animation: `slideInRight 0.3s ease ${index * 0.05}s both`,
      }}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-[var(--foreground)]">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--foreground-tertiary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
