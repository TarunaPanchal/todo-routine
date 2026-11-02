"use client";
import { useStore } from "@/store/useStore";
import { useHydrated } from "@/hooks/useHydrated";
import { ScreenSkeleton } from "@/components/ui/Skeleton";
import { TabBar } from "./TabBar";
import { Onboarding } from "./Onboarding";
import { InstallBanner } from "./InstallBanner";
import { BadgeUnlock } from "./BadgeUnlock";
import { Toast } from "./Toast";
import { RoutineEditor } from "@/components/routines/RoutineEditor";
import { SkipSheet } from "@/components/today/SkipSheet";
import { DaySheet } from "@/components/calendar/DaySheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const onboarded = useStore((s) => s.onboarded);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md pb-28">
      {!hydrated ? (
        <ScreenSkeleton />
      ) : !onboarded ? (
        <Onboarding />
      ) : (
        <>
          <main>{children}</main>
          <InstallBanner />
          <TabBar />
          <DaySheet />
          <RoutineEditor />
          <SkipSheet />
          <BadgeUnlock />
          <Toast />
        </>
      )}
    </div>
  );
}
