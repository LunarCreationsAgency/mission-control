import type { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen lg:pl-20">
        <div className="mx-auto max-w-7xl p-4 lg:p-8">
          {children}
        </div>
      </main>
    </>
  );
}
