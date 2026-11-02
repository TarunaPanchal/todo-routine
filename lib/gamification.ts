import type { CompletionMap, DateKey, Profile, Routine } from "@/types";
import { eachDayKeys } from "./date";
import { computeStreak, dayProgress, entriesForDay, isDone, perfectDayStreak } from "./schedule";

type WS = 0 | 1 | 6;

export const XP_PER_DONE = 10;
export const XP_PER_PERFECT_DAY = 25;

export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 60)) + 1;
export const xpForLevel = (level: number) => 60 * (level - 1) ** 2;

export interface BadgeCtx {
  totalDone: number;
  perfectDays: number;
  bestRoutineStreak: number;
  perfectStreak: number;
  level: number;
}

export interface BadgeDef {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  check: (c: BadgeCtx) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: "first-step", emoji: "🐣", title: "First Step", desc: "Complete your first routine", check: (c) => c.totalDone >= 1 },
  { id: "perfect-day", emoji: "🌈", title: "Perfect Day", desc: "Finish every routine in a day", check: (c) => c.perfectDays >= 1 },
  { id: "streak-7", emoji: "🔥", title: "7-Day Streak", desc: "Keep any routine going 7 days", check: (c) => c.bestRoutineStreak >= 7 },
  { id: "streak-30", emoji: "🚀", title: "30-Day Streak", desc: "Keep any routine going 30 days", check: (c) => c.bestRoutineStreak >= 30 },
  { id: "perfect-week", emoji: "🏆", title: "Perfect Week", desc: "7 perfect days in a row", check: (c) => c.perfectStreak >= 7 },
  { id: "hundred", emoji: "💯", title: "Century", desc: "Complete 100 routines", check: (c) => c.totalDone >= 100 },
  { id: "level-5", emoji: "⭐", title: "Rising Star", desc: "Reach level 5", check: (c) => c.level >= 5 },
];

export const badgeById = (id: string) => BADGES.find((b) => b.id === id);

export function recomputeProfile(
  routines: Routine[],
  comps: CompletionMap,
  profile: Profile,
  today: DateKey,
  ws: WS,
): { profile: Profile; newBadges: string[] } {
  const byId = new Map(routines.map((r) => [r.id, r]));
  let totalDone = 0;
  const dates = new Set<DateKey>();
  for (const c of Object.values(comps)) {
    const r = byId.get(c.routineId);
    if (r && isDone(r, c)) {
      totalDone++;
      dates.add(c.date);
    }
  }
  let perfectDays = 0;
  for (const d of dates) {
    if (d > today) continue;
    if (dayProgress(entriesForDay(routines, comps, d, today, ws, true)).pct === 1) perfectDays++;
  }
  const xp = totalDone * XP_PER_DONE + perfectDays * XP_PER_PERFECT_DAY;
  const level = levelFromXp(xp);
  const bestRoutineStreak = routines.reduce((m, r) => {
    const s = computeStreak(r, comps, today, ws);
    return s.unit === "day" ? Math.max(m, s.best) : m;
  }, 0);
  const perfectStreak = perfectDayStreak(routines, comps, today, ws).best;
  const ctx: BadgeCtx = { totalDone, perfectDays, bestRoutineStreak, perfectStreak, level };
  const earned = BADGES.filter((b) => b.check(ctx)).map((b) => b.id);
  const newBadges = earned.filter((id) => !profile.badges.includes(id));
  return {
    profile: { ...profile, xp, level, badges: [...profile.badges, ...newBadges] },
    newBadges,
  };
}

export { eachDayKeys };
