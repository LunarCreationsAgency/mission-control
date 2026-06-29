import type { ReactNode } from "react";
import CyberBackground from "@/components/cyber-background";
import "./globals.css";

export const metadata = {
  title: "Mission Control",
  description: "AI Agent Orchestration Dashboard",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mission Control",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
