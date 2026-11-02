import type { Completion, CompletionMap, DateKey, DayEntry, Routine } from "@/types";
import { addDaysKey, dayOfMonth, daysInMonthOf, diffDays, eachDayKeys, fromKey, weekKeys, weekStartKey, weekdayOf } from "./date";

type WS = 0 | 1 | 6;

export const ckey = (routineId: string, date: DateKey) => `${routineId}|${date}`;

/** Comparable amount for a routine: check=1, count=N, duration=seconds. */
export const targetAmount = (r: Routine): number =>
  r.target.type === "check" ? 1 : r.target.type === "duration" ? r.target.value * 60 : r.target.value;

export const isDone = (r: Routine, c?: Completion): boolean =>
  !!c && !c.skipped && c.value >= targetAmount(r) && targetAmount(r) > 0;

export const progressOf = (r: Routine, c?: Completion): number => {
  if (!c || c.skipped) return 0;
  return Math.min(1, c.value / targetAmount(r));
};

export const isActiveOn = (r: Routine, key: DateKey): boolean =>
  key >= r.startDate && (!r.endDate || key <= r.endDate);

/** Pure "is this routine on the calendar that day" check. timesPerWeek is treated as flexible (true while active). */
export const isScheduledOn = (r: Routine, key: DateKey): boolean => {
  if (!isActiveOn(r, key)) return false;
  const f = r.frequency;
  switch (f.type) {
    case "daily":
    case "timesPerWeek":
      return true;
    case "weekdays":
      return f.days.includes(weekdayOf(key));
    case "monthDays": {
      const last = daysInMonthOf(key);
      const dom = dayOfMonth(key);
      return f.days.some((d) => Math.min(d, last) === dom);
    }
    case "monthly": {
      const last = daysInMonthOf(key);
      return Math.min(dayOfMonth(r.startDate), last) === dayOfMonth(key);
    }
    case "interval": {
      const n = Math.max(1, f.interval);
      return diffDays(key, r.startDate) % n === 0;
    }
  }
};

/** Number of done (or skipped, if countSkips) completions for a routine in the week containing `key`. */
export const weekCount = (r: Routine, comps: CompletionMap, key: DateKey, ws: WS, countSkips = false): number =>
  weekKeys(key, ws).reduce((n, d) => {
    const c = comps[ckey(r.id, d)];
    return n + (isDone(r, c) || (countSkips && c?.skipped) ? 1 : 0);
  }, 0);

/**
 * Entries shown for a day. Flexible (timesPerWeek) routines appear when completed/skipped that day,
 * or as pending while the weekly quota is unmet (only today, or any past day if includeOptional).
 */
export function entriesForDay(
  routines: Routine[],
  comps: CompletionMap,
  key: DateKey,
  today: DateKey,
  ws: WS,
  includeOptional = false,
): DayEntry[] {
  const out: DayEntry[] = [];
  for (const r of routines) {
    const c = comps[ckey(r.id, key)];
    if (r.archived && !c) continue;
    if (!isActiveOn(r, key)) continue;
    const statusOf = (): DayEntry["status"] => (c?.skipped ? "skipped" : isDone(r, c) ? "done" : "pending");
    if (r.frequency.type === "timesPerWeek") {
      const touched = c && (c.skipped || c.value > 0);
      if (touched) {
        out.push({ routine: r, completion: c, status: statusOf() });
      } else if (!r.archived && key <= today && (key === today || includeOptional) && weekCount(r, comps, key, ws) < r.frequency.timesPerWeek) {
        out.push({ routine: r, completion: c, status: "pending" });
      }
      continue;
    }
    if (!isScheduledOn(r, key)) continue;
    out.push({ routine: r, completion: c, status: statusOf() });
  }
  return out;
}

export interface DayProgress {
  done: number;
  total: number;
  skipped: number;
  /** 0..1, null when nothing counted */
  pct: number | null;
}

export const dayProgress = (entries: DayEntry[]): DayProgress => {
  const done = entries.filter((e) => e.status === "done").length;
  const skipped = entries.filter((e) => e.status === "skipped").length;
  const total = entries.length - skipped;
  return { done, total, skipped, pct: total > 0 ? done / total : null };
};

export interface Streak {
  current: number;
  best: number;
  unit: "day" | "week";
}

/**
 * Streak for one routine. Skipped days never break it. Today still pending never breaks it.
 * timesPerWeek routines count consecutive weeks (skips count toward the quota).
 */
export function computeStreak(r: Routine, comps: CompletionMap, today: DateKey, ws: WS = 1): Streak {
  const last = r.endDate && r.endDate < today ? r.endDate : today;
  // cap history walked so very old routines stay fast
  const floor = addDaysKey(today, -1100);
  const start = r.startDate > floor ? r.startDate : floor;
  if (start > last) return { current: 0, best: 0, unit: r.frequency.type === "timesPerWeek" ? "week" : "day" };

  let cur = 0;
  let best = 0;

  if (r.frequency.type === "timesPerWeek") {
    const thisWeek = weekStartKey(today, ws);
    let w = weekStartKey(start, ws);
    while (w <= last) {
      const days = weekKeys(w, ws).filter((d) => d >= r.startDate && d <= last);
      const required = Math.min(r.frequency.timesPerWeek, days.length);
      const got = weekCount(r, comps, w, ws, true);
      if (got >= required) {
        cur++;
        best = Math.max(best, cur);
      } else if (w !== thisWeek) {
        cur = 0;
      }
      w = addDaysKey(w, 7);
    }
    return { current: cur, best, unit: "week" };
  }

  for (const key of eachDayKeys(start, last)) {
    if (!isScheduledOn(r, key)) continue;
    const c = comps[ckey(r.id, key)];
    if (c?.skipped) continue;
    if (isDone(r, c)) {
      cur++;
      best = Math.max(best, cur);
    } else if (key !== today) {
      cur = 0;
    }
  }
  return { current: cur, best, unit: "day" };
}

/** Consecutive "perfect days" (every counted routine done). Days without routines are ignored; today pending doesn't break. */
export function perfectDayStreak(routines: Routine[], comps: CompletionMap, today: DateKey, ws: WS = 1): { current: number; best: number } {
  const starts = routines.map((r) => r.startDate).sort();
  if (!starts.length) return { current: 0, best: 0 };
  const floor = addDaysKey(today, -1100);
  const from = starts[0] > floor ? starts[0] : floor;
  let cur = 0;
  let best = 0;
  for (const key of eachDayKeys(from, today)) {
    const p = dayProgress(entriesForDay(routines, comps, key, today, ws));
    if (p.pct === null) continue;
    if (p.pct === 1) {
      cur++;
      best = Math.max(best, cur);
    } else if (key !== today) {
      cur = 0;
    }
  }
  return { current: cur, best };
}

export const parseKeyYear = (k: DateKey) => fromKey(k).getFullYear();
