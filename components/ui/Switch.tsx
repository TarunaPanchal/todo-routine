"use client";
import { motion } from "framer-motion";

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-16 shrink-0 items-center"
    >
      <span className="relative h-8 w-14 rounded-full transition-colors" style={{ background: checked ? "var(--accent)" : "var(--line)" }}>
        <motion.span
          className="absolute top-1 h-6 w-6 rounded-full bg-white shadow"
          animate={{ left: checked ? 28 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </span>
    </button>
  );
}
