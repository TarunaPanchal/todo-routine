"use client";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToday } from "@/hooks/useToday";
import { eachDayKeys, fromKey, toKey } from "@/lib/date";
import { dayProgress, entriesForDay } from "@/lib/schedule";
import { selCompletions, selRoutines, selSettings, useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";
import { useT } from "@/lib/i18n";

const WD = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarPage() {
  const t = useT();
  const today = useToday();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const routines = useStore(selRoutines);
  const comps = useStore(selCompletions);
  const ws = useStore(selSettings).weekStart;

  const cells = useMemo(() => {
    const first = toKey(month);
    const lead = (month.getDay() - ws + 7) % 7;
    const days = eachDayKeys(first, toKey(endOfMonth(month)));
    return [
      ...Array.from({ length: lead }, () => null),
      ...days.map((d) => {
        const entries = d > today ? [] : entriesForDay(routines, comps, d, today, ws);
        const p = dayProgress(entries);
        return { d, p, colors: entries.filter((e) => e.status === "done").map((e) => e.routine.color).slice(0, 4) };
      }),
    ];
  }, [month, routines, comps, today, ws]);

  const monthPcts = cells.filter((c) => c && c.p.pct !== null).map((c) => c!.p.pct as number);
  const avg = monthPcts.length ? Math.round((monthPcts.reduce((a, b) => a + b, 0) / monthPcts.length) * 100) : null;

  return (
    <div>
      <PageHeader title={t("calendar.title")} sub={avg === null ? "No data this month yet" : `${avg}% average this month`} />
      <div className="mx-5 flex items-center justify-between">
        <button className="chip !px-0" aria-label="Previous month" onClick={() => setMonth(subMonths(month, 1))}>
          <ChevronLeft />
        </button>
        <h2 className="text-lg font-black">{format(month, "MMMM yyyy")}</h2>
        <button className="chip !px-0" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
          <ChevronRight />
        </button>
      </div>

      <div className="card mx-5 mt-3 p-3">
        <div className="mb-1 grid grid-cols-7 text-center text-xs font-extrabold text-muted">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i}>{WD[(ws + i) % 7]}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) =>
            c === null ? (
              <span key={`b${i}`} />
            ) : (
              <button
                key={c.d}
                onClick={() => useUI.getState().openDay(c.d)}
                aria-label={`${format(fromKey(c.d), "MMMM d")}${c.p.pct !== null ? `, ${Math.round(c.p.pct * 100)}% done` : ""}`}
                className="relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-sm font-extrabold transition-transform active:scale-90"
                style={{
                  background: c.p.pct === null ? "transparent" : `color-mix(in oklab, var(--accent) ${Math.round(12 + c.p.pct * 70)}%, var(--card))`,
                  color: c.p.pct !== null && c.p.pct > 0.7 ? "var(--accent-ink)" : "var(--ink)",
                  outline: c.d === today ? "2.5px solid var(--accent)" : undefined,
                  outlineOffset: 1,
                  opacity: c.d > today ? 0.5 : 1,
                }}
              >
                {fromKey(c.d).getDate()}
                {c.colors.length > 0 && (
                  <span className="absolute bottom-0.5 flex gap-0.5">
                    {c.colors.map((col, k) => (
                      <span key={k} className="h-1 w-1 rounded-full" style={{ background: col }} />
                    ))}
                  </span>
                )}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mx-5 mt-3 flex items-center justify-center gap-2 text-xs font-bold text-muted">
        Less
        {[0.1, 0.35, 0.6, 0.85, 1].map((p) => (
          <span key={p} className="h-4 w-4 rounded" style={{ background: `color-mix(in oklab, var(--accent) ${Math.round(12 + p * 70)}%, var(--card))` }} />
        ))}
        More
      </div>
    </div>
  );
}
