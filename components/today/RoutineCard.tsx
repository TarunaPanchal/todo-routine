"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Minus, Pause, Pencil, Play, Plus, SkipForward, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { DayEntry } from "@/types";
import type { Streak } from "@/lib/schedule";
import { progressOf, targetAmount } from "@/lib/schedule";
import { formatTime } from "@/lib/date";
import { buzz } from "@/lib/haptics";
import { useNow } from "@/hooks/useNow";
import { useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

interface Props {
  entry: DayEntry;
  date: string;
  streak: Streak;
  index: number;
  readOnly?: boolean;
}

export function RoutineCard({ entry, date, streak, index, readOnly }: Props) {
  const { routine: r, completion: c, status } = entry;
  const settings = useStore((s) => s.profile.settings);
  const { toggleCheck, addCount, setValue, toggleSubtask, unskip } = useStore.getState();
  const openSkip = useUI((s) => s.openSkip);
  const openEditor = useUI((s) => s.openEditor);
  const timer = useUI((s) => s.timer);
  const [open, setOpen] = useState(false);

  const done = status === "done";
  const skipped = status === "skipped";
  const isDuration = r.target.type === "duration";
  const running = !!timer && timer.routineId === r.id && timer.date === date;
  const now = useNow(running);
  const savedSeconds = c?.value ?? 0;
  const liveSeconds = running ? timer.baseSeconds + (now - timer.startedAt) / 1000 : savedSeconds;
  const targetSecs = targetAmount(r);

  const haptic = (p: number | number[]) => buzz(p, settings.haptics);

  const stopTimer = (finalSecs?: number) => {
    const t = useUI.getState().timer;
    if (!t) return;
    const secs = finalSecs ?? t.baseSeconds + (Date.now() - t.startedAt) / 1000;
    useUI.getState().stopTimer();
    useStore.getState().setValue(t.routineId, t.date, Math.round(secs));
  };

  // Auto-finish when a running timer reaches its target.
  useEffect(() => {
    if (running && isDuration && liveSeconds >= targetSecs) {
      stopTimer(targetSecs);
      haptic([20, 40, 20, 40, 20]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, liveSeconds, targetSecs, isDuration]);

  const toggleTimer = () => {
    if (readOnly) return;
    haptic(10);
    if (running) return stopTimer();
    if (useUI.getState().timer) stopTimer();
    useUI.getState().startTimer({ routineId: r.id, date, startedAt: Date.now(), baseSeconds: done ? 0 : savedSeconds });
  };

  const subDone = c?.subtasksDone ?? [];
  const frac = isDuration ? Math.min(1, liveSeconds / targetSecs) : progressOf(r, c);
  const showBar = r.target.type !== "check" || (r.subtasks.length > 0 && subDone.length > 0 && !done);
  const barVal = r.target.type === "check" && r.subtasks.length ? subDone.length / r.subtasks.length : frac;

  const meta: string[] = [];
  if (r.reminderTime) meta.push(formatTime(r.reminderTime, settings.timeFormat));
  if (r.target.type === "count") meta.push(`${c?.value ?? 0}/${r.target.value}${r.target.unit ? " " + r.target.unit : ""}`);
  if (isDuration) meta.push(`${mmss(liveSeconds)} / ${r.target.value}m`);
  if (r.frequency.type === "timesPerWeek") meta.push(`${r.frequency.timesPerWeek}×/week`);
  if (r.target.type === "check" && r.subtasks.length) meta.push(`${subDone.length}/${r.subtasks.length} steps`);
  if (!meta.length) meta.push(r.category);

  const expandable = r.subtasks.length > 0 || !!r.note || !readOnly || skipped;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.045, type: "spring", stiffness: 300, damping: 26 }}
      className="card tint overflow-hidden"
      style={{ ["--tint" as string]: r.color, opacity: skipped ? 0.7 : 1 }}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => expandable && setOpen((o) => !o)}
          aria-expanded={expandable ? open : undefined}
          aria-label={`${r.title}, ${open ? "collapse" : "expand"} details`}
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{ background: `color-mix(in oklab, ${r.color} 55%, var(--card))` }}
          >
            {r.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-base font-extrabold ${done ? "line-through opacity-60" : ""}`}>{r.title}</span>
            <span className="block truncate text-xs font-bold text-muted">
              {skipped ? `Skipped${c?.note ? ` · ${c.note}` : ""}` : meta.join(" · ")}
            </span>
          </span>
          {streak.current > 0 && (
            <span className="flex shrink-0 items-center text-sm font-extrabold" title={`${streak.current} ${streak.unit} streak`} aria-label={`${streak.current} ${streak.unit} streak`}>
              <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                🔥
              </motion.span>
              {streak.current}
              {streak.unit === "week" ? "w" : ""}
            </span>
          )}
          {expandable && <ChevronDown size={16} className="shrink-0 text-muted transition-transform" style={{ transform: open ? "rotate(180deg)" : undefined }} />}
        </button>

        {/* Controls */}
        {skipped ? (
          !readOnly && (
            <button className="chip" onClick={() => unskip(r.id, date)} aria-label={`Undo skip for ${r.title}`}>
              <Undo2 size={16} />
            </button>
          )
        ) : r.target.type === "check" ? (
          <CheckButton done={done} disabled={readOnly} label={`${done ? "Uncheck" : "Complete"} ${r.title}`} onClick={() => { haptic(done ? 8 : [15, 30, 15]); toggleCheck(r.id, date); }} />
        ) : r.target.type === "count" ? (
          <div className="flex items-center gap-1.5">
            {(c?.value ?? 0) > 0 && (
              <button className="chip !px-0" disabled={readOnly} aria-label={`Remove one from ${r.title}`} onClick={() => { haptic(6); addCount(r.id, date, -1); }}>
                <Minus size={16} />
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.82 }}
              disabled={readOnly}
              aria-label={`Add one to ${r.title}`}
              onClick={() => {
                const willFinish = (c?.value ?? 0) + 1 === r.target.value;
                haptic(willFinish ? [15, 30, 15] : 10);
                addCount(r.id, date, 1);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full text-accent-ink disabled:opacity-40"
              style={{ background: done ? "#4cc38a" : "var(--accent)" }}
            >
              {done ? <Check size={24} strokeWidth={3.5} /> : <Plus size={24} strokeWidth={3.5} />}
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.82 }}
            disabled={readOnly}
            aria-label={`${running ? "Pause" : "Start"} timer for ${r.title}`}
            onClick={toggleTimer}
            className="flex h-12 w-12 items-center justify-center rounded-full text-accent-ink disabled:opacity-40"
            style={{ background: done ? "#4cc38a" : "var(--accent)" }}
          >
            {done ? <Check size={24} strokeWidth={3.5} /> : running ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </motion.button>
        )}
      </div>

      {showBar && !skipped && (
        <div className="mx-3 mb-3 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <motion.div className="h-full rounded-full" style={{ background: r.color }} animate={{ width: `${barVal * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-2 border-t border-line/70 px-3 pb-3 pt-2">
              {r.note && <p className="text-sm text-muted">{r.note}</p>}
              {r.subtasks.length > 0 && (
                <ul className="space-y-1">
                  {r.subtasks.map((s) => {
                    const on = subDone.includes(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          role="checkbox"
                          aria-checked={on}
                          disabled={readOnly}
                          onClick={() => { haptic(on ? 6 : 12); toggleSubtask(r.id, date, s.id); }}
                          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm font-bold"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg border-2" style={{ borderColor: r.color, background: on ? r.color : "transparent" }}>
                            {on && <Check size={14} strokeWidth={4} color="#fff" />}
                          </span>
                          <span className={on ? "line-through opacity-60" : ""}>{s.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!readOnly && (
                <div className="flex gap-2 pt-1">
                  {!skipped && !done && (
                    <button className="chip flex-1" onClick={() => openSkip({ routineId: r.id, date })}>
                      <SkipForward size={16} /> Skip
                    </button>
                  )}
                  <button className="chip flex-1" onClick={() => openEditor({ routineId: r.id })}>
                    <Pencil size={16} /> Edit
                  </button>
                </div>
              )}
              {isDuration && !done && !readOnly && !running && savedSeconds > 0 && (
                <button className="chip w-full" onClick={() => setValue(r.id, date, 0)}>
                  Reset timer
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function CheckButton({ done, onClick, disabled, label }: { done: boolean; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <motion.button
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      disabled={disabled}
      whileTap={{ scale: 0.8 }}
      animate={done ? { scale: [1, 1.35, 1], rotate: [0, -8, 0] } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 14 }}
      onClick={onClick}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] disabled:opacity-40"
      style={{ borderColor: done ? "#4cc38a" : "var(--line)", background: done ? "#4cc38a" : "var(--card)" }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: 0.25 }} />
      </svg>
    </motion.button>
  );
}
