import type { Completion, CompletionMap, Routine } from "@/types";
import { addDaysKey, todayKey, weekdayOf } from "./date";
import { ckey, isDone, isScheduledOn, targetAmount } from "./schedule";
import { TEMPLATES } from "./templates";

const DEMO = "demo-";

/** Deterministic pseudo-random so demo data is stable. */
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

export const isDemoId = (id: string) => id.startsWith(DEMO);

export function buildDemoData(): { routines: Routine[]; completions: CompletionMap } {
  const today = todayKey();
  const start = addDaysKey(today, -75);
  const rand = rng(42);
  const ids = ["morning", "workout", "study", "water", "sleep", "selfcare"];
  const routines: Routine[] = ids.map((tid, i) => {
    const t = TEMPLATES.find((x) => x.id === tid)!.make();
    return {
      ...t,
      id: DEMO + tid,
      startDate: start,
      archived: false,
      order: i,
      createdAt: new Date().toISOString(),
    };
  });
  const completions: CompletionMap = {};
  const reliability: Record<string, number> = { morning: 0.85, workout: 0.7, study: 0.6, water: 0.8, sleep: 0.65, selfcare: 0.75 };
  for (let n = 75; n >= 0; n--) {
    const d = addDaysKey(today, -n);
    for (const r of routines) {
      const base = r.id.slice(DEMO.length);
      const weekdayBoost = weekdayOf(d) === 1 ? 0.12 : weekdayOf(d) === 0 ? -0.15 : 0;
      // recent days are a bit better so streaks exist
      const recent = n < 9 ? 0.2 : 0;
      const p = Math.min(0.97, reliability[base] + weekdayBoost + recent);
      const planned = r.frequency.type === "timesPerWeek" ? rand() < 0.45 : isScheduledOn(r, d);
      if (!planned || (n === 0 && rand() < 0.6)) continue;
      const roll = rand();
      if (roll > p) {
        if (roll > 0.96 && r.frequency.type !== "timesPerWeek") {
          completions[ckey(r.id, d)] = { id: ckey(r.id, d), routineId: r.id, date: d, value: 0, skipped: true, note: "Rest day" };
        }
        continue;
      }
      const c: Completion = {
        id: ckey(r.id, d),
        routineId: r.id,
        date: d,
        value: targetAmount(r),
        skipped: false,
        completedAt: new Date().toISOString(),
        subtasksDone: r.subtasks.map((s) => s.id),
      };
      completions[c.id] = c;
    }
  }
  return { routines, completions };
}

export { isDone };
