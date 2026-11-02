import { describe, expect, it } from "vitest";
import type { Completion, CompletionMap, Routine } from "@/types";
import { addDaysKey, toKey } from "@/lib/date";
import { migrate, SCHEMA_VERSION } from "@/lib/migrate";
import { ckey, computeStreak, dayProgress, entriesForDay, isDone, isScheduledOn, perfectDayStreak } from "@/lib/schedule";
import { levelFromXp, xpForLevel } from "@/lib/gamification";

const make = (over: Partial<Routine> = {}): Routine => ({
  id: "r1",
  title: "Test",
  emoji: "🌞",
  color: "#fff",
  category: "Health",
  frequency: { type: "daily", days: [], interval: 2, timesPerWeek: 3 },
  target: { type: "check", value: 1 },
  subtasks: [],
  startDate: "2025-01-01",
  archived: false,
  order: 0,
  createdAt: "",
  ...over,
});

const done = (r: Routine, date: string): Completion => ({
  id: ckey(r.id, date),
  routineId: r.id,
  date,
  value: r.target.type === "duration" ? r.target.value * 60 : r.target.value,
  skipped: false,
});
const skipped = (r: Routine, date: string): Completion => ({ id: ckey(r.id, date), routineId: r.id, date, value: 0, skipped: true });
const mapOf = (...cs: Completion[]): CompletionMap => Object.fromEntries(cs.map((c) => [c.id, c]));

