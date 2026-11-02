import { endOfMonth, endOfYear, startOfMonth, startOfYear } from "date-fns";
import type { CompletionMap, DateKey, Period, Routine } from "@/types";
import { eachDayKeys, fromKey, toKey, weekKeys, weekdayOf } from "./date";
import { dayProgress, entriesForDay, isDone, isScheduledOn, ckey } from "./schedule";

type WS = 0 | 1 | 6;

export const rangeKeys = (period: Period, anchor: DateKey, ws: WS): DateKey[] => {
  const d = fromKey(anchor);
  if (period === "week") return weekKeys(anchor, ws);
  if (period === "month") return eachDayKeys(toKey(startOfMonth(d)), toKey(endOfMonth(d)));
  return eachDayKeys(toKey(startOfYear(d)), toKey(endOfYear(d)));
};

export interface DayStat {
  date: DateKey;
  done: number;
  total: number;
  pct: number | null;
  future: boolean;
}

export const dailySeries = (routines: Routine[], comps: CompletionMap, keys: DateKey[], today: DateKey, ws: WS): DayStat[] =>
  keys.map((date) => {
    if (date > today) return { date, done: 0, total: 0, pct: null, future: true };
    const p = dayProgress(entriesForDay(routines, comps, date, today, ws));
    return { date, done: p.done, total: p.total, pct: p.pct, future: false };
  });

export interface RoutineStat {
  routine: Routine;
  done: number;
  total: number;
  rate: number;
}

export const routineBreakdown = (routines: Routine[], comps: CompletionMap, keys: DateKey[], today: DateKey): RoutineStat[] =>
  routines
    .map((routine) => {
      let done = 0;
      let total = 0;
      for (const k of keys) {
        if (k > today) continue;
        const c = comps[ckey(routine.id, k)];
        if (c?.skipped) continue;
        const d = isDone(routine, c);
        if (d) {
          done++;
          total++;
        } else if (routine.frequency.type !== "timesPerWeek" && isScheduledOn(routine, k) && (!routine.archived)) {
          total++;
        }
      }
      return { routine, done, total, rate: total ? done / total : 0 };
    })
    .filter((s) => s.total > 0);

export interface Summary {
  rate: number;
  totalDone: number;
  totalPlanned: number;
  perfectDays: number;
  bestWeekday: number | null;
  worstWeekday: number | null;
  weekdayRates: (number | null)[];
}

export const summarize = (series: DayStat[]): Summary => {
  const past = series.filter((s) => !s.future && s.total > 0);
  const totalDone = past.reduce((n, s) => n + s.done, 0);
  const totalPlanned = past.reduce((n, s) => n + s.total, 0);
  const perWd: { sum: number; n: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
  for (const s of past) {
    const w = weekdayOf(s.date);
    perWd[w].sum += s.pct ?? 0;
    perWd[w].n++;
  }
  const weekdayRates = perWd.map((x) => (x.n ? x.sum / x.n : null));
  let best: number | null = null;
  let worst: number | null = null;
  weekdayRates.forEach((r, i) => {
    if (r === null) return;
    if (best === null || r > (weekdayRates[best] ?? -1)) best = i;
    if (worst === null || r < (weekdayRates[worst] ?? 2)) worst = i;
  });
  return {
    rate: totalPlanned ? totalDone / totalPlanned : 0,
    totalDone,
    totalPlanned,
    perfectDays: past.filter((s) => s.pct === 1).length,
    bestWeekday: best,
    worstWeekday: worst,
    weekdayRates,
  };
};

export const categoryTotals = (routines: Routine[], comps: CompletionMap, keys: DateKey[]): { name: string; value: number }[] => {
  const map = new Map<string, number>();
  const set = new Set(keys);
  const byId = new Map(routines.map((r) => [r.id, r]));
  for (const c of Object.values(comps)) {
    if (!set.has(c.date)) continue;
    const r = byId.get(c.routineId);
    if (!r || !isDone(r, c)) continue;
    map.set(r.category, (map.get(r.category) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function buildInsights(summary: Summary, breakdown: RoutineStat[], period: Period): string[] {
  const out: string[] = [];
  if (summary.totalPlanned === 0) return ["Complete a few routines and your insights will show up here ✨"];
  const pct = Math.round(summary.rate * 100);
  if (pct >= 90) out.push(`Wow, ${pct}% this ${period}! You're a routine superstar 🌟`);
  else if (pct >= 70) out.push(`Nice! ${pct}% this ${period}. Keep that rhythm going 💪`);
  else if (pct >= 40) out.push(`${pct}% so far. Every little check counts, you've got this 🌱`);
  else out.push(`A gentle ${pct}% this ${period}. Start tiny, one check at a time 🤍`);
  if (summary.bestWeekday !== null && summary.weekdayRates.filter((r) => r !== null).length > 1) {
    out.push(`You're strongest on ${WEEKDAY_NAMES[summary.bestWeekday]}s!`);
    if (summary.worstWeekday !== null && summary.worstWeekday !== summary.bestWeekday)
      out.push(`${WEEKDAY_NAMES[summary.worstWeekday]}s are trickier. Maybe plan lighter that day.`);
  }
  if (breakdown.length > 1) {
    const sorted = [...breakdown].sort((a, b) => b.rate - a.rate);
    const top = sorted[0];
    const low = sorted[sorted.length - 1];
    out.push(`${top.routine.emoji} ${top.routine.title} is your most consistent routine (${Math.round(top.rate * 100)}%).`);
    if (low.routine.id !== top.routine.id && low.rate < 0.7)
      out.push(`${low.routine.emoji} ${low.routine.title} could use some love (${Math.round(low.rate * 100)}%).`);
  }
  if (summary.perfectDays > 0) out.push(`${summary.perfectDays} perfect ${summary.perfectDays === 1 ? "day" : "days"} 🎉`);
  return out;
}
