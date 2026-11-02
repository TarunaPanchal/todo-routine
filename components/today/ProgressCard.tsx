"use client";
import { motion } from "framer-motion";
import { Mascot, moodFor } from "@/components/ui/Mascot";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { xpForLevel } from "@/lib/gamification";
import { useStore } from "@/store/useStore";

interface Props {
  done: number;
  total: number;
  isToday: boolean;
}

const LINES: Record<string, string> = {
  sleepy: "Bubu is waiting for you…",
  curious: "Nice start! Keep going 🌱",
  happy: "Almost there, you're doing great!",
  party: "All done! Bubu is so proud 🎉",
};

export function ProgressCard({ done, total, isToday }: Props) {
  const xp = useStore((s) => s.profile.xp);
  const level = useStore((s) => s.profile.level);
  const pct = total ? done / total : null;
  const mood = moodFor(pct);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  const lvlPct = (xp - from) / Math.max(1, to - from);

  return (
    <div className="card mx-5 mt-4 p-4">
      <div className="flex items-center gap-4">
        <ProgressRing value={pct ?? 0} size={92} label="Day completion">
          <span className="text-xl font-black">{Math.round((pct ?? 0) * 100)}%</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{isToday ? "Today's progress" : "Progress"}</p>
          <p className="text-lg font-black">
            {total === 0 ? "Free day" : `${done} of ${total} done`}
          </p>
          <p className="text-sm font-semibold text-muted">{total === 0 ? "Enjoy the rest 🌤️" : LINES[mood]}</p>
        </div>
        <Mascot mood={mood} size={72} />
      </div>
      <div className="mt-3 flex items-center gap-2" aria-label={`Level ${level}, ${xp} XP`}>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-extrabold">Lv {level}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full rounded-full bg-accent" initial={false} animate={{ width: `${Math.max(3, lvlPct * 100)}%` }} />
        </div>
        <span className="text-xs font-bold text-muted">{xp} XP</span>
      </div>
    </div>
  );
}
