"use client";

import type { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";
import CommandPalette from "@/components/ui/command-palette";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <CommandPalette />
      <main className="min-h-screen lg:pl-20">
        <div className="mx-auto max-w-7xl p-4 lg:p-8">
          {children}
        </div>
      </main>
    </>
  );
}
