"use client";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";

export function SkipSheet() {
  const target = useUI((s) => s.skipTarget);
  const close = () => useUI.getState().openSkip(null);
  const routine = useStore((s) => s.routines.find((r) => r.id === target?.routineId));
  const [note, setNote] = useState("");
  useEffect(() => setNote(""), [target]);

  return (
    <BottomSheet
      open={!!target && !!routine}
      onClose={close}
      title={`Skip ${routine?.emoji ?? ""} ${routine?.title ?? ""}`}
      footer={
        <button
          className="btn w-full"
          onClick={() => {
            if (target) useStore.getState().skip(target.routineId, target.date, note);
            close();
            useUI.getState().showToast("Skipped. Your streak is safe 💛");
          }}
        >
          Skip for today
        </button>
      }
    >
      <p className="mb-3 text-sm text-muted">Skipping never breaks your streak and doesn&apos;t count against your completion rate.</p>
      <label className="mb-1 block text-sm font-bold" htmlFor="skip-note">
        Note (optional)
      </label>
      <input id="skip-note" className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Feeling sick, travelling…" maxLength={80} />
    </BottomSheet>
  );
}
