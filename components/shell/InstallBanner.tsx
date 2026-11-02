"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { isIOS, isStandalone } from "@/lib/notifications";
import { useUI } from "@/store/useUI";

const DISMISS_KEY = "rb-install-dismissed";

type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallBanner() {
  const prompt = useUI((s) => s.installPrompt) as DeferredPrompt | null;
  const setPrompt = useUI((s) => s.setInstallPrompt);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = Number(localStorage.getItem(DISMISS_KEY) ?? 0) > Date.now();
    } catch {}
    setHidden(dismissed || isStandalone());
    setIos(isIOS());
  }, []);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 864e5));
    } catch {}
  };

  const show = !hidden && (prompt || ios);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed inset-x-3 bottom-24 z-30 mx-auto max-w-md"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="card flex items-center gap-3 p-3">
            <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-extrabold">Install RoutineBuddy</p>
              {prompt ? (
                <p className="text-muted">Add it to your home screen for quick, offline access.</p>
              ) : (
                <p className="text-muted">
                  Tap <Share size={13} className="inline -mt-0.5" /> Share, then <b>Add to Home Screen</b>.
                </p>
              )}
            </div>
            {prompt && (
              <button
                className="btn !min-h-11 !px-3"
                onClick={async () => {
                  await prompt.prompt();
                  await prompt.userChoice;
                  setPrompt(null);
                }}
              >
                <Download size={16} /> Install
              </button>
            )}
            <button className="chip !px-0" aria-label="Dismiss install banner" onClick={dismiss}>
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
