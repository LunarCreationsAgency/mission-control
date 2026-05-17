import type { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
