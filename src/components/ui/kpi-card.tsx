"use client";

import { type ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent: string;
}

export default function KpiCard({ title, value, subtitle, icon, accent }: KpiCardProps) {
  return (
    <div className="liquid-glass group relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02]">
      {/* Glow effect */}
      <div
        className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{title}</p>
          <h3 className="text-3xl font-bold text-[var(--foreground)]">{value}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
          )}
        </div>
        <div
          className="liquid-glass-subtle flex h-10 w-10 shrink-0 items-center justify-center"
          style={{ color: accent }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
