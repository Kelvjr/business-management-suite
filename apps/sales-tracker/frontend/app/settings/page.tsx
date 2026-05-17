"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  Check,
  Clock3,
  Download,
  FileText,
  Lock,
  Mail,
  Monitor,
  Moon,
  Palette,
  Shield,
  Smartphone,
  Store,
  Sun,
  TriangleAlert,
  Upload,
} from "lucide-react";

const SETTINGS_STORAGE_KEY = "sales-tracker-settings-v1";

type SettingsSection =
  | "profile"
  | "appearance"
  | "notifications"
  | "export"
  | "security";

type ThemeMode = "light" | "dark" | "system";
type DensityMode = "comfortable" | "compact" | "expanded";
type AccentColor = "fuchsia" | "violet" | "sky";
type ExportFormat = "csv" | "excel" | "pdf";
type BackupFrequency = "daily" | "weekly" | "monthly";
type SessionTimeout = "15m" | "30m" | "1h";

type SettingsState = {
  profile: {
    storeName: string;
    ownerEmail: string;
    baseCurrency: string;
    timezone: string;
    description: string;
  };
  appearance: {
    theme: ThemeMode;
    sidebarDensity: DensityMode;
    accentColor: AccentColor;
  };
  notifications: {
    dailySalesReminder: boolean;
    weeklyPerformanceAlert: boolean;
    lowInventoryNotice: boolean;
    customerActivityDigest: boolean;
  };
  dataExport: {
    defaultFormat: ExportFormat;
    backupFrequency: BackupFrequency;
    includeCharts: boolean;
    includeCustomerData: boolean;
  };
  security: {
    require2fa: boolean;
    emailSignInAlerts: boolean;
    loginAlertOnNewDevice: boolean;
    sessionTimeout: SessionTimeout;
  };
  lastUpdatedAt: string | null;
};

const DEFAULT_SETTINGS: SettingsState = {
  profile: {
    storeName: "Rivera Luxury Goods",
    ownerEmail: "alex@rivera.com",
    baseCurrency: "USD ($)",
    timezone: "Pacific Time (PT)",
    description: "Tell us about your sales mission...",
  },
  appearance: {
    theme: "light",
    sidebarDensity: "comfortable",
    accentColor: "fuchsia",
  },
  notifications: {
    dailySalesReminder: true,
    weeklyPerformanceAlert: true,
    lowInventoryNotice: false,
    customerActivityDigest: true,
  },
  dataExport: {
    defaultFormat: "csv",
    backupFrequency: "weekly",
    includeCharts: true,
    includeCustomerData: true,
  },
  security: {
    require2fa: true,
    emailSignInAlerts: true,
    loginAlertOnNewDevice: true,
    sessionTimeout: "30m",
  },
  lastUpdatedAt: null,
};

