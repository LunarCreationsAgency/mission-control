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
        <main className="min-h-screen lg:pl-[52px]">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
      </ToastProvider>
    </>
  );
}