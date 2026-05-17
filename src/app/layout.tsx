import type { ReactNode } from "react";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";

export const metadata = {
  title: "Mission Control",
  description: "AI Agent Orchestration Dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-72 flex-1 p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
