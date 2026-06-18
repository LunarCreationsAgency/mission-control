"use client";

import type { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";
import CommandPalette from "@/components/ui/command-palette";
import { ToastProvider } from "@/components/ui/toast";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ToastProvider>
        <Navbar />
        <CommandPalette />
        <main className="min-h-screen lg:pl-20">
          {/* Mobile: tighter padding, safe areas; Desktop: spacious */}
          <div className="mx-auto max-w-7xl px-3 pt-14 pb-24 sm:px-4 lg:px-8 lg:pt-8 lg:pb-8">
            {children}
          </div>
        </main>
      </ToastProvider>
    </>
  );
}
