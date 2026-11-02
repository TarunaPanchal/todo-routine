import { addDays, differenceInCalendarDays, format, getDaysInMonth, parse, startOfWeek } from "date-fns";
import type { DateKey } from "@/types";

/** All date keys are local-time `yyyy-MM-dd` strings; never derive them from UTC (toISOString). */
export const toKey = (d: Date): DateKey => format(d, "yyyy-MM-dd");
export const fromKey = (k: DateKey): Date => parse(k, "yyyy-MM-dd", new Date(2000, 0, 1));
export const todayKey = (): DateKey => toKey(new Date());
export const addDaysKey = (k: DateKey, n: number): DateKey => toKey(addDays(fromKey(k), n));
/** a - b in calendar days */
export const diffDays = (a: DateKey, b: DateKey): number => differenceInCalendarDays(fromKey(a), fromKey(b));
export const weekdayOf = (k: DateKey): number => fromKey(k).getDay();
export const dayOfMonth = (k: DateKey): number => fromKey(k).getDate();
export const daysInMonthOf = (k: DateKey): number => getDaysInMonth(fromKey(k));

export const weekStartKey = (k: DateKey, weekStartsOn: 0 | 1 | 6 = 1): DateKey =>
  toKey(startOfWeek(fromKey(k), { weekStartsOn }));

export const weekKeys = (k: DateKey, weekStartsOn: 0 | 1 | 6 = 1): DateKey[] => {
  const s = weekStartKey(k, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDaysKey(s, i));
};

export const eachDayKeys = (from: DateKey, to: DateKey): DateKey[] => {
  const n = diffDays(to, from);
  return n < 0 ? [] : Array.from({ length: n + 1 }, (_, i) => addDaysKey(from, i));
};

export const fmt = (k: DateKey, pattern: string): string => format(fromKey(k), pattern);

export const formatTime = (hhmm: string, mode: "12" | "24"): string => {
  const [h, m] = hhmm.split(":").map(Number);
  if (mode === "24") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
};
