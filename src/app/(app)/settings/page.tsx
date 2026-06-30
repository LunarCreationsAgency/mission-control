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
      <div className="p-8 space-y-6">
        <div className="h-7 w-32 bg-[var(--surface)] rounded-md  mb-2" />
        <div className="h-64 bg-[var(--surface)] rounded-md " />
        <div className="h-64 bg-[var(--surface)] rounded-md " />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
        <p className="text-sm text-[var(--destructive)] mb-4">Failed to load settings</p>
        <button className="px-4 py-2 rounded-md bg-[var(--primary)] text-white text-sm font-medium">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--foreground-tertiary)] mb-2">Configuration</p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Settings</h1>
        </div>
        {settings && !editing && (
          <button onClick={startEditing}
            className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>

      {/* Company Settings */}
      <div className="surface p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-md bg-[var(--primary-subtle)] flex items-center justify-center">
            <Building2 className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Company</h2>
            <p className="text-[11px] text-[var(--foreground-tertiary)]">Workspace details</p>
          </div>
        </div>

        {settings ? (
          editing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Company Name</label>
                <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full rounded-md bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Currency</label>
                  <input type="text" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-md bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Timezone</label>
                  <input type="text" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="w-full rounded-md bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">Vercel Token</label>
                <input type="password" value={form.vercel_token} onChange={(e) => setForm({ ...form, vercel_token: e.target.value })} placeholder="vc_..." className="w-full rounded-md bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                <p className="text-[10px] text-[var(--foreground-tertiary)]">vercel.com/account/tokens</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)]">GitHub Token</label>
                <input type="password" value={form.github_token} onChange={(e) => setForm({ ...form, github_token: e.target.value })} placeholder="ghp_..." className="w-full rounded-md bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                <p className="text-[10px] text-[var(--foreground-tertiary)]">github.com/settings/tokens</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditing(false)} className="flex-1 rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] text-white font-medium px-4 py-2.5 text-sm disabled:opacity-50 transition-colors"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Check className="h-4 w-4" /> Save
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
      <div className="surface p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-md bg-[var(--primary-subtle)] flex items-center justify-center">
            <Settings className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Application</h2>
            <p className="text-[11px] text-[var(--foreground-tertiary)]">Version and system info</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
    <div className="flex items-center gap-3 p-4 rounded-md bg-[var(--surface)]">
      <div className="text-[var(--foreground-tertiary)]">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--foreground-tertiary)]">{label}</p>
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{value || "Not set"}</p>
      </div>
    </div>
  );
}
