import type { PersistedData } from "@/types";
import { fmt, toKey } from "./date";
import { isDone, targetAmount } from "./schedule";

export function download(filename: string, content: string | Blob, type = "application/json") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const backupFilename = (ext: string) => `routinebuddy-${toKey(new Date())}.${ext}`;

export function toBackupJson(d: PersistedData): string {
  return JSON.stringify({ ...d, exportedAt: new Date().toISOString(), app: "RoutineBuddy" }, null, 2);
}

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function toCsv(d: PersistedData): string {
  const byId = new Map(d.routines.map((r) => [r.id, r]));
  const rows = [["date", "routine", "category", "target", "value", "status", "note"].join(",")];
  const comps = Object.values(d.completions).sort((a, b) => a.date.localeCompare(b.date));
  for (const c of comps) {
    const r = byId.get(c.routineId);
    if (!r) continue;
    const status = c.skipped ? "skipped" : isDone(r, c) ? "done" : "partial";
    rows.push([c.date, esc(r.title), esc(r.category), targetAmount(r), c.value, status, esc(c.note)].join(","));
  }
  return rows.join("\n");
}

export { fmt };
