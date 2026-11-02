"use client";
import { motion } from "framer-motion";

export type Mood = "sleepy" | "curious" | "happy" | "party";

export const moodFor = (pct: number | null): Mood => (pct === null || pct === 0 ? "sleepy" : pct < 0.5 ? "curious" : pct < 1 ? "happy" : "party");

/** "Bubu" the blob. Face changes with the day's progress. */
export function Mascot({ mood, size = 88 }: { mood: Mood; size?: number }) {
  const eyes =
    mood === "sleepy" ? (
      <g stroke="#3b2f3f" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M30 50 q6 5 12 0" />
        <path d="M58 50 q6 5 12 0" />
      </g>
    ) : mood === "party" ? (
      <g stroke="#3b2f3f" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M30 52 q6 -9 12 0" />
        <path d="M58 52 q6 -9 12 0" />
      </g>
    ) : (
      <g fill="#3b2f3f">
        <circle cx="36" cy="50" r={mood === "curious" ? 5 : 4.2} />
        <circle cx="64" cy="50" r={mood === "curious" ? 5 : 4.2} />
        <circle cx="37.6" cy="48.4" r="1.5" fill="#fff" />
        <circle cx="65.6" cy="48.4" r="1.5" fill="#fff" />
      </g>
    );
  const mouth =
    mood === "sleepy" ? (
      <ellipse cx="50" cy="64" rx="3" ry="2.4" fill="#3b2f3f" />
    ) : mood === "curious" ? (
      <path d="M44 64 q6 3 12 0" stroke="#3b2f3f" strokeWidth="3" fill="none" strokeLinecap="round" />
    ) : mood === "happy" ? (
      <path d="M41 62 q9 10 18 0" stroke="#3b2f3f" strokeWidth="3" fill="none" strokeLinecap="round" />
    ) : (
      <path d="M40 61 q10 15 20 0z" fill="#3b2f3f" />
    );
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`Bubu the mascot looks ${mood}`}
      animate={mood === "party" ? { y: [0, -8, 0], rotate: [-4, 4, -4] } : mood === "sleepy" ? { y: [0, 2, 0] } : { y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: mood === "party" ? 0.8 : 2.6, ease: "easeInOut" }}
    >
      <path d="M50 18 q-6 -14 8 -16 q2 12 -8 16z" fill="#8be28b" />
      <ellipse cx="50" cy="58" rx="38" ry="34" fill="var(--accent)" />
      <ellipse cx="50" cy="58" rx="38" ry="34" fill="#fff" opacity="0.35" />
      <ellipse cx="26" cy="62" rx="6" ry="4" fill="#7fc4ff" opacity="0.8" />
      <ellipse cx="74" cy="62" rx="6" ry="4" fill="#7fc4ff" opacity="0.8" />
      {eyes}
      {mouth}
      {mood === "sleepy" && (
        <text x="76" y="30" fontSize="12" fontWeight="800" fill="var(--muted)">
          z<tspan fontSize="9">z</tspan>
        </text>
      )}
      {mood === "party" && (
        <text x="70" y="26" fontSize="16">
          🎉
        </text>
      )}
    </motion.svg>
  );
}
