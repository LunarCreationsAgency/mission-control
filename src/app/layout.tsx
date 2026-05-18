import type { ReactNode } from "react";
import CyberBackground from "@/components/cyber-background";
import "./globals.css";

export const metadata = {
  title: "Mission Control",
  description: "AI Agent Orchestration Dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CyberBackground />
        {children}
      </body>
    </html>
  );
}
