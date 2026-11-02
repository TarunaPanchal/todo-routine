"use client";
import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";
import { useReminders } from "@/hooks/useReminders";

function ThemeApplier() {
  const theme = useStore((s) => s.profile.settings.theme);
  const palette = useStore((s) => s.profile.settings.palette);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = palette;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "auto" && mq.matches);
      root.classList.toggle("dark", dark);
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", dark ? "#0f1925" : "#f3f9ff"));
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme, palette]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useStore.persist.rehydrate();
    const onPrompt = (e: Event) => {
      e.preventDefault();
      useUI.getState().setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  useReminders();
  return (
    <MotionConfig reducedMotion="user">
      <ThemeApplier />
      {children}
    </MotionConfig>
  );
}
