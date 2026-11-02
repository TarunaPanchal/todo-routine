import type { PersistedData, Profile, Settings } from "@/types";

export const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  theme: "auto",
  palette: "candy",
  weekStart: 1,
  timeFormat: "12",
  language: "en",
  notifications: false,
  haptics: true,
  userName: "",
};

export const defaultProfile = (): Profile => ({
  xp: 0,
  level: 1,
  badges: [],
  settings: { ...DEFAULT_SETTINGS },
  startedAt: new Date().toISOString(),
  lastBackupAt: null,
  backupSnoozedUntil: null,
});

export const emptyData = (): PersistedData => ({
  schemaVersion: SCHEMA_VERSION,
  routines: [],
  completions: {},
  profile: defaultProfile(),
  onboarded: false,
  hasDemo: false,
});

/**
 * Upgrade older persisted data to the current schema. Add a `if (v < N)` step per schema bump.
 * Unknown/garbage input falls back to defaults so the app never crashes on bad storage.
 */
export function migrate(input: unknown, fromVersion = 0): PersistedData {
  const base = emptyData();
  if (!input || typeof input !== "object") return base;
  const d = input as Partial<PersistedData>;
  let v = typeof d.schemaVersion === "number" ? d.schemaVersion : fromVersion;
  const data: PersistedData = {
    ...base,
    ...d,
    routines: Array.isArray(d.routines) ? d.routines : [],
    completions: d.completions && typeof d.completions === "object" ? d.completions : {},
    profile: {
      ...base.profile,
      ...(d.profile ?? {}),
      settings: { ...DEFAULT_SETTINGS, ...(d.profile?.settings ?? {}) },
    },
  };
  // v0 -> v1: routines gained `subtasks` + `archived`.
  if (v < 1) {
    data.routines = data.routines.map((r, i) => ({ ...r, subtasks: r.subtasks ?? [], archived: r.archived ?? false, order: r.order ?? i }));
    v = 1;
  }
  data.schemaVersion = SCHEMA_VERSION;
  return data;
}

export function isValidBackup(x: unknown): boolean {
  if (!x || typeof x !== "object") return false;
  const d = x as Record<string, unknown>;
  return Array.isArray(d.routines) && typeof d.completions === "object" && d.completions !== null && typeof d.profile === "object";
}
