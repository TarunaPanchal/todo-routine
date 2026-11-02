"use client";
import { useEffect } from "react";
import { format } from "date-fns";
import { useStore } from "@/store/useStore";
import { entriesForDay } from "@/lib/schedule";
import { todayKey } from "@/lib/date";
import { showNotification } from "@/lib/notifications";

/**
 * Foreground reminders: while the app (or its service worker) is alive, fire a notification at each
 * routine's reminderTime if it is still pending. True background push needs a server, which this app avoids.
 */
export function useReminders() {
  useEffect(() => {
    const fired = new Set<string>();
    const check = () => {
      const s = useStore.getState();
      if (!s.profile.settings.notifications || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const now = new Date();
      const hhmm = format(now, "HH:mm");
      const today = todayKey();
      const entries = entriesForDay(s.routines, s.completions, today, today, s.profile.settings.weekStart);
      for (const e of entries) {
        const r = e.routine;
        if (!r.reminderTime || e.status !== "pending" || r.reminderTime > hhmm) continue;
        // only within a 10 minute window so reopening the app doesn't spam old reminders
        const [h, m] = r.reminderTime.split(":").map(Number);
        if (now.getHours() * 60 + now.getMinutes() - (h * 60 + m) > 10) continue;
        const k = `${today}|${r.id}`;
        if (fired.has(k)) continue;
        fired.add(k);
        showNotification(`${r.emoji} ${r.title}`, "Time for your routine!", k);
      }
    };
    const id = setInterval(check, 30_000);
    check();
    return () => clearInterval(id);
  }, []);
}
