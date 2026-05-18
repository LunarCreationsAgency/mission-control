"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getCompanySettings } from "@/lib/data";
import { type CompanySettings } from "@/types";
import { Settings, Building2, Globe, Coins, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { data: settingsList = [], loading, error } = useData<CompanySettings[]>("settings", getCompanySettings);
  const settings = settingsList[0] || null;

  if (loading) {
    return (
      <div className="space-y-8 pt-2 lg:pt-0">
        <div>
          <div className="skeleton h-3 w-20 mb-2" />
          <div className="skeleton h-8 w-32" />
        </div>
        <div className="skeleton h-64 rounded-[20px]" />
        <div className="skeleton h-64 rounded-[20px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 pt-2 lg:pt-0">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">Configuration</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Settings</h1>
        </div>
        <div className="liquid-glass border-red-500/20 p-8 text-center">
          <p className="text-sm text-red-400">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter pt-2 lg:pt-0">
      {/* Header */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
          Configuration
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          Manage your workspace preferences
        </p>
      </div>

      {/* Company Settings */}
      <div className="liquid-glass p-6 animated-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="liquid-glass-subtle flex h-10 w-10 items-center justify-center">
            <Building2 className="h-5 w-5 text-[var(--primary-light)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Company</h2>
            <p className="text-[11px] text-[var(--foreground-tertiary)]">Workspace details</p>
          </div>
        </div>

        {settings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SettingCard icon={<Building2 className="h-4 w-4" />} label="Company Name" value={settings.company_name} />
            <SettingCard icon={<Coins className="h-4 w-4" />} label="Currency" value={settings.currency} />
            <SettingCard icon={<Globe className="h-4 w-4" />} label="Timezone" value={settings.timezone} />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--foreground-tertiary)]">No company settings configured.</p>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="liquid-glass p-6 animated-card" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="liquid-glass-subtle flex h-10 w-10 items-center justify-center">
            <Settings className="h-5 w-5 text-[var(--primary-light)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Application</h2>
            <p className="text-[11px] text-[var(--foreground-tertiary)]">Version and system info</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SettingCard icon={<Settings className="h-4 w-4" />} label="Version" value="2.0.0" />
          <SettingCard icon={<Globe className="h-4 w-4" />} label="Framework" value="Next.js 15" />
          <SettingCard icon={<Globe className="h-4 w-4" />} label="Database" value="PocketBase" />
        </div>
      </div>

      {/* Coming Soon */}
      <div className="liquid-glass p-6 animated-card" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Coming Soon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "User management",
            "Email notifications",
            "Webhook integrations",
            "Dark/light mode toggle",
            "Export data",
            "API keys",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm text-[var(--foreground-secondary)]"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-t-white/[0.06]">
      <div className="text-[var(--foreground-tertiary)]">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--foreground-tertiary)]">{label}</p>
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{value || "Not set"}</p>
      </div>
    </div>
  );
}
