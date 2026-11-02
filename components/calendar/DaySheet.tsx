"use client";
import { useMemo } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { RoutineCard } from "@/components/today/RoutineCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmt, todayKey } from "@/lib/date";
import { computeStreak, dayProgress, entriesForDay } from "@/lib/schedule";
import { selCompletions, selRoutines, selSettings, useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";

/** View / backfill a past (or future, read-only) day. */
export function DaySheet() {
  const date = useUI((s) => s.daySheet);
  const close = () => useUI.getState().openDay(null);
  const routines = useStore(selRoutines);
  const comps = useStore(selCompletions);
  const ws = useStore(selSettings).weekStart;
  const today = todayKey();

  const entries = useMemo(() => (date ? entriesForDay(routines, comps, date, today, ws, true) : []), [date, routines, comps, today, ws]);
  const streaks = useMemo(() => Object.fromEntries(routines.map((r) => [r.id, computeStreak(r, comps, today, ws)])), [routines, comps, today, ws]);
  const p = dayProgress(entries);

  return (
    <BottomSheet open={!!date} onClose={close} title={date ? fmt(date, "EEEE, MMM d") : ""}>
      {date && (
        <div className="pb-2">
          <p className="mb-3 text-sm font-bold text-muted">
            {date > today ? "Upcoming. You can complete this day when it arrives." : entries.length ? `${p.done} of ${p.total} done${p.skipped ? ` · ${p.skipped} skipped` : ""}. Tap to fix anything you forgot.` : ""}
          </p>
          {entries.length === 0 ? (
            <EmptyState title="Nothing here" body="No routines were scheduled for this day." mood="happy" />
          ) : (
            <ul className="space-y-3">
              {entries.map((e, i) => (
                <RoutineCard key={e.routine.id} entry={e} date={date} streak={streaks[e.routine.id]} index={i} readOnly={date > today} />
              ))}
            </ul>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
