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
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
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
        {/* Logo */}
        <div className="mb-2 p-2">
          <Bot className="h-6 w-6 text-[var(--primary-light)]" />
        </div>

        {/* Search */}
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("openCommandPalette"))}
          className="mb-1 group relative flex items-center justify-center rounded-[14px] p-3 transition-all duration-300 text-[var(--foreground-tertiary)] hover:bg-white/[0.04] hover:text-[var(--foreground-secondary)]"
        >
          <Search className="h-[20px] w-[20px]" />
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-white/[0.08] text-[11px] font-medium text-[var(--foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none border border-white/[0.08]">
            Search (⌘K)
          </span>
        </button>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
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

        {/* Logout */}
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

      {/* Mobile: Top Bar */}
      <header className={`lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass-header" : ""}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-[var(--primary-light)]" />
            <div>
              <h1 className="text-sm font-semibold text-[var(--foreground)]">Mission Control</h1>
              <p className="text-[10px] text-[var(--foreground-tertiary)]">AI Orchestration</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="liquid-glass-subtle p-2.5 rounded-xl"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`absolute top-full left-0 right-0 transition-all duration-300 ${mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
          <div className="mx-4 mb-4 p-3 rounded-[24px] liquid-glass-strong space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-sm transition-all duration-200
                    ${isActive
                      ? "bg-white/[0.06] text-[var(--foreground)] font-medium"
                      : "text-[var(--foreground-secondary)]"
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-[var(--primary-light)]" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-sm text-red-400 transition-all duration-200 hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Safe Area Spacer */}
      <div className="lg:hidden h-16" />
    </>
  );
}
