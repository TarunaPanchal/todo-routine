"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { badgeById } from "@/lib/gamification";
import { celebrate } from "@/lib/confetti";
import { buzz } from "@/lib/haptics";
import { useUI } from "@/store/useUI";

export function BadgeUnlock() {
  const id = useUI((s) => s.badgeQueue[0]);
  const shift = useUI((s) => s.shiftBadge);
  const badge = id ? badgeById(id) : undefined;

  useEffect(() => {
    if (!badge) return;
    celebrate(false);
    buzz([20, 40, 20]);
  }, [badge]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          key={badge.id}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={shift}
        >
          <motion.div
            role="alertdialog"
            aria-label={`Badge unlocked: ${badge.title}`}
            className="card w-full max-w-xs p-6 text-center"
            initial={{ scale: 0.4, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-extrabold uppercase tracking-widest text-accent">Badge unlocked!</p>
            <motion.div
              className="my-3 text-7xl"
              animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.9, delay: 0.2 }}
            >
              {badge.emoji}
            </motion.div>
            <h2 className="text-xl font-black">{badge.title}</h2>
            <p className="mt-1 text-sm text-muted">{badge.desc}</p>
            <button className="btn mt-5 w-full" onClick={shift} autoFocus>
              Yay!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
