import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Completion, CompletionMap, PersistedData, Routine, RoutineInput, Settings } from "@/types";
import { todayKey } from "@/lib/date";
import { recomputeProfile } from "@/lib/gamification";
import { uid } from "@/lib/id";
import { SCHEMA_VERSION, emptyData, isValidBackup, migrate } from "@/lib/migrate";
import { buildDemoData, isDemoId } from "@/lib/seed";
import { ckey, isDone, targetAmount } from "@/lib/schedule";
import { STORAGE_KEY, activeStorage } from "@/lib/storage";
import { useUI } from "./useUI";

interface Actions {
  addRoutine: (input: RoutineInput) => string;
  updateRoutine: (id: string, patch: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  archiveRoutine: (id: string, archived: boolean) => void;
  duplicateRoutine: (id: string) => void;
  reorderRoutines: (orderedIds: string[]) => void;

  toggleCheck: (id: string, date: string) => void;
  addCount: (id: string, date: string, delta: number) => void;
  setValue: (id: string, date: string, value: number) => void;
  toggleSubtask: (id: string, date: string, subtaskId: string) => void;
  skip: (id: string, date: string, note?: string) => void;
  unskip: (id: string, date: string) => void;
  setNote: (id: string, date: string, note: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: () => void;
  loadDemo: () => void;
  clearDemo: () => void;
  importData: (raw: unknown) => boolean;
  resetAll: () => void;
  markBackup: () => void;
  snoozeBackup: (days: number) => void;
}

export type StoreState = PersistedData & Actions;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      /** Apply a mutation to completions and refresh XP / level / badges. */
      const commit = (mutate: (comps: CompletionMap) => void, announce = true) => {
        const comps = { ...get().completions };
        mutate(comps);
        const { routines, profile } = get();
        const res = recomputeProfile(routines, comps, profile, todayKey(), profile.settings.weekStart);
        set({ completions: comps, profile: res.profile });
        if (announce && res.newBadges.length) useUI.getState().queueBadges(res.newBadges);
      };

      const refresh = (routines: Routine[], comps: CompletionMap) => {
        const profile = get().profile;
        const res = recomputeProfile(routines, comps, { ...profile, badges: profile.badges }, todayKey(), profile.settings.weekStart);
        set({ routines, completions: comps, profile: res.profile });
      };

      const upsert = (comps: CompletionMap, routineId: string, date: string, patch: Partial<Completion>) => {
        const id = ckey(routineId, date);
        const prev = comps[id] ?? { id, routineId, date, value: 0, skipped: false };
        comps[id] = { ...prev, ...patch };
      };

      const withDone = (comps: CompletionMap, r: Routine, id: string) => {
        const c = comps[id];
        if (!c) return;
        const done = isDone(r, c);
        comps[id] = { ...c, completedAt: done ? (c.completedAt ?? new Date().toISOString()) : undefined };
      };

      return {
        ...emptyData(),

        addRoutine: (input) => {
          const id = uid();
          const routine: Routine = {
            ...input,
            id,
            archived: false,
            order: get().routines.length,
            createdAt: new Date().toISOString(),
          };
          set({ routines: [...get().routines, routine] });
          return id;
        },
        updateRoutine: (id, patch) => refresh(get().routines.map((r) => (r.id === id ? { ...r, ...patch } : r)), get().completions),
        deleteRoutine: (id) => {
          const comps = Object.fromEntries(Object.entries(get().completions).filter(([, c]) => c.routineId !== id));
          refresh(get().routines.filter((r) => r.id !== id), comps);
        },
        archiveRoutine: (id, archived) => refresh(get().routines.map((r) => (r.id === id ? { ...r, archived } : r)), get().completions),
        duplicateRoutine: (id) => {
          const r = get().routines.find((x) => x.id === id);
          if (!r) return;
          const copy: Routine = {
            ...r,
            id: uid(),
            title: `${r.title} (copy)`,
            order: get().routines.length,
            createdAt: new Date().toISOString(),
            subtasks: r.subtasks.map((s) => ({ ...s })),
          };
          set({ routines: [...get().routines, copy] });
        },
        reorderRoutines: (ids) => {
          const pos = new Map(ids.map((id, i) => [id, i]));
          set({
            routines: get()
              .routines.map((r) => (pos.has(r.id) ? { ...r, order: pos.get(r.id)! } : r))
              .sort((a, b) => a.order - b.order),
          });
        },

        toggleCheck: (id, date) => {
          const r = get().routines.find((x) => x.id === id);
          if (!r) return;
          commit((comps) => {
            const key = ckey(id, date);
            const done = isDone(r, comps[key]);
            const all = done ? [] : r.subtasks.map((s) => s.id);
            upsert(comps, id, date, { value: done ? 0 : targetAmount(r), skipped: false, subtasksDone: all });
            withDone(comps, r, key);
          });
        },
        addCount: (id, date, delta) => {
          const r = get().routines.find((x) => x.id === id);
          if (!r) return;
          commit((comps) => {
            const key = ckey(id, date);
            const cur = comps[key]?.value ?? 0;
            upsert(comps, id, date, { value: Math.max(0, Math.min(targetAmount(r) * 3, cur + delta)), skipped: false });
            withDone(comps, r, key);
          });
        },
        setValue: (id, date, value) => {
          const r = get().routines.find((x) => x.id === id);
          if (!r) return;
          commit((comps) => {
            const key = ckey(id, date);
            upsert(comps, id, date, { value: Math.max(0, value), skipped: false });
            withDone(comps, r, key);
          });
        },
        toggleSubtask: (id, date, subtaskId) => {
          const r = get().routines.find((x) => x.id === id);
          if (!r) return;
          commit((comps) => {
            const key = ckey(id, date);
            const prev = comps[key]?.subtasksDone ?? [];
            const next = prev.includes(subtaskId) ? prev.filter((s) => s !== subtaskId) : [...prev, subtaskId];
            const allDone = r.subtasks.length > 0 && r.subtasks.every((s) => next.includes(s.id));
            const patch: Partial<Completion> = { subtasksDone: next, skipped: false };
            if (r.target.type === "check") patch.value = allDone ? 1 : 0;
            upsert(comps, id, date, patch);
            withDone(comps, r, key);
          });
        },
        skip: (id, date, note) =>
          commit((comps) => upsert(comps, id, date, { skipped: true, value: 0, note: note?.trim() || undefined, completedAt: undefined })),
        unskip: (id, date) =>
          commit((comps) => {
            const key = ckey(id, date);
            if (comps[key]) comps[key] = { ...comps[key], skipped: false, note: undefined };
          }),
        setNote: (id, date, note) => commit((comps) => upsert(comps, id, date, { note: note.trim() || undefined })),

        updateSettings: (patch) => set({ profile: { ...get().profile, settings: { ...get().profile.settings, ...patch } } }),
        completeOnboarding: () => set({ onboarded: true }),
        loadDemo: () => {
          const demo = buildDemoData();
          const base = get().routines.filter((r) => !isDemoId(r.id));
          const comps = Object.fromEntries(Object.entries(get().completions).filter(([, c]) => !isDemoId(c.routineId)));
          const routines = [...base, ...demo.routines].map((r, i) => ({ ...r, order: i }));
          refresh(routines, { ...comps, ...demo.completions });
          set({ hasDemo: true });
        },
        clearDemo: () => {
          const comps = Object.fromEntries(Object.entries(get().completions).filter(([, c]) => !isDemoId(c.routineId)));
          refresh(get().routines.filter((r) => !isDemoId(r.id)), comps);
          set({ hasDemo: false });
        },
        importData: (raw) => {
          if (!isValidBackup(raw)) return false;
          const d = migrate(raw);
          const res = recomputeProfile(d.routines, d.completions, { ...d.profile, badges: d.profile.badges }, todayKey(), d.profile.settings.weekStart);
          set({ ...d, profile: res.profile, onboarded: true });
          return true;
        },
        resetAll: () => set({ ...emptyData(), onboarded: true }),
        markBackup: () => set({ profile: { ...get().profile, lastBackupAt: new Date().toISOString(), backupSnoozedUntil: null } }),
        snoozeBackup: (days) => set({ profile: { ...get().profile, backupSnoozedUntil: new Date(Date.now() + days * 864e5).toISOString() } }),
      };
    },
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => activeStorage),
      // Hydrate manually after mount (see Providers) so SSR and first client render match.
      skipHydration: true,
      partialize: (s) => ({
        schemaVersion: s.schemaVersion,
        routines: s.routines,
        completions: s.completions,
        profile: s.profile,
        onboarded: s.onboarded,
        hasDemo: s.hasDemo,
      }),
      migrate: (persisted, version) => migrate(persisted, version) as unknown as StoreState,
    },
  ),
);

/** Snapshot of just the data (for export). */
export const selectData = (s: StoreState): PersistedData => ({
  schemaVersion: s.schemaVersion,
  routines: s.routines,
  completions: s.completions,
  profile: s.profile,
  onboarded: s.onboarded,
  hasDemo: s.hasDemo,
});

// Typed selectors
export const selSettings = (s: StoreState) => s.profile.settings;
export const selRoutines = (s: StoreState) => s.routines;
export const selCompletions = (s: StoreState) => s.completions;
