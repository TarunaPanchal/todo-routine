"use client";
import { addMonths, addWeeks, addYears, format, subMonths, subWeeks, subYears } from "date-fns";
import { toPng } from "html-to-image";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Heatmap } from "@/components/reports/Heatmap";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToday } from "@/hooks/useToday";
import { badgeById, BADGES } from "@/lib/gamification";
import { addDaysKey, eachDayKeys, fromKey, toKey } from "@/lib/date";
import { download } from "@/lib/export";
import { useT } from "@/lib/i18n";
import { perfectDayStreak } from "@/lib/schedule";
import { WEEKDAY_NAMES, buildInsights, categoryTotals, dailySeries, rangeKeys, routineBreakdown, summarize } from "@/lib/stats";
import { selCompletions, selRoutines, selSettings, useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";
import type { Period } from "@/types";

const PIE = ["#3d9be9", "#6fd6c8", "#ffd66b", "#9ee493", "#a99bff", "#ffb482"];
const shift = (d: Date, p: Period, dir: 1 | -1) =>
  p === "week" ? (dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1)) : p === "month" ? (dir > 0 ? addMonths(d, 1) : subMonths(d, 1)) : dir > 0 ? addYears(d, 1) : subYears(d, 1);

export default function ReportsPage() {
  const t = useT();
  const today = useToday();
  const [period, setPeriod] = useState<Period>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const routines = useStore(selRoutines);
  const comps = useStore(selCompletions);
  const settings = useStore(selSettings);
  const earned = useStore((s) => s.profile.badges);
  const ws = settings.weekStart;
  const reportRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const keys = useMemo(() => rangeKeys(period, toKey(anchor), ws), [period, anchor, ws]);
  const series = useMemo(() => dailySeries(routines, comps, keys, today, ws), [routines, comps, keys, today, ws]);
  const summary = useMemo(() => summarize(series), [series]);
  const breakdown = useMemo(() => routineBreakdown(routines, comps, keys, today), [routines, comps, keys, today]);
  const cats = useMemo(() => categoryTotals(routines, comps, keys), [routines, comps, keys]);
  const streak = useMemo(() => perfectDayStreak(routines, comps, today, ws), [routines, comps, today, ws]);
  const insights = useMemo(() => buildInsights(summary, breakdown, period), [summary, breakdown, period]);

  // Bar/line data: days for week & month, months for year.
  const chart = useMemo(() => {
    if (period !== "year") return series.map((s) => ({ label: format(fromKey(s.date), period === "week" ? "EEE" : "d"), done: s.done, total: s.total, pct: s.future || s.pct === null ? null : Math.round(s.pct * 100) }));
    return Array.from({ length: 12 }, (_, m) => {
      const ds = series.filter((s) => fromKey(s.date).getMonth() === m && !s.future);
      const done = ds.reduce((n, s) => n + s.done, 0);
      const total = ds.reduce((n, s) => n + s.total, 0);
      return { label: format(new Date(2000, m, 1), "MMM"), done, total, pct: total ? Math.round((done / total) * 100) : null };
    });
  }, [series, period]);

  // Heatmap range: whole year for "year", else the trailing ~16 weeks ending at the period end.
  const heat = useMemo(() => {
    if (period === "year") return series;
    const endKey = keys[keys.length - 1] > today ? today : keys[keys.length - 1];
    return dailySeries(routines, comps, eachDayKeys(addDaysKey(endKey, -111), endKey), today, ws);
  }, [period, series, keys, today, routines, comps, ws]);

  const label =
    period === "week" ? `${format(fromKey(keys[0]), "MMM d")} – ${format(fromKey(keys[6]), "MMM d")}` : period === "month" ? format(anchor, "MMMM yyyy") : format(anchor, "yyyy");
  const empty = summary.totalPlanned === 0;

  const share = async () => {
    if (!reportRef.current) return;
    setSharing(true);
    try {
      const bg = getComputedStyle(document.body).backgroundColor;
      const dataUrl = await toPng(reportRef.current, { pixelRatio: 2, backgroundColor: bg, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `routinebuddy-${period}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "My RoutineBuddy report" });
      else download(file.name, blob, "image/png");
    } catch (e) {
      if ((e as Error).name !== "AbortError") useUI.getState().showToast("Couldn't export the image");
    } finally {
      setSharing(false);
    }
  };

  const tile = (title: string, value: string, sub?: string) => (
    <div className="card p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">{title}</p>
      <p className="text-2xl font-black">{value}</p>
      {sub && <p className="text-xs font-bold text-muted">{sub}</p>}
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t("reports.title")}
        right={
          <button className="chip" onClick={share} disabled={sharing || empty} aria-label="Share report as image">
            <Share2 size={16} /> {sharing ? "…" : "Share"}
          </button>
        }
      />
      <div className="mx-5 grid grid-cols-3 gap-1 rounded-full bg-line p-1" role="tablist" aria-label="Period">
        {(["week", "month", "year"] as Period[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className="min-h-11 rounded-full text-sm font-extrabold capitalize transition-colors"
            style={{ background: period === p ? "var(--card)" : "transparent", boxShadow: period === p ? "var(--shadow)" : undefined }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mx-5 mt-3 flex items-center justify-between">
        <button className="chip !px-0" aria-label={`Previous ${period}`} onClick={() => setAnchor(shift(anchor, period, -1))}>
          <ChevronLeft />
        </button>
        <span className="font-extrabold">{label}</span>
        <button className="chip !px-0" aria-label={`Next ${period}`} onClick={() => setAnchor(shift(anchor, period, 1))}>
          <ChevronRight />
        </button>
      </div>

      {empty ? (
        <EmptyState title="No data for this period" body="Complete some routines (or load demo data in Settings) to see your insights." />
      ) : (
        <div ref={reportRef} className="mt-3 space-y-3 bg-bg px-5 pb-4 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black">🌱 RoutineBuddy · {label}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tile("Completion", `${Math.round(summary.rate * 100)}%`, `${summary.perfectDays} perfect days`)}
            {tile("Completed", String(summary.totalDone), `of ${summary.totalPlanned} planned`)}
            {tile("Current streak", `${streak.current} 🔥`, "perfect days in a row")}
            {tile("Best streak", `${streak.best} 🏆`, summary.bestWeekday !== null ? `Best day: ${WEEKDAY_NAMES[summary.bestWeekday]}` : undefined)}
          </div>

          <div className="card space-y-1.5 p-4">
            <h3 className="font-black">Insights</h3>
            {insights.map((s, i) => (
              <p key={i} className="text-sm font-semibold">
                {s}
              </p>
            ))}
          </div>

          <div className="card p-4">
            <h3 className="mb-2 font-black">Routines completed</h3>
            <div className="h-44" role="img" aria-label="Bar chart of completed routines">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ left: -24, right: 4, top: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} interval={period === "month" ? 3 : 0} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip cursor={{ fill: "var(--line)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)" }} />
                  <Bar dataKey="done" name="Done" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-2 font-black">Trend (% done)</h3>
            <div className="h-40" role="img" aria-label="Line chart of completion trend">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} interval={period === "month" ? 3 : 0} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)" }} />
                  <Line type="monotone" dataKey="pct" name="Done" stroke="var(--accent)" strokeWidth={3} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-2 font-black">Activity heatmap</h3>
            <Heatmap days={heat} weekStart={ws} />
          </div>

          {breakdown.length > 0 && (
            <div className="card space-y-3 p-4">
              <h3 className="font-black">By routine</h3>
              {[...breakdown]
                .sort((a, b) => b.rate - a.rate)
                .map((b) => (
                  <div key={b.routine.id}>
                    <div className="mb-1 flex justify-between text-sm font-bold">
                      <span className="truncate">
                        {b.routine.emoji} {b.routine.title}
                      </span>
                      <span>
                        {Math.round(b.rate * 100)}% <span className="text-muted">({b.done}/{b.total})</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full" style={{ width: `${b.rate * 100}%`, background: b.routine.color }} />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {cats.length > 0 && (
            <div className="card p-4">
              <h3 className="mb-1 font-black">By category</h3>
              <div className="flex items-center gap-3">
                <div className="h-36 w-36 shrink-0" role="img" aria-label="Pie chart of completions by category">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={cats} dataKey="value" nameKey="name" innerRadius={34} outerRadius={64} paddingAngle={3} stroke="none">
                        {cats.map((_, i) => (
                          <Cell key={i} fill={PIE[i % PIE.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-1 text-sm font-bold">
                  {cats.map((c, i) => (
                    <li key={c.name} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: PIE[i % PIE.length] }} />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-muted">{c.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <section className="mx-5 mt-3">
        <h3 className="mb-2 font-black">Badges</h3>
        <ul className="grid grid-cols-4 gap-2">
          {BADGES.map((b) => {
            const on = earned.includes(b.id);
            return (
              <li key={b.id} className="card flex flex-col items-center p-2 text-center" style={{ opacity: on ? 1 : 0.45 }} title={b.desc}>
                <span className={`text-3xl ${on ? "" : "grayscale"}`}>{b.emoji}</span>
                <span className="mt-1 text-[10px] font-extrabold leading-tight">{b.title}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">{earned.length}/{BADGES.length} unlocked{earned.length ? ` · latest: ${badgeById(earned[earned.length - 1])?.title}` : ""}</p>
      </section>
    </div>
  );
}
