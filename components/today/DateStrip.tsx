"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import type { DateKey } from "@/types";
import { addDaysKey, fmt, weekKeys } from "@/lib/date";

interface Props {
  selected: DateKey;
  today: DateKey;
  weekStart: 0 | 1 | 6;
  onSelect: (d: DateKey) => void;
  /** 0..1 or null per day for the little dot */
  pctFor: (d: DateKey) => number | null;
}

/** Swipeable week. Swipe left/right to change week; selected day is kept in the same weekday slot. */
export function DateStrip({ selected, today, weekStart, onSelect, pctFor }: Props) {
  const [dir, setDir] = useState(0);
  const dragged = useRef(false);
  const days = weekKeys(selected, weekStart);

  const shift = (n: number) => {
    setDir(n);
    onSelect(addDaysKey(selected, n * 7));
  };

  return (
    <div className="overflow-hidden" role="group" aria-label="Choose day">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={days[0]}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d * 60, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d * -60, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragStart={() => (dragged.current = true)}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) shift(1);
            else if (info.offset.x > 50) shift(-1);
            setTimeout(() => (dragged.current = false), 50);
          }}
          className="grid grid-cols-7 gap-1.5 px-4 py-1"
        >
          {days.map((d) => {
            const sel = d === selected;
            const pct = pctFor(d);
            return (
              <button
                key={d}
                aria-pressed={sel}
                aria-label={fmt(d, "EEEE, MMMM d") + (d === today ? " (today)" : "")}
                onClick={() => !dragged.current && onSelect(d)}
                className="flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border border-line py-1.5 text-center transition-transform active:scale-90"
                style={{
                  background: sel ? "var(--accent)" : "var(--card)",
                  color: sel ? "var(--accent-ink)" : "var(--ink)",
                  boxShadow: sel ? "var(--shadow)" : undefined,
                }}
              >
                <span className="text-[11px] font-bold opacity-80">{fmt(d, "EEEEE")}</span>
                <span className="text-base font-extrabold leading-none">{fmt(d, "d")}</span>
                <span
                  className="mt-0.5 h-1.5 w-1.5 rounded-full"
                  style={{
                    background: pct === null ? "transparent" : sel ? "var(--accent-ink)" : "var(--accent)",
                    opacity: pct === null ? 0 : 0.25 + 0.75 * pct,
                    outline: d === today && !sel ? "2px solid var(--accent)" : undefined,
                    outlineOffset: 2,
                  }}
                />
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
