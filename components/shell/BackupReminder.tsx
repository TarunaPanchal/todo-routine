"use client";
import { differenceInDays } from "date-fns";
import { DatabaseBackup } from "lucide-react";
import { backupFilename, download, toBackupJson } from "@/lib/export";
import { selectData, useStore } from "@/store/useStore";

/** Gentle nudge every 14 days to export a backup (data only lives on this device). */
export function BackupReminder() {
  const profile = useStore((s) => s.profile);
  const hasData = useStore((s) => s.routines.length > 0);
  const last = new Date(profile.lastBackupAt ?? profile.startedAt);
  const snoozed = profile.backupSnoozedUntil && new Date(profile.backupSnoozedUntil) > new Date();
  if (!hasData || snoozed || differenceInDays(new Date(), last) < 14) return null;

  return (
    <div className="card mx-5 mt-4 flex items-center gap-3 p-3">
      <DatabaseBackup className="shrink-0 text-accent" />
      <p className="flex-1 text-sm font-bold">It&apos;s been a while. Save a backup of your routines?</p>
      <button
        className="btn !min-h-11 !px-3 text-sm"
        onClick={() => {
          download(backupFilename("json"), toBackupJson(selectData(useStore.getState())));
          useStore.getState().markBackup();
        }}
      >
        Back up
      </button>
      <button className="chip text-xs" onClick={() => useStore.getState().snoozeBackup(3)}>
        Later
      </button>
    </div>
  );
}
