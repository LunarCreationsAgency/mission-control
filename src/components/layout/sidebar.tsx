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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar-glass fixed left-0 top-0 z-40 flex h-screen w-72 flex-col px-5 py-8">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="liquid-glass-subtle flex h-10 w-10 items-center justify-center">
          <Bot className="h-5 w-5 text-[var(--primary-light)]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Mission Control</h1>
          <p className="text-[11px] text-[var(--foreground-tertiary)] tracking-wide uppercase">AI Orchestration</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 stagger-children">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[13px] transition-all duration-200
                ${
                  isActive
                    ? "bg-white/[0.06] text-[var(--foreground)] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] active-pulse"
                    : "text-[var(--foreground-secondary)] hover:bg-white/[0.03] hover:text-[var(--foreground)]"
                }
              `}
            >
              <Icon className={`h-[18px] w-[18px] transition-colors ${isActive ? "text-[var(--primary-light)]" : "text-[var(--foreground-tertiary)] group-hover:text-[var(--foreground-secondary)]"}`} />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--primary-light)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="liquid-glass-subtle mt-auto p-4">
        <p className="text-[10px] text-[var(--foreground-tertiary)] tracking-wide uppercase font-medium">LunarCreationsAgency</p>
        <p className="text-[10px] text-[var(--foreground-tertiary)] opacity-50 mt-0.5">v2.0.0</p>
      </div>
    </aside>
  );
}
