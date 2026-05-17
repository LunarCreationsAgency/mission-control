"use client";

import { type ReactNode, useEffect, useState } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent: string;
  delay?: number;
}

export default function KpiCard({ title, value, subtitle, icon, accent, delay = 0 }: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === "number" ? value : 0;

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplayValue(0);
      return;
    }
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className="liquid-glass group relative overflow-hidden p-6 hover-lift animated-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top right, ${accent}10, transparent 70%)` }}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)]">
            {title}
          </p>
          <h3 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
            {typeof value === "number" ? displayValue : value}
          </h3>
          {subtitle && (
            <p className="mt-1.5 text-xs text-[var(--foreground-secondary)]">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="liquid-glass-subtle flex h-11 w-11 shrink-0 items-center justify-center"
          style={{ color: accent }}
        >
          {icon}
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
    </div>
  );
}
