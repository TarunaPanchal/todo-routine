"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Mascot, type Mood } from "@/components/ui/Mascot";
import { useStore } from "@/store/useStore";

const SLIDES: { mood: Mood; title: string; body: string }[] = [
  { mood: "happy", title: "Meet Bubu!", body: "Build tiny daily habits. Bubu cheers you on and gets happier with every check ✨" },
  { mood: "curious", title: "Any rhythm you like", body: "Daily, certain weekdays, 3× a week, monthly or every N days. Count glasses of water or time a workout." },
  { mood: "party", title: "Private & offline", body: "Everything stays on your device. No account, no cloud. Install it to your home screen and go!" },
];

export function Onboarding() {
  const [i, setI] = useState(0);
  const finish = useStore((s) => s.completeOnboarding);
  const loadDemo = useStore((s) => s.loadDemo);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-8 pt-10">
      <div className="flex justify-end">
        <button className="min-h-11 px-3 text-sm font-bold text-muted" onClick={finish}>
          Skip
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 && i < SLIDES.length - 1) setI(i + 1);
              if (info.offset.x > 60 && i > 0) setI(i - 1);
            }}
            className="flex flex-col items-center"
          >
            <Mascot mood={s.mood} size={170} />
            <h1 className="mt-6 text-3xl font-black">{s.title}</h1>
            <p className="mt-3 max-w-xs text-base font-semibold text-muted">{s.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mb-5 flex justify-center gap-2" role="tablist" aria-label="Slides">
        {SLIDES.map((_, k) => (
          <button
            key={k}
            role="tab"
            aria-selected={k === i}
            aria-label={`Slide ${k + 1}`}
            onClick={() => setI(k)}
            className="flex h-6 w-6 items-center justify-center"
          >
            <span className="h-2.5 rounded-full transition-all" style={{ width: k === i ? 26 : 10, background: k === i ? "var(--accent)" : "var(--line)" }} />
          </button>
        ))}
      </div>
      {last ? (
        <div className="space-y-2">
          <button className="btn w-full" onClick={finish}>
            Let&apos;s start 🌱
          </button>
          <button
            className="btn btn-ghost w-full"
            onClick={() => {
              loadDemo();
              finish();
            }}
          >
            Explore with demo data
          </button>
        </div>
      ) : (
        <button className="btn w-full" onClick={() => setI(i + 1)}>
          Next
        </button>
      )}
    </div>
  );
}
