"use client";
import { Reorder, useDragControls } from "framer-motion";
import { ArrowLeft, GripVertical, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Routine } from "@/types";
import { useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";

function Row({ r }: { r: Routine }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={r} dragListener={false} dragControls={controls} className="card tint flex items-center gap-2 p-2 pr-3" style={{ ["--tint" as string]: r.color, opacity: r.archived ? 0.6 : 1 }}>
      <button className="flex h-12 w-11 shrink-0 cursor-grab touch-none items-center justify-center text-muted" aria-label={`Drag to reorder ${r.title}`} onPointerDown={(e) => controls.start(e)}>
        <GripVertical size={20} />
      </button>
      <span className="text-2xl">{r.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold">{r.title}</p>
        <p className="text-xs font-bold text-muted">
          {r.category}
          {r.archived ? " · archived" : ""}
        </p>
      </div>
      <button className="chip !px-0" aria-label={`Edit ${r.title}`} onClick={() => useUI.getState().openEditor({ routineId: r.id })}>
        <Pencil size={16} />
      </button>
    </Reorder.Item>
  );
}

export default function RoutinesPage() {
  const routines = useStore((s) => s.routines);
  const reorder = useStore((s) => s.reorderRoutines);
  const [showArchived, setShowArchived] = useState(false);
  const active = routines.filter((r) => !r.archived);
  const archived = routines.filter((r) => r.archived);

  return (
    <div>
      <PageHeader
        title="My routines"
        sub="Drag the handle to reorder"
        right={
          <Link href="/" className="chip !px-0" aria-label="Back">
            <ArrowLeft size={18} />
          </Link>
        }
      />
      {active.length === 0 ? (
        <EmptyState title="No routines yet" body="Create one with the + button." action={<button className="btn" onClick={() => useUI.getState().openEditor({ showTemplates: true })}>Add routine</button>} />
      ) : (
        <Reorder.Group axis="y" values={active} onReorder={(v) => reorder(v.map((r) => r.id))} className="space-y-2 px-5">
          {active.map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </Reorder.Group>
      )}
      {archived.length > 0 && (
        <div className="mt-5 px-5">
          <button className="min-h-11 text-sm font-extrabold text-muted" onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? "Hide" : "Show"} archived ({archived.length})
          </button>
          {showArchived && (
            <ul className="mt-2 space-y-2">
              {archived.map((r) => (
                <li key={r.id} className="card tint flex items-center gap-3 p-3 opacity-70" style={{ ["--tint" as string]: r.color }}>
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="flex-1 truncate font-extrabold">{r.title}</span>
                  <button className="chip" onClick={() => useStore.getState().archiveRoutine(r.id, false)}>Restore</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
