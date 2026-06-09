"use client";

import { useState } from "react";
import { useData } from "@/lib/use-data";
import { getCompanySettings, updateCompanySettings } from "@/lib/data";
import { type CompanySettings } from "@/types";
import { Settings, Building2, Globe, Coins, Loader2, Pencil, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { success, error: toastError } = useToast();
  const { data: settingsList = [], loading, error, refetch } = useData<CompanySettings[]>("settings", getCompanySettings);
  const settings = settingsList[0] || null;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: settings?.company_name || "",
    currency: settings?.currency || "EUR",
    timezone: settings?.timezone || "Europe/Berlin",
    vercel_token: settings?.vercel_token || "",
    github_token: settings?.github_token || "",
  });

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateCompanySettings(settings.id, {
        company_name: form.company_name.trim(),
        currency: form.currency.trim().toUpperCase(),
        timezone: form.timezone.trim(),
        vercel_token: form.vercel_token.trim() || null,
        github_token: form.github_token.trim() || null,
      });
      success("Settings saved");
      setEditing(false);
      refetch();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setForm({
      company_name: settings?.company_name || "",
      currency: settings?.currency || "EUR",
      timezone: settings?.timezone || "Europe/Berlin",
      vercel_token: settings?.vercel_token || "",
      github_token: settings?.github_token || "",
    });
    setEditing(true);
  };

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
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-tertiary)] mb-2">
            Configuration
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Settings</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Manage your workspace preferences
          </p>
        </div>
        {settings && !editing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-white/[0.06] transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
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
          editing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Company Name</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.06] transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Currency</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.06] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Timezone</label>
                  <input
                    type="text"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.06] transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Vercel Token</label>
                <input
                  type="password"
                  value={form.vercel_token}
                  onChange={(e) => setForm({ ...form, vercel_token: e.target.value })}
                  placeholder="vc_..."
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.06] transition-all"
                />
                <p className="text-[10px] text-[var(--foreground-tertiary)]">Your Vercel API token from vercel.com/account/tokens</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">GitHub Token</label>
                <input
                  type="password"
                  value={form.github_token}
                  onChange={(e) => setForm({ ...form, github_token: e.target.value })}
                  placeholder="ghp_..."
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-[var(--foreground-tertiary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-white/[0.06] transition-all"
                />
                <p className="text-[10px] text-[var(--foreground-tertiary)]">GitHub personal access token with 'repo' scope from github.com/settings/tokens</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition-all hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium px-4 py-2.5 text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Check className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SettingCard icon={<Building2 className="h-4 w-4" />} label="Company Name" value={settings.company_name} />
              <SettingCard icon={<Coins className="h-4 w-4" />} label="Currency" value={settings.currency} />
              <SettingCard icon={<Globe className="h-4 w-4" />} label="Timezone" value={settings.timezone} />
            </div>
          )
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