function loadSavedSettings(): SettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as SettingsState;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      profile: { ...DEFAULT_SETTINGS.profile, ...parsed.profile },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...parsed.notifications,
      },
      dataExport: { ...DEFAULT_SETTINGS.dataExport, ...parsed.dataExport },
      security: { ...DEFAULT_SETTINGS.security, ...parsed.security },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [settings, setSettings] = useState<SettingsState>(loadSavedSettings);
  const [lastSavedSettings, setLastSavedSettings] =
    useState<SettingsState>(settings);

  const saveActionLabel = useMemo(() => {
    return {
      profile: "Save Changes",
      appearance: "Save Preferences",
      notifications: "Save Notification Settings",
      export: "Save Export Settings",
      security: "Save Security Settings",
    }[activeSection];
  }, [activeSection]);

  const sectionTitle = useMemo(() => {
    return {
      profile: "Store Profile",
      appearance: "Appearance",
      notifications: "Notifications",
      export: "Data Export",
      security: "Security",
    }[activeSection];
  }, [activeSection]);

  const sectionDescription = useMemo(() => {
    return {
      profile: "Update your store information and identity.",
      appearance: "Customize the look and feel of your workspace.",
      notifications: "Control reminders, alerts, and store activity updates.",
      export: "Set backup behavior and your preferred export formats.",
      security: "Protect store access and review security checkpoints.",
    }[activeSection];
  }, [activeSection]);

  const currentSectionIsDirty =
    JSON.stringify(getSectionState(settings, activeSection)) !==
    JSON.stringify(getSectionState(lastSavedSettings, activeSection));

  function persistAndMarkSaved(next: SettingsState, section: SettingsSection) {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      setLastSavedSettings(next);
      toast.success(`${sectionTitle} updated.`);
    } catch {
      toast.error("Unable to save settings. Please try again.");
      return;
    }

    if (section === "security") {
      toast.message("Security updates will apply on your next login.");
    }
  }

  function saveCurrentSection() {
    const next = {
      ...settings,
      lastUpdatedAt: new Date().toISOString(),
    };
    setSettings(next);
    persistAndMarkSaved(next, activeSection);
  }

  const initials = getInitials(settings.profile.storeName);

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div>
            <p className="px-4 text-xs font-bold uppercase tracking-wider text-gray-600">
              Account
            </p>
            <div className="mt-3 space-y-1">
              <SettingsNavItem
                icon={Store}
                label="Profile & Store"
                active={activeSection === "profile"}
                onClick={() => setActiveSection("profile")}
              />
              <SettingsNavItem
                icon={Palette}
                label="Appearance"
                active={activeSection === "appearance"}
                onClick={() => setActiveSection("appearance")}
              />
              <SettingsNavItem
                icon={Bell}
                label="Notifications"
                active={activeSection === "notifications"}
                onClick={() => setActiveSection("notifications")}
              />
            </div>
          </div>

          <div>
            <p className="px-4 text-xs font-bold uppercase tracking-wider text-gray-600">
              Operations
            </p>
            <div className="mt-3 space-y-1">
              <SettingsNavItem
                icon={Download}
                label="Data Export"
                active={activeSection === "export"}
                onClick={() => setActiveSection("export")}
              />
              <SettingsNavItem
                icon={Shield}
                label="Security"
                active={activeSection === "security"}
                onClick={() => setActiveSection("security")}
              />
            </div>
          </div>
        </aside>

        <Card className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-fuchsia-600/5 to-fuchsia-600/0 px-6 py-6">
            <h1 className="text-2xl font-bold leading-8 text-zinc-900">
              {sectionTitle}
            </h1>
            <p className="mt-2 text-sm font-normal leading-5 text-gray-600">
              {sectionDescription}
            </p>
          </div>

          <CardContent className="p-6">
            {activeSection === "profile" ? (
              <ProfileSettingsSection
                profile={settings.profile}
                initials={initials}
                onChange={(patch) =>
                  setSettings((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, ...patch },
                  }))
                }
              />
            ) : null}

            {activeSection === "appearance" ? (
              <AppearanceSettingsSection
                appearance={settings.appearance}
                onChange={(patch) =>
                  setSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, ...patch },
                  }))
                }
              />
            ) : null}

            {activeSection === "notifications" ? (
              <NotificationSettingsSection
                notifications={settings.notifications}
                onToggle={(key) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      [key]: !prev.notifications[key],
                    },
                  }))
                }
              />
            ) : null}

            {activeSection === "export" ? (
              <ExportSettingsSection
                dataExport={settings.dataExport}
                onChange={(patch) =>
                  setSettings((prev) => ({
                    ...prev,
                    dataExport: { ...prev.dataExport, ...patch },
                  }))
                }
                onToggle={(key) =>
                  setSettings((prev) => ({
                    ...prev,
                    dataExport: {
                      ...prev.dataExport,
                      [key]: !prev.dataExport[key],
                    },
                  }))
                }
              />
            ) : null}

            {activeSection === "security" ? (
              <SecuritySettingsSection
                security={settings.security}
                onChange={(patch) =>
                  setSettings((prev) => ({
                    ...prev,
                    security: { ...prev.security, ...patch },
                  }))
                }
                onToggle={(key) =>
                  setSettings((prev) => ({
                    ...prev,
                    security: {
                      ...prev.security,
                      [key]: !prev.security[key],
                    },
                  }))
                }
              />
            ) : null}
          </CardContent>

          <div className="flex flex-col gap-4 border-t border-zinc-200 bg-gray-100/30 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-normal leading-5 text-gray-600">
              Last updated {formatLastUpdated(settings.lastUpdatedAt)}
            </p>
            <Button
              className="h-10 rounded-2xl bg-fuchsia-600 px-6 text-sm font-medium text-white hover:bg-fuchsia-700 disabled:opacity-60"
              onClick={saveCurrentSection}
              disabled={!currentSectionIsDirty}
            >
              <Lock className="size-4" />
              {saveActionLabel}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function ProfileSettingsSection({
  profile,
  initials,
  onChange,
}: {
  profile: SettingsState["profile"];
  initials: string;
  onChange: (patch: Partial<SettingsState["profile"]>) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-gray-100/30 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-20 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 shadow-sm">
              {initials}
            </div>
            <div>
              <p className="text-base font-medium leading-6 text-zinc-900">
                Profile Picture
              </p>
              <p className="text-sm font-normal leading-5 text-gray-600">
                JPG, GIF or PNG. Max size of 800K.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="h-10 rounded-2xl border-zinc-200 bg-white px-4 text-sm"
              onClick={() => toast.message("Upload is UI-ready. Connect API to store file.")}
            >
              <Upload className="size-4" />
              Upload
            </Button>
            <Button
              variant="ghost"
              className="h-10 rounded-2xl px-4 text-sm text-red-600 hover:text-red-700"
              onClick={() => toast.message("Profile image removed from this draft.")}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InputField
          label="Store Name"
          value={profile.storeName}
          onChange={(value) => onChange({ storeName: value })}
        />
        <InputField
          label="Owner Email"
          value={profile.ownerEmail}
          onChange={(value) => onChange({ ownerEmail: value })}
          icon={Mail}
        />
        <InputField
          label="Base Currency"
          value={profile.baseCurrency}
          onChange={(value) => onChange({ baseCurrency: value })}
        />
        <SelectField
          label="Timezone"
          value={profile.timezone}
          options={[
            ["Pacific Time (PT)", "Pacific Time (PT)"],
            ["Mountain Time (MT)", "Mountain Time (MT)"],
            ["Central Time (CT)", "Central Time (CT)"],
            ["Eastern Time (ET)", "Eastern Time (ET)"],
          ]}
          onChange={(value) => onChange({ timezone: value })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium leading-5 text-zinc-900">
          Store Description
        </p>
        <Textarea
          value={profile.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="min-h-24 rounded-2xl border-zinc-200 bg-gray-100/20 px-3 py-2 text-sm text-gray-600"
        />
      </div>
    </div>
  );
}

function AppearanceSettingsSection({
  appearance,
  onChange,
}: {
  appearance: SettingsState["appearance"];
  onChange: (patch: Partial<SettingsState["appearance"]>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <AppearanceCard
          icon={Sun}
          title="Light"
          description="Bright surfaces for daytime work."
          active={appearance.theme === "light"}
          onClick={() => onChange({ theme: "light" })}
        />
        <AppearanceCard
          icon={Moon}
          title="Dark"
          description="A lower-glare option for long sessions."
          active={appearance.theme === "dark"}
          onClick={() => onChange({ theme: "dark" })}
        />
        <AppearanceCard
          icon={Monitor}
          title="System"
          description="Follow your device preference automatically."
          active={appearance.theme === "system"}
          onClick={() => onChange({ theme: "system" })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SelectField
          label="Sidebar Density"
          value={appearance.sidebarDensity}
          options={[
            ["comfortable", "Comfortable"],
            ["compact", "Compact"],
            ["expanded", "Expanded"],
          ]}
          onChange={(value) => onChange({ sidebarDensity: value as DensityMode })}
        />
        <SelectField
          label="Accent Color"
          value={appearance.accentColor}
          options={[
            ["fuchsia", "Fuchsia"],
            ["violet", "Violet"],
            ["sky", "Sky"],
          ]}
          onChange={(value) => onChange({ accentColor: value as AccentColor })}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-gray-100/20 p-4">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 size-4 text-fuchsia-600" />
          <div>
            <p className="text-sm font-medium text-zinc-900">Preview behavior</p>
            <p className="mt-1 text-sm text-gray-600">
              Layout changes apply consistently across laptop and mobile-sized
              screens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettingsSection({
  notifications,
  onToggle,
}: {
  notifications: SettingsState["notifications"];
  onToggle: (key: keyof SettingsState["notifications"]) => void;
}) {
  return (
    <div className="space-y-4">
      <SettingsToggleRow
        title="Daily sales reminder"
        description="Send a reminder if no sale has been recorded by your usual time."
        enabled={notifications.dailySalesReminder}
        onToggle={() => onToggle("dailySalesReminder")}
      />
      <SettingsToggleRow
        title="Weekly performance alert"
        description="Notify you when revenue drops compared with the previous week."
        enabled={notifications.weeklyPerformanceAlert}
        onToggle={() => onToggle("weeklyPerformanceAlert")}
      />
      <SettingsToggleRow
        title="Low inventory notices"
        description="Highlight products that are likely to run out soon."
        enabled={notifications.lowInventoryNotice}
        onToggle={() => onToggle("lowInventoryNotice")}
      />
      <SettingsToggleRow
        title="Customer activity digest"
        description="Receive a summary of new, returning, and VIP customer activity."
        enabled={notifications.customerActivityDigest}
        onToggle={() => onToggle("customerActivityDigest")}
      />
    </div>
  );
}

function ExportSettingsSection({
  dataExport,
  onChange,
  onToggle,
}: {
  dataExport: SettingsState["dataExport"];
  onChange: (patch: Partial<SettingsState["dataExport"]>) => void;
  onToggle: (
    key: "includeCharts" | "includeCustomerData",
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <SelectField
          label="Default Export Format"
          value={dataExport.defaultFormat}
          options={[
            ["csv", "CSV"],
            ["excel", "Excel"],
            ["pdf", "PDF"],
          ]}
          onChange={(value) => onChange({ defaultFormat: value as ExportFormat })}
        />
        <SelectField
          label="Backup Frequency"
          value={dataExport.backupFrequency}
          options={[
            ["daily", "Daily"],
            ["weekly", "Weekly"],
            ["monthly", "Monthly"],
          ]}
          onChange={(value) =>
            onChange({ backupFrequency: value as BackupFrequency })
          }
        />
      </div>

      <div className="space-y-4">
        <SettingsToggleRow
          title="Include charts"
          description="Include dashboard and trend charts in exported reports."
          enabled={dataExport.includeCharts}
          onToggle={() => onToggle("includeCharts")}
        />
        <SettingsToggleRow
          title="Include customer details"
          description="Attach customer profile fields for full CRM snapshots."
          enabled={dataExport.includeCustomerData}
          onToggle={() => onToggle("includeCustomerData")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard
          icon={FileText}
          title="Scheduled exports"
          description="Receive a clean store export on your selected backup cadence."
        />
        <InfoCard
          icon={Clock3}
          title="Retention window"
          description="Keep generated snapshots available for up to 90 days."
        />
      </div>
    </div>
  );
}

function SecuritySettingsSection({
  security,
  onChange,
  onToggle,
}: {
  security: SettingsState["security"];
  onChange: (patch: Partial<SettingsState["security"]>) => void;
  onToggle: (
    key:
      | "require2fa"
      | "emailSignInAlerts"
      | "loginAlertOnNewDevice",
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard
          icon={Shield}
          title="Two-step verification"
          description="Add another verification step for store admin access."
        />
        <InfoCard
          icon={TriangleAlert}
          title="Login alerts"
          description="Get notified when your store is accessed from a new device."
        />
      </div>

      <SelectField
        label="Session Timeout"
        value={security.sessionTimeout}
        options={[
          ["15m", "15 minutes"],
          ["30m", "30 minutes"],
          ["1h", "1 hour"],
        ]}
        onChange={(value) => onChange({ sessionTimeout: value as SessionTimeout })}
      />

      <div className="space-y-4">
        <SettingsToggleRow
          title="Require 2FA for admins"
          description="Make multi-factor verification mandatory for privileged users."
          enabled={security.require2fa}
          onToggle={() => onToggle("require2fa")}
        />
        <SettingsToggleRow
          title="Email sign-in alerts"
          description="Send a warning when a new browser or location signs in."
          enabled={security.emailSignInAlerts}
          onToggle={() => onToggle("emailSignInAlerts")}
        />
        <SettingsToggleRow
          title="Alert on new device login"
          description="Trigger alerts for first-time sign-ins on new devices."
          enabled={security.loginAlertOnNewDevice}
          onToggle={() => onToggle("loginAlertOnNewDevice")}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-gray-100/20 p-4">
        <p className="text-sm font-medium text-zinc-900">Password reset</p>
        <p className="mt-1 text-sm text-gray-600">
          Last password update was 28 days ago. Rotate it regularly for better
          account security.
        </p>
        <Button
          variant="outline"
          className="mt-4 h-10 rounded-2xl border-zinc-200 bg-white px-4 text-sm"
          onClick={() => toast.message("Password reset flow can be connected next.")}
        >
          Reset Password
        </Button>
      </div>
    </div>
  );
}

function SettingsNavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: typeof Store;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-medium ${
        active
          ? "bg-fuchsia-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-zinc-100"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: typeof Mail;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-5 text-zinc-900">{label}</p>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-600" />
        ) : null}
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-10 rounded-2xl border-zinc-200 bg-gray-100/20 text-sm text-gray-700 ${
            Icon ? "pl-9" : "pl-3"
          }`}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-5 text-zinc-900">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full rounded-2xl border-zinc-200 bg-gray-100/20 px-3 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SettingsToggleRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-gray-100/20 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={`flex h-6 min-w-11 items-center rounded-full p-1 transition-colors ${
          enabled ? "bg-fuchsia-600" : "bg-zinc-300"
        }`}
      >
        <span
          className={`size-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function AppearanceCard({
  icon: Icon,
  title,
  description,
  active = false,
  onClick,
}: {
  icon: typeof Sun;
  title: string;
  description: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left ${
        active
          ? "border-fuchsia-200 bg-fuchsia-50/70"
          : "border-zinc-200 bg-gray-100/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div
            className={`flex size-10 items-center justify-center rounded-2xl ${
              active ? "bg-fuchsia-100 text-fuchsia-700" : "bg-white text-zinc-700"
            }`}
          >
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{title}</p>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {active ? <Check className="size-4 text-fuchsia-600" /> : null}
      </div>
    </button>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-gray-100/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-fuchsia-600">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function getSectionState(settings: SettingsState, section: SettingsSection) {
  if (section === "profile") return settings.profile;
  if (section === "appearance") return settings.appearance;
  if (section === "notifications") return settings.notifications;
  if (section === "export") return settings.dataExport;
  return settings.security;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ST";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function formatLastUpdated(lastUpdatedAt: string | null) {
  if (!lastUpdatedAt) return "not saved yet";
  const date = new Date(lastUpdatedAt);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
