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
    <aside className="sidebar-glass fixed left-0 top-0 z-40 flex h-screen w-64 flex-col px-4 py-6">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="liquid-glass-subtle flex h-10 w-10 items-center justify-center">
          <Bot className="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-[var(--foreground)]">Mission Control</h1>
          <p className="text-[10px] text-[var(--muted)]">AI Orchestration</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200
                ${
                  isActive
                    ? "bg-white/10 text-[var(--foreground)] font-medium"
                    : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]"
                }
              `}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[var(--primary)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="liquid-glass-subtle mt-auto p-3">
        <p className="text-[10px] text-[var(--muted)]">LunarCreationsAgency</p>
        <p className="text-[10px] text-[var(--muted)] opacity-60">v2.0.0</p>
      </div>
    </aside>
  );
}
