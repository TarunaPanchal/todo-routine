"use client";
import { Download, FileSpreadsheet, FileUp, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Switch } from "@/components/ui/Switch";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { backupFilename, download, toBackupJson, toCsv } from "@/lib/export";
import { LANGUAGES, useT } from "@/lib/i18n";
import { notifSupport, requestNotifications, type NotifSupport } from "@/lib/notifications";
import { selectData, useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";
import type { PaletteId, Settings, ThemeMode } from "@/types";

const PALETTES: { id: PaletteId; label: string; color: string }[] = [
  { id: "candy", label: "Ocean", color: "#3d9be9" },
  { id: "mint", label: "Mint", color: "#2fbf9b" },
  { id: "lavender", label: "Lavender", color: "#8f7cf0" },
  { id: "sky", label: "Sky", color: "#3d9be9" },
  { id: "peach", label: "Peach", color: "#ff9150" },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mx-5 mt-5">
    <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-muted">{title}</h2>
    <div className="card divide-y divide-line">{children}</div>
  </section>
);
const Row = ({ label, children, sub }: { label: string; children: React.ReactNode; sub?: string }) => (
  <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
    <div className="min-w-0">
      <p className="font-bold">{label}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
    {children}
  </div>
);

export default function SettingsPage() {
  const t = useT();
  const settings = useStore((s) => s.profile.settings);
  const hasDemo = useStore((s) => s.hasDemo);
  const lastBackup = useStore((s) => s.profile.lastBackupAt);
  const update = useStore((s) => s.updateSettings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [support, setSupport] = useState<NotifSupport>("ok");
  const [perm, setPerm] = useState<string>("default");
  const [confirmReset, setConfirmReset] = useState(false);
  const toast = useUI.getState().showToast;

  useEffect(() => {
    setSupport(notifSupport());
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, []);

  const seg = <K extends keyof Settings>(key: K, options: { v: Settings[K]; label: string }[]) => (
    <div className="flex gap-1" role="radiogroup">
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={settings[key] === o.v} className="chip !px-3 text-sm" onClick={() => update({ [key]: o.v } as Partial<Settings>)}>
          {o.label}
        </button>
      ))}
    </div>
  );

  const toggleNotifications = async (on: boolean) => {
    if (!on) return update({ notifications: false });
    const ok = await requestNotifications();
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
    update({ notifications: ok });
    if (!ok) toast("Notifications aren't available or were blocked");
  };

  const exportJson = () => {
    download(backupFilename("json"), toBackupJson(selectData(useStore.getState())));
    useStore.getState().markBackup();
    toast("Backup saved 💾");
  };

  const onImport = async (file: File) => {
    try {
      const ok = useStore.getState().importData(JSON.parse(await file.text()));
      toast(ok ? "Backup restored ✅" : "That file doesn't look like a RoutineBuddy backup");
    } catch {
      toast("Couldn't read that file");
    }
  };

  return (
    <div className="pb-6">
      <PageHeader title={t("settings.title")} />

      <Section title="Profile">
        <Row label="Your name">
          <input className="field !w-40 text-right" value={settings.userName} onChange={(e) => update({ userName: e.target.value })} placeholder="Optional" maxLength={20} aria-label="Your name" />
        </Row>
      </Section>

      <Section title={t("settings.appearance")}>
        <div className="px-4 py-3">
          <p className="mb-2 font-bold">{t("settings.theme")}</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
            {(["light", "dark", "auto"] as ThemeMode[]).map((m) => (
              <button key={m} role="radio" aria-checked={settings.theme === m} className="chip capitalize" onClick={() => update({ theme: m })}>
                {m === "light" ? "☀️" : m === "dark" ? "🌙" : "🌓"} {m}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="mb-2 font-bold">{t("settings.palette")}</p>
          <div className="flex justify-between" role="radiogroup" aria-label="Palette">
            {PALETTES.map((p) => (
              <button key={p.id} role="radio" aria-checked={settings.palette === p.id} aria-label={p.label} onClick={() => update({ palette: p.id })} className="flex min-h-11 flex-col items-center gap-1 text-xs font-bold">
                <span className="h-9 w-9 rounded-full border-4 transition-transform active:scale-90" style={{ background: p.color, borderColor: settings.palette === p.id ? "var(--ink)" : "transparent" }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t("settings.preferences")}>
        <Row label={t("settings.weekStart")}>{seg("weekStart", [{ v: 1, label: "Mon" }, { v: 0, label: "Sun" }, { v: 6, label: "Sat" }])}</Row>
        <Row label={t("settings.timeFormat")}>{seg("timeFormat", [{ v: "12", label: "12h" }, { v: "24", label: "24h" }])}</Row>
        <Row label={t("settings.language")}>
          <select className="field !w-32" value={settings.language} onChange={(e) => update({ language: e.target.value })} aria-label="Language">
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Haptics" sub="Vibrate on taps (where supported)">
          <Switch label="Haptics" checked={settings.haptics} onChange={(v) => update({ haptics: v })} />
        </Row>
        <Row label={t("settings.notifications")} sub="Notify at each routine's reminder time">
          <Switch label="Reminders" checked={settings.notifications && perm === "granted"} onChange={toggleNotifications} />
        </Row>
        {(support !== "ok" || perm === "denied" || settings.notifications) && (
          <p className="px-4 py-3 text-xs font-semibold text-muted" role="note">
            {support === "needs-install"
              ? "On iPhone/iPad, notifications only work after you add RoutineBuddy to your Home Screen (Share → Add to Home Screen) and open it from there."
              : support === "unsupported"
                ? "This browser doesn't support notifications, so reminders are off."
                : perm === "denied"
                  ? "Notifications are blocked. Enable them in your browser's site settings."
                  : "Reminders fire while the app is open or recently used. There's no server, so they can't wake a closed app."}
          </p>
        )}
      </Section>

      <Section title={t("settings.data")}>
        <Row label="Export backup" sub={lastBackup ? `Last: ${new Date(lastBackup).toLocaleDateString()}` : "Never backed up"}>
          <button className="chip" onClick={exportJson}>
            <Download size={16} /> JSON
          </button>
        </Row>
        <Row label="Import backup" sub="Replaces current data">
          <button className="chip" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
        </Row>
        <Row label="Export CSV" sub="Every completion, for spreadsheets">
          <button className="chip" onClick={() => download(backupFilename("csv"), toCsv(selectData(useStore.getState())), "text/csv")}>
            <FileSpreadsheet size={16} /> CSV
          </button>
        </Row>
        <Row label="Demo data" sub={hasDemo ? "Sample routines are loaded" : "Try the app with 75 days of sample history"}>
          <button
            className="chip"
            onClick={() => {
              if (hasDemo) useStore.getState().clearDemo();
              else useStore.getState().loadDemo();
              toast(hasDemo ? "Demo data removed" : "Demo data loaded ✨");
            }}
          >
            <Sparkles size={16} /> {hasDemo ? "Remove" : "Load"}
          </button>
        </Row>
        <Row label="Reset all data" sub="Deletes everything on this device">
          <button className="chip !text-red-500" onClick={() => setConfirmReset(true)}>
            <Trash2 size={16} /> Reset
          </button>
        </Row>
      </Section>

      <p className="mt-6 flex items-center justify-center gap-1 text-center text-xs font-semibold text-muted">
        <FileUp size={12} /> RoutineBuddy v1.0 · all data stays on your device
      </p>

      <BottomSheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset everything?"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                useStore.getState().resetAll();
                setConfirmReset(false);
                toast("All data reset");
              }}
            >
              Yes, delete all
            </button>
          </div>
        }
      >
        <p className="text-sm text-muted">This permanently deletes all routines, history, XP and badges from this device. Export a backup first if you might want them back.</p>
      </BottomSheet>
    </div>
  );
}
