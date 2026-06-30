"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Bot,
  Target,
  FolderKanban,
  Activity,
  Wallet,
  Settings,
  Search,
  LogOut,
} from "lucide-react";

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
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <>
      {/* ── Desktop: Minimal Icon Sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[52px] z-50 flex-col items-center border-r border-[var(--border)] bg-[var(--background)]">
        <div className="flex flex-col items-center gap-1 pt-3 flex-1">
          <div className="mb-4 p-2 rounded-md hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
            <Bot className="h-5 w-5 text-[var(--primary-light)]" />
          </div>

          <button
            onClick={() => document.dispatchEvent(new CustomEvent("openCommandPalette"))}
            className="p-2 rounded-md text-[var(--foreground-quaternary)] hover:text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] transition-all"
            title="Search (⌘K)"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          <div className="w-6 h-px bg-[var(--border)] my-1" />

          {primaryNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`p-2 rounded-md transition-all relative group ${
                  isActive
                    ? "bg-[var(--surface-hover)] text-[var(--primary-light)]"
                    : "text-[var(--foreground-quaternary)] hover:text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
                title={item.label}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-px h-4 w-[3px] rounded-r-full bg-[var(--primary-light)]" />
                )}
              </Link>
            );
          })}

          <div className="w-6 h-px bg-[var(--border)] my-1" />

          {secondaryNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`p-2 rounded-md transition-all ${
                  isActive
                    ? "bg-[var(--surface-hover)] text-[var(--primary-light)]"
                    : "text-[var(--foreground-quaternary)] hover:text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
                title={item.label}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
              </Link>
            );
          })}
        </div>

        <div className="pb-3">
          <button
            onClick={handleLogout}
            className="p-2 rounded-md text-[var(--foreground-quaternary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      {/* ── Mobile: Bottom Tab Bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,0px)]"
        style={{
          background: "rgba(9,9,11,0.95)",
          borderTop: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-around px-1 pt-1.5 pb-1">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-all min-w-[56px] ${
                  isActive ? "text-[var(--primary-light)]" : "text-[var(--foreground-quaternary)]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-all min-w-[56px] ${
              moreOpen ? "text-[var(--primary-light)]" : "text-[var(--foreground-quaternary)]"
            }`}
          >
            <Activity className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile: Top Header ── */}
      <header className={`lg:hidden fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${scrolled ? "border-b border-[var(--border)]" : ""}`}
        style={{ background: scrolled ? "rgba(9,9,11,0.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", WebkitBackdropFilter: scrolled ? "blur(20px)" : "none" }}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[var(--primary-light)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Mission Control</span>
          </div>
          <button
            onClick={() => document.dispatchEvent(new CustomEvent("openCommandPalette"))}
            className="p-2 rounded-md hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Search className="h-4 w-4 text-[var(--foreground-tertiary)]" />
          </button>
        </div>
      </header>

      {/* Mobile spacers */}
      <div className="lg:hidden h-12" />
      <div className="lg:hidden h-16" />
    </>
  );
}