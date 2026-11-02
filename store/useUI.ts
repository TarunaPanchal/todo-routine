import { create } from "zustand";
import type { DateKey, RoutineInput } from "@/types";

/** Ephemeral UI state (not persisted). */
interface EditorState {
  routineId?: string;
  draft?: RoutineInput;
  showTemplates?: boolean;
}

interface TimerState {
  routineId: string;
  date: DateKey;
  startedAt: number;
  baseSeconds: number;
}

interface UIState {
  editor: EditorState | null;
  daySheet: DateKey | null;
  skipTarget: { routineId: string; date: DateKey } | null;
  badgeQueue: string[];
  toast: { id: number; text: string } | null;
  timer: TimerState | null;
  installPrompt: Event | null;
  openEditor: (e?: EditorState) => void;
  closeEditor: () => void;
  openDay: (d: DateKey | null) => void;
  openSkip: (t: UIState["skipTarget"]) => void;
  queueBadges: (ids: string[]) => void;
  shiftBadge: () => void;
  showToast: (text: string) => void;
  startTimer: (t: TimerState) => void;
  stopTimer: () => void;
  setInstallPrompt: (e: Event | null) => void;
}

export const useUI = create<UIState>((set) => ({
  editor: null,
  daySheet: null,
  skipTarget: null,
  badgeQueue: [],
  toast: null,
  timer: null,
  installPrompt: null,
  openEditor: (e = { showTemplates: true }) => set({ editor: e }),
  closeEditor: () => set({ editor: null }),
  openDay: (d) => set({ daySheet: d }),
  openSkip: (t) => set({ skipTarget: t }),
  queueBadges: (ids) => set((s) => ({ badgeQueue: [...s.badgeQueue, ...ids] })),
  shiftBadge: () => set((s) => ({ badgeQueue: s.badgeQueue.slice(1) })),
  showToast: (text) => set({ toast: { id: Date.now(), text } }),
  startTimer: (timer) => set({ timer }),
  stopTimer: () => set({ timer: null }),
  setInstallPrompt: (installPrompt) => set({ installPrompt }),
}));
