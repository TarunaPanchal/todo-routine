"use client";
import { fmt, todayKey } from "@/lib/date";
import { useT } from "@/lib/i18n";
import { useStore } from "@/store/useStore";

export function Greeting() {
  const t = useT();
  const name = useStore((s) => s.profile.settings.userName);
  const h = new Date().getHours();
  const g = h < 12 ? t("today.goodMorning") : h < 18 ? t("today.goodAfternoon") : t("today.goodEvening");
  return (
    <div>
      <p className="text-sm font-bold text-muted">{fmt(todayKey(), "EEEE, MMMM d")}</p>
      <h1 className="text-2xl font-black tracking-tight">
        {g}
        {name ? `, ${name}` : ""} 👋
      </h1>
    </div>
  );
}
