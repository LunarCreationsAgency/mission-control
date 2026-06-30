"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, ListTodo, Bot, Target, FolderKanban,
  Activity, Wallet, Settings, Menu, X
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: ListTodo, label: "Tasks" },
  { href: "/agents", icon: Bot, label: "Agents" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/activity", icon: Activity, label: "Activity" },
  { href: "/budgets", icon: Wallet, label: "Budgets" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 h-screen bg-[var(--surface)] border-r border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
          <div className="h-8 w-8 rounded-md bg-[var(--primary)] flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Mission Control</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${active
                    ? "bg-[var(--primary-subtle)] text-[var(--primary-light)]"
                    : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-[var(--primary)] flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Mission Control</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-md hover:bg-[var(--surface-hover)] text-[var(--foreground-secondary)]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-[var(--border)] bg-[var(--surface)] px-3 py-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${active
                      ? "bg-[var(--primary-subtle)] text-[var(--primary-light)]"
                      : "text-[var(--foreground-secondary)]"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
    </>
  );
}
