"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X, ArrowUp, ArrowDown, CornerDownLeft, Loader2, ListTodo, FolderKanban, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: "task" | "project" | "goal";
  id: string;
  title: string;
  subtitle: string;
  status: string;
  href: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CMD+K / Ctrl+K to open
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: abortRef.current.signal });
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; }
      finally { setLoading(false); }
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && results[selectedIndex]) { e.preventDefault(); setOpen(false); router.push(results[selectedIndex].href); }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, results, selectedIndex]);

  const typeIcon = {
    task: <ListTodo className="h-4 w-4 text-[var(--primary-light)]" />,
    project: <FolderKanban className="h-4 w-4 text-[var(--primary-light)]" />,
    goal: <Target className="h-4 w-4 text-[var(--agent-light)]" />,
  };
  const typeLabel = { task: "Task", project: "Project", goal: "Goal" };

  if (!open) return null;

  const palette = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-md surface-elevated" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-4 w-4 text-[var(--foreground-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, goals..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 text-[var(--foreground-tertiary)] animate-spin" />}
          <button onClick={() => setOpen(false)} className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--foreground-tertiary)] hover:bg-[var(--surface-hover)]">
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1">
          {results.length === 0 && query.trim() && !loading && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--foreground-tertiary)]">No results for "{query}"</p>
            </div>
          )}
          {results.length === 0 && !query.trim() && (
            <div className="px-4 py-4">
              <p className="text-[11px] text-[var(--foreground-tertiary)] mb-2">Quick navigation</p>
              {[
                { label: "Dashboard", href: "/", keys: ["G", "D"] },
                { label: "Tasks", href: "/tasks", keys: ["G", "T"] },
                { label: "Projects", href: "/projects", keys: ["G", "P"] },
                { label: "Goals", href: "/goals", keys: ["G", "G"] },
                { label: "Agents", href: "/agents", keys: ["G", "A"] },
              ].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
                >
                  <span>{item.label}</span>
                  <div className="flex gap-1">
                    {item.keys.map((k, i) => (
                      <span key={i} className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--surface-hover)] text-[10px] font-medium text-[var(--foreground-tertiary)]">{k}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {results.map((r, i) => (
            <Link key={`${r.type}-${r.id}`} href={r.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${i === selectedIndex ? "bg-[var(--surface-hover)]" : "hover:bg-[var(--surface-hover)]"}`}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--surface-elevated)]">{typeIcon[r.type]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">{r.title}</p>
                {r.subtitle && <p className="text-[11px] text-[var(--foreground-tertiary)] truncate">{r.subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[var(--foreground-tertiary)]">{typeLabel[r.type]}</span>
                {i === selectedIndex && <CornerDownLeft className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />}
              </div>
            </Link>
          ))}
        </div>

        {results.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--foreground-tertiary)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
              <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> select</span>
            </div>
            <span>{results.length} result{results.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(palette, document.body);
  }
  return palette;
}
