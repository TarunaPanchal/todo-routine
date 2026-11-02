"use client";
import type { DayStat } from "@/lib/stats";
import { fromKey } from "@/lib/date";
import { format } from "date-fns";

/** GitHub-style contribution grid: columns = weeks, rows = weekdays. */
export function Heatmap({ days, weekStart }: { days: DayStat[]; weekStart: 0 | 1 | 6 }) {
  if (!days.length) return null;
  const lead = (fromKey(days[0].date).getDay() - weekStart + 7) % 7;
  const cells: (DayStat | null)[] = [...Array.from({ length: lead }, () => null), ...days];
  const cols: (DayStat | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));
  return (
    <div className="overflow-x-auto pb-1" role="img" aria-label="Completion heatmap">
      <div className="flex w-max gap-[3px]">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, ri) => {
              const c = col[ri];
              if (!c) return <span key={ri} className="h-3.5 w-3.5" />;
              const pct = c.pct;
              return (
                <span
                  key={ri}
                  title={`${format(fromKey(c.date), "MMM d")}: ${pct === null ? "no routines" : Math.round(pct * 100) + "%"}`}
                  className="h-3.5 w-3.5 rounded-[4px]"
                  style={{
                    background: pct === null || c.future ? "var(--line)" : `color-mix(in oklab, var(--accent) ${Math.round(18 + pct * 72)}%, var(--card))`,
                    opacity: c.future ? 0.4 : 1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
