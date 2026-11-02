"use client";
import { useEffect, useState } from "react";
import { todayKey } from "@/lib/date";

/** Current local date key; rolls over at midnight / when app returns to foreground. */
export function useToday(): string {
  const [t, setT] = useState<string>(() => todayKey());
  useEffect(() => {
    const tick = () => setT(todayKey());
    const id = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return t;
}
