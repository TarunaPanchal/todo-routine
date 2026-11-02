"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useUI } from "@/store/useUI";

export function Toast() {
  const toast = useUI((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => useUI.setState({ toast: null }), 2400);
    return () => clearTimeout(id);
  }, [toast]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-bg shadow-soft"
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
