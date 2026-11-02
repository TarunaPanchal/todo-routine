"use client";
import { LayoutList } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackupReminder } from "@/components/shell/BackupReminder";
import { DateStrip } from "@/components/today/DateStrip";
import { Greeting } from "@/components/today/Greeting";
import { ProgressCard } from "@/components/today/ProgressCard";
import { RoutineCard } from "@/components/today/RoutineCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToday } from "@/hooks/useToday";
import { celebrate } from "@/lib/confetti";
import { buzz } from "@/lib/haptics";
import { useT } from "@/lib/i18n";
import { computeStreak, dayProgress, entriesForDay } from "@/lib/schedule";
import { selCompletions, selRoutines, selSettings, useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";

export default function TodayPage() {
  const t = useT();
  const today = useToday();
  const [selected, setSelected] = useState<string | null>(null);
  const date = selected ?? today;
  const routines = useStore(selRoutines);
  const comps = useStore(selCompletions);
  const settings = useStore(selSettings);
  const ws = settings.weekStart;

  const entries = useMemo(() => entriesForDay(routines, comps, date, today, ws, date < today), [routines, comps, date, today, ws]);
  const progress = dayProgress(entries);
  const streaks = useMemo(
    () => Object.fromEntries(routines.map((r) => [r.id, computeStreak(r, comps, today, ws)])),
    [routines, comps, today, ws],
  );

  // Confetti when the day flips to 100% (not on initial load).
  const allDone = progress.total > 0 && progress.done === progress.total;
  const prev = useRef<{ date: string; allDone: boolean } | null>(null);
  useEffect(() => {
    const p = prev.current;
    if (p && p.date === date && !p.allDone && allDone && date === today) {
      celebrate(true);
      buzz([30, 50, 30, 50, 80], settings.haptics);
    }
    prev.current = { date, allDone };
  }, [allDone, date, today, settings.haptics]);

  const pctFor = (d: string) => (d > today ? null : dayProgress(entriesForDay(routines, comps, d, today, ws)).pct);
  const noRoutines = routines.filter((r) => !r.archived).length === 0;

  return (
    <div>
      <div className="flex items-start justify-between px-5 pt-5">
        <Greeting />
        <Link href="/routines" aria-label="Manage routines" className="chip !px-0">
          <LayoutList size={20} />
        </Link>
      </div>
      <div className="mt-3">
        <DateStrip selected={date} today={today} weekStart={ws} onSelect={(d) => setSelected(d === today ? null : d)} pctFor={pctFor} />
      </div>
      <ProgressCard done={progress.done} total={progress.total} isToday={date === today} />
      <BackupReminder />

      {date !== today && (
        <button className="mx-5 mt-3 min-h-11 text-sm font-extrabold text-accent" onClick={() => setSelected(null)}>
          ← Back to today
        </button>
      )}

      {noRoutines ? (
        <EmptyState
          title={t("today.empty.title")}
          body={t("today.empty.body")}
          action={
            <button className="btn" onClick={() => useUI.getState().openEditor({ showTemplates: true })}>
              Create your first routine
            </button>
          }
        />
      ) : entries.length === 0 ? (
        <EmptyState title={t("today.noneToday")} body="Nothing to do here. Enjoy your free time 🌤️" mood="happy" />
      ) : (
        <ul className="mt-4 space-y-3 px-5" aria-label="Routines">
          {entries.map((e, i) => (
            <RoutineCard key={e.routine.id} entry={e} date={date} streak={streaks[e.routine.id]} index={i} readOnly={date > today} />
          ))}
        </ul>
      )}
    </div>
  );
}
