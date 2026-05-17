import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/components/layout/navbar";

export const metadata = {
  title: "Mission Control",
  description: "AI Agent Orchestration Dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen lg:pl-20">
          <div className="mx-auto max-w-7xl p-4 lg:p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
