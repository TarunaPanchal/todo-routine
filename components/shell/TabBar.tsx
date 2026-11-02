"use client";
import { motion } from "framer-motion";
import { BarChart3, CalendarDays, Home, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useUI } from "@/store/useUI";
import { buzz } from "@/lib/haptics";

export function TabBar() {
  const path = usePathname();
  const t = useT();
  const openEditor = useUI((s) => s.openEditor);
  const tabs = [
    { href: "/", label: t("tab.today"), icon: Home },
    { href: "/calendar", label: t("tab.calendar"), icon: CalendarDays },
    null,
    { href: "/reports", label: t("tab.reports"), icon: BarChart3 },
    { href: "/settings", label: t("tab.settings"), icon: Settings },
  ] as const;

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-card/95 backdrop-blur"
    >
      <ul className="grid h-16 grid-cols-5 items-center">
        {tabs.map((tab, i) =>
          tab === null ? (
            <li key="add" className="flex justify-center">
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  buzz(10);
                  openEditor({ showTemplates: true });
                }}
                aria-label={t("tab.add")}
                className="-mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-ink shadow-soft ring-4 ring-bg"
              >
                <Plus size={30} strokeWidth={3} />
              </motion.button>
            </li>
          ) : (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={path === tab.href ? "page" : undefined}
                className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold"
                style={{ color: path === tab.href ? "var(--accent)" : "var(--muted)" }}
              >
                {path === tab.href && (
                  <motion.span layoutId="tab-pill" className="absolute inset-x-3 top-1 h-9 rounded-2xl bg-accent/15" />
                )}
                <tab.icon size={22} className="relative" strokeWidth={path === tab.href ? 2.8 : 2.2} />
                <span className="relative">{tab.label}</span>
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
