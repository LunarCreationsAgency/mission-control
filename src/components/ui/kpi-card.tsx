"use client";

import { type ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
}

export default function KpiCard({ title, value, subtitle, icon }: KpiCardProps) {
  return (
    <div className="surface-hover p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-xs font-medium text-[var(--foreground-tertiary)]">{title}</p>
          <h3 className="text-2xl font-semibold text-[var(--foreground)]">{value}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">{subtitle}</p>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md surface text-[var(--foreground-tertiary)]">
          {icon}
        </div>
      </div>
    </div>
  );
}
