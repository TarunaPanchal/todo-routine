"use client";
import type { Frequency, FrequencyType } from "@/types";
import { fromKey } from "@/lib/date";

const TYPES: { id: FrequencyType; label: string }[] = [
  { id: "daily", label: "Every day" },
  { id: "weekdays", label: "Weekdays" },
  { id: "timesPerWeek", label: "X per week" },
  { id: "monthDays", label: "Month days" },
  { id: "monthly", label: "Monthly" },
  { id: "interval", label: "Every N days" },
];
const WD = ["S", "M", "T", "W", "T", "F", "S"];
const WD_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Props {
  value: Frequency;
  onChange: (f: Frequency) => void;
  startDate: string;
  weekStart: 0 | 1 | 6;
}

const toggle = (arr: number[], n: number) => (arr.includes(n) ? arr.filter((x) => x !== n) : [...arr, n].sort((a, b) => a - b));

export function FrequencyPicker({ value, onChange, startDate, weekStart }: Props) {
  const order = Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Repeat">
        {TYPES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={value.type === t.id}
            className="chip"
            onClick={() =>
              onChange({
                ...value,
                type: t.id,
                days: t.id === "weekdays" && !value.days.length ? [1, 2, 3, 4, 5] : t.id === "monthDays" && !value.days.length ? [1] : t.id === value.type ? value.days : value.days,
              })
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {value.type === "weekdays" && (
        <div className="flex justify-between gap-1" role="group" aria-label="Days of week">
          {order.map((d) => (
            <button
              key={d}
              className="chip !px-0"
              aria-pressed={value.days.includes(d)}
              aria-label={WD_FULL[d]}
              onClick={() => onChange({ ...value, days: toggle(value.days.filter((x) => x >= 0 && x <= 6), d) })}
            >
              {WD[d]}
            </button>
          ))}
        </div>
      )}

      {value.type === "timesPerWeek" && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Times per week</span>
          <div className="flex gap-1" role="group" aria-label="Times per week">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button key={n} className="chip !px-0" aria-pressed={value.timesPerWeek === n} onClick={() => onChange({ ...value, timesPerWeek: n })}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.type === "monthDays" && (
        <div className="grid grid-cols-7 gap-1" role="group" aria-label="Days of month">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <button key={d} className="chip !px-0 text-sm" aria-pressed={value.days.includes(d)} onClick={() => onChange({ ...value, days: toggle(value.days, d) })}>
              {d}
            </button>
          ))}
        </div>
      )}

      {value.type === "monthly" && (
        <p className="text-sm text-muted">Once a month, on day {fromKey(startDate).getDate()} (your start date). Short months use the last day.</p>
      )}

      {value.type === "interval" && (
        <label className="flex items-center gap-3 text-sm font-bold">
          Every
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            className="field !w-24 text-center"
            value={value.interval}
            onChange={(e) => onChange({ ...value, interval: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })}
          />
          days
        </label>
      )}
    </div>
  );
}
