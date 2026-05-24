"use client";

import {
  LayoutDashboard,
  ListTodo,
  Bot,
  Target,
  FolderKanban,
  Activity,
  Wallet,
  Settings,
  Menu,
  X,
  LogOut,
  Search,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const primaryNav = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderKanban },
];

const secondaryNav = [
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <>
      {/* Desktop: Floating Dock Sidebar */}
      <aside className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-2 py-4 px-2 rounded-[28px] liquid-glass-strong">
        <div className="mb-2 p-2">
          <Bot className="h-6 w-6 text-[var(--primary-light)]" />
        </div>

        <button
          onClick={() => document.dispatchEvent(new CustomEvent("openCommandPalette"))}
          className="mb-1 group relative flex items-center justify-center rounded-[14px] p-3 transition-all duration-300 text-[var(--foreground-tertiary)] hover:bg-white/[0.04] hover:text-[var(--foreground-secondary)]"
        >
          <Search className="h-[20px] w-[20px]" />
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-white/[0.08] text-[11px] font-medium text-[var(--foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none border border-white/[0.08]">
            Search (⌘K)
          </span>
        </button>

        <nav className="flex flex-col gap-1">
          {[...primaryNav, ...secondaryNav].map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center justify-center rounded-[14px] p-3 transition-all duration-300
                  ${isActive
                    ? "bg-white/[0.08] text-[var(--primary-light)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-[var(--foreground-tertiary)] hover:bg-white/[0.04] hover:text-[var(--foreground-secondary)]"
                  }
                `}
              >
                <Icon className="h-[20px] w-[20px]" />
                <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-white/[0.08] text-[11px] font-medium text-[var(--foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none border border-white/[0.08]">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[var(--primary-light)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-2 group relative flex items-center justify-center rounded-[14px] p-3 transition-all duration-300 text-[var(--foreground-tertiary)] hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-[20px] w-[20px]" />
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-white/[0.08] text-[11px] font-medium text-[var(--foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none border border-white/[0.08]">
            Logout
          </span>
        </button>
      </aside>

      {/* Mobile: Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] pt-2"
        style={{
          background: "rgba(10,10,15,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
        }}
      >
        {primaryNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px] ${
                isActive
                  ? "text-[var(--primary-light)]"
                  : "text-[var(--foreground-tertiary)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--primary-light)]" />
              )}
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px] ${
            moreOpen ? "text-[var(--primary-light)]" : "text-[var(--foreground-tertiary)]"
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* Mobile: More Sheet */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end"
          onClick={() => setMoreOpen(false)}
        >
          <div className="absolute inset-0 bg-[#0a0a0f]/60" />
          <div
            className="relative w-full rounded-t-[24px] p-6 pb-[calc(80px+env(safe-area-inset-bottom,0px))]"
            style={{
              background: "#16161e",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              animation: "slideUp 0.2s ease forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />

            <div className="space-y-1">
              {secondaryNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${
                      isActive
                        ? "bg-white/[0.06] text-[var(--foreground)] font-medium"
                        : "text-[var(--foreground-secondary)] hover:bg-white/[0.04]"
                    }`}
                    onClick={() => setMoreOpen(false)}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-[var(--primary-light)]" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => { setMoreOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition-all hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <header className={`lg:hidden fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? "glass-header" : ""}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-[var(--primary-light)]" />
            <div>
              <h1 className="text-sm font-semibold text-[var(--foreground)]">Mission Control</h1>
              <p className="text-[10px] text-[var(--foreground-tertiary)]">AI Orchestration</p>
            </div>
          </div>
          <button
            onClick={() => document.dispatchEvent(new CustomEvent("openCommandPalette"))}
            className="liquid-glass-subtle p-2.5 rounded-xl"
          >
            <Search className="h-5 w-5 text-[var(--foreground-tertiary)]" />
          </button>
        </div>
      </header>

      {/* Mobile spacers */}
      <div className="lg:hidden h-14" />
      <div className="lg:hidden h-16" />
    </>
  );
}
