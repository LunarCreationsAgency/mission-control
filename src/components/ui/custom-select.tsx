"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      // Don't close if click is inside the trigger OR inside the menu
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    function handleScroll() {
      if (isOpen) updatePosition();
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      updatePosition();
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen, updatePosition]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const dropdown = (
    <div
      ref={menuRef}
      className="z-[99999]"
      style={{
        position: "fixed",
        top: menuPos?.top ?? 0,
        left: menuPos?.left ?? 0,
        width: menuPos?.width ?? 0,
      }}
    >
      <div
        className="overflow-hidden rounded-lg border border-[var(--border)]"
        style={{
          background: "#16161e",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        <div className="max-h-[240px] overflow-y-auto py-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                ${option.value === value
                  ? "bg-[var(--primary)]/10 text-white"
                  : "text-[var(--foreground-secondary)] hover:bg-white/[0.04] hover:text-white"
                }
              `}
            >
              {option.icon && <span className="shrink-0">{option.icon}</span>}
              <span className="flex-1 text-left truncate">{option.label}</span>
              {option.value === value && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary-light)]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-1.5">
          {label}
        </label>
      )}
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        className={`
          flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all
          ${disabled
            ? "border-white/[0.04] bg-white/[0.02] text-[var(--foreground-tertiary)] cursor-not-allowed"
            : "border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.06] cursor-pointer"
          }
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {selected?.icon && (
            <span className="shrink-0">{selected.icon}</span>
          )}
          <span className={`truncate ${!selected ? "text-[var(--foreground-tertiary)]" : ""}`}>
            {selected?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--foreground-tertiary)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown — portaled to body */}
      {isOpen && menuPos && typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
