import type { ReactNode } from "react";

export const metadata = {
  title: "Mission Control",
  description: "AI Agent Orchestration Dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