describe("dates", () => {
  it("keeps local-date keys stable across month/year boundaries", () => {
    expect(addDaysKey("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDaysKey("2024-02-28", 1)).toBe("2024-02-29");
    expect(toKey(new Date(2025, 5, 1, 23, 59))).toBe("2025-06-01");
  });
});

describe("isScheduledOn", () => {
  it("daily respects start and end date", () => {
    const r = make({ startDate: "2025-03-10", endDate: "2025-03-12" });
    expect(isScheduledOn(r, "2025-03-09")).toBe(false);
    expect(isScheduledOn(r, "2025-03-10")).toBe(true);
    expect(isScheduledOn(r, "2025-03-12")).toBe(true);
    expect(isScheduledOn(r, "2025-03-13")).toBe(false);
  });
  it("weekdays", () => {
    const r = make({ frequency: { type: "weekdays", days: [1, 3], interval: 1, timesPerWeek: 1 } });
    expect(isScheduledOn(r, "2025-03-10")).toBe(true); // Monday
    expect(isScheduledOn(r, "2025-03-11")).toBe(false);
    expect(isScheduledOn(r, "2025-03-12")).toBe(true); // Wednesday
  });
  it("monthDays clamps to month end", () => {
    const r = make({ frequency: { type: "monthDays", days: [1, 31], interval: 1, timesPerWeek: 1 } });
    expect(isScheduledOn(r, "2025-02-28")).toBe(true); // 31 clamps to Feb 28
    expect(isScheduledOn(r, "2025-02-27")).toBe(false);
    expect(isScheduledOn(r, "2025-04-01")).toBe(true);
    expect(isScheduledOn(r, "2025-04-30")).toBe(true);
  });
  it("monthly uses start date's day of month", () => {
    const r = make({ startDate: "2025-01-31", frequency: { type: "monthly", days: [], interval: 1, timesPerWeek: 1 } });
    expect(isScheduledOn(r, "2025-02-28")).toBe(true);
    expect(isScheduledOn(r, "2025-03-31")).toBe(true);
    expect(isScheduledOn(r, "2025-03-30")).toBe(false);
  });
  it("interval every N days from start", () => {
    const r = make({ startDate: "2025-01-01", frequency: { type: "interval", days: [], interval: 3, timesPerWeek: 1 } });
    expect(isScheduledOn(r, "2025-01-01")).toBe(true);
    expect(isScheduledOn(r, "2025-01-02")).toBe(false);
    expect(isScheduledOn(r, "2025-01-04")).toBe(true);
    expect(isScheduledOn(r, "2024-12-29")).toBe(false);
  });
});

describe("isDone", () => {
  it("count and duration targets", () => {
    const water = make({ target: { type: "count", value: 8 } });
    expect(isDone(water, { ...done(water, "2025-01-02"), value: 7 })).toBe(false);
    expect(isDone(water, { ...done(water, "2025-01-02"), value: 8 })).toBe(true);
    const run = make({ target: { type: "duration", value: 30 } });
    expect(isDone(run, { ...done(run, "2025-01-02"), value: 1799 })).toBe(false);
    expect(isDone(run, { ...done(run, "2025-01-02"), value: 1800 })).toBe(true);
  });
  it("skipped is never done", () => {
    const r = make();
    expect(isDone(r, skipped(r, "2025-01-02"))).toBe(false);
  });
});

describe("computeStreak (daily)", () => {
  const r = make();
  it("counts consecutive days ending today", () => {
    const c = mapOf(done(r, "2025-01-08"), done(r, "2025-01-09"), done(r, "2025-01-10"));
    expect(computeStreak(r, c, "2025-01-10")).toMatchObject({ current: 3, best: 3 });
  });
  it("today pending does not break the streak", () => {
    const c = mapOf(done(r, "2025-01-08"), done(r, "2025-01-09"));
    expect(computeStreak(r, c, "2025-01-10").current).toBe(2);
  });
  it("a missed past day breaks it but best is kept", () => {
    const c = mapOf(done(r, "2025-01-02"), done(r, "2025-01-03"), done(r, "2025-01-04"), done(r, "2025-01-06"));
    const s = computeStreak(r, c, "2025-01-06");
    expect(s.current).toBe(1);
    expect(s.best).toBe(3);
  });
  it("skipped days keep the streak alive without counting", () => {
    const c = mapOf(done(r, "2025-01-07"), skipped(r, "2025-01-08"), done(r, "2025-01-09"), done(r, "2025-01-10"));
    expect(computeStreak(r, c, "2025-01-10")).toMatchObject({ current: 3, best: 3 });
  });
  it("unscheduled days are ignored", () => {
    const mwf = make({ frequency: { type: "weekdays", days: [1, 3, 5], interval: 1, timesPerWeek: 1 } });
    // Mon 6, Wed 8, Fri 10 Jan 2025
    const c = mapOf(done(mwf, "2025-01-06"), done(mwf, "2025-01-08"), done(mwf, "2025-01-10"));
    expect(computeStreak(mwf, c, "2025-01-11").current).toBe(3);
  });
  it("is zero when never started", () => {
    expect(computeStreak(make({ startDate: "2025-02-01" }), {}, "2025-01-10")).toMatchObject({ current: 0, best: 0 });
  });
});

describe("computeStreak (times per week)", () => {
  const r = make({ frequency: { type: "timesPerWeek", days: [], interval: 1, timesPerWeek: 2 } });
  it("counts consecutive weeks meeting the quota (Mon start)", () => {
    // weeks: Jan 6-12, Jan 13-19, Jan 20-26
    const c = mapOf(
      done(r, "2025-01-07"), done(r, "2025-01-09"),
      done(r, "2025-01-14"), done(r, "2025-01-18"),
      done(r, "2025-01-21"),
    );
    const s = computeStreak(r, c, "2025-01-22", 1);
    expect(s.unit).toBe("week");
    expect(s.current).toBe(2); // current week not yet met but still in progress
    expect(s.best).toBe(2);
  });
  it("a finished week under quota breaks it", () => {
    const c = mapOf(done(r, "2025-01-07"), done(r, "2025-01-09"), done(r, "2025-01-14"));
    expect(computeStreak(r, c, "2025-01-22", 1).current).toBe(0);
  });
});

describe("entriesForDay / dayProgress", () => {
  it("excludes skipped from denominator", () => {
    const a = make({ id: "a" });
    const b = make({ id: "b" });
    const c = make({ id: "c" });
    const comps = mapOf(done(a, "2025-01-10"), skipped(b, "2025-01-10"));
    const p = dayProgress(entriesForDay([a, b, c], comps, "2025-01-10", "2025-01-10", 1));
    expect(p).toMatchObject({ done: 1, total: 2, skipped: 1, pct: 0.5 });
  });
  it("flexible routine shows pending only while quota unmet", () => {
    const r = make({ frequency: { type: "timesPerWeek", days: [], interval: 1, timesPerWeek: 1 } });
    expect(entriesForDay([r], {}, "2025-01-08", "2025-01-08", 1)).toHaveLength(1);
    const comps = mapOf(done(r, "2025-01-06"));
    expect(entriesForDay([r], comps, "2025-01-08", "2025-01-08", 1)).toHaveLength(0);
    expect(entriesForDay([r], comps, "2025-01-06", "2025-01-08", 1)).toHaveLength(1);
  });
  it("hides archived routines unless they have history that day", () => {
    const r = make({ archived: true });
    expect(entriesForDay([r], {}, "2025-01-10", "2025-01-10", 1)).toHaveLength(0);
    expect(entriesForDay([r], mapOf(done(r, "2025-01-10")), "2025-01-10", "2025-01-10", 1)).toHaveLength(1);
  });
});

describe("perfectDayStreak", () => {
  it("tracks consecutive perfect days", () => {
    const a = make({ id: "a" });
    const b = make({ id: "b" });
    const comps = mapOf(
      done(a, "2025-01-02"), done(b, "2025-01-02"),
      done(a, "2025-01-03"),
      done(a, "2025-01-04"), done(b, "2025-01-04"),
      done(a, "2025-01-05"), done(b, "2025-01-05"),
    );
    expect(perfectDayStreak([a, b], comps, "2025-01-05", 1)).toEqual({ current: 2, best: 2 });
  });
});

describe("gamification + migration", () => {
  it("levels are monotonic and consistent with xpForLevel", () => {
    for (let l = 1; l < 10; l++) expect(levelFromXp(xpForLevel(l))).toBe(l);
    expect(levelFromXp(0)).toBe(1);
  });
  it("migrates legacy / garbage data to the current schema", () => {
    expect(migrate(null).schemaVersion).toBe(SCHEMA_VERSION);
    const m = migrate({ routines: [{ id: "x", title: "old" }], completions: {}, profile: {} });
    expect(m.routines[0]).toMatchObject({ subtasks: [], archived: false });
    expect(m.profile.settings.weekStart).toBe(1);
  });
});
