"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

/** True once persisted state is loaded; render placeholders until then to avoid SSR mismatch. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setH(true));
    if (useStore.persist.hasHydrated()) setH(true);
    return unsub;
  }, []);
  return h;
}
