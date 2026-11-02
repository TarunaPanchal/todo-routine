"use client";
import { Archive, ArchiveRestore, Copy, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { RoutineInput, TargetType } from "@/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CATEGORIES, COLORS, EMOJIS, TEMPLATES, blankRoutine } from "@/lib/templates";
import { uid } from "@/lib/id";
import { useStore } from "@/store/useStore";
import { useUI } from "@/store/useUI";
import { FrequencyPicker } from "./FrequencyPicker";

export function RoutineEditor() {
  const editor = useUI((s) => s.editor);
  const close = useUI((s) => s.closeEditor);
  // Key resets the form whenever a different routine / fresh sheet opens.
  return (
    <BottomSheet open={!!editor} onClose={close} title={editor?.routineId ? "Edit routine" : "New routine"}>
      {editor && <EditorBody key={editor.routineId ?? "new"} routineId={editor.routineId} showTemplates={!!editor.showTemplates} draft={editor.draft} />}
    </BottomSheet>
  );
}

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="mb-1.5 mt-4 block text-xs font-extrabold uppercase tracking-wider text-muted">
    {children}
  </label>
);

function EditorBody({ routineId, showTemplates, draft }: { routineId?: string; showTemplates: boolean; draft?: RoutineInput }) {
  const existing = useStore((s) => s.routines.find((r) => r.id === routineId));
  const weekStart = useStore((s) => s.profile.settings.weekStart);
  const close = useUI((s) => s.closeEditor);
  const [picking, setPicking] = useState(showTemplates && !existing);
  const [f, setF] = useState<RoutineInput>(() => (existing ? { ...existing, subtasks: existing.subtasks.map((s) => ({ ...s })) } : (draft ?? blankRoutine())));
  const [newSub, setNewSub] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof RoutineInput>(k: K, v: RoutineInput[K]) => setF((p) => ({ ...p, [k]: v }));

  if (picking) {
    return (
      <div className="pb-4">
        <p className="mb-3 text-sm text-muted">Start from a template or build your own.</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => {
            const r = t.make();
            return (
              <button
                key={t.id}
                className="card tint flex min-h-20 flex-col items-start gap-1 p-3 text-left transition-transform active:scale-95"
                style={{ ["--tint" as string]: r.color }}
                onClick={() => {
                  setF(r);
                  setPicking(false);
                }}
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="text-sm font-extrabold">{t.name}</span>
              </button>
            );
          })}
        </div>
        <button className="btn btn-ghost mt-3 w-full" onClick={() => setPicking(false)}>
          ✏️ Blank routine
        </button>
      </div>
    );
  }

  const save = () => {
    const title = f.title.trim();
    if (!title) return setError("Give your routine a name");
    if (f.frequency.type === "weekdays" && !f.frequency.days.length) return setError("Pick at least one weekday");
    if (f.frequency.type === "monthDays" && !f.frequency.days.length) return setError("Pick at least one day of the month");
    if (f.endDate && f.endDate < f.startDate) return setError("End date is before the start date");
    if (f.target.type !== "check" && !(f.target.value > 0)) return setError("Target must be more than 0");
    const clean: RoutineInput = {
      ...f,
      title,
      note: f.note?.trim() || undefined,
      endDate: f.endDate || undefined,
      reminderTime: f.reminderTime || undefined,
      target: f.target.type === "check" ? { type: "check", value: 1 } : { ...f.target, unit: f.target.type === "count" ? f.target.unit?.trim() || undefined : undefined },
    };
    const s = useStore.getState();
    if (existing) s.updateRoutine(existing.id, clean);
    else s.addRoutine(clean);
    useUI.getState().showToast(existing ? "Routine updated ✨" : "Routine created 🎉");
    close();
  };

  const setTarget = (type: TargetType) =>
    set("target", { type, value: type === "check" ? 1 : type === "count" ? 8 : 30, unit: type === "count" ? "times" : undefined });

  return (
    <div className="pb-2">
      {/* Preview + title */}
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl" style={{ background: `color-mix(in oklab, ${f.color} 55%, var(--card))` }}>
          {f.emoji}
        </span>
        <input
          className="field text-lg font-extrabold"
          value={f.title}
          onChange={(e) => {
            set("title", e.target.value);
            setError("");
          }}
          placeholder="Routine name"
          aria-label="Title"
          maxLength={50}
          autoFocus={!existing}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-red-500">
          {error}
        </p>
      )}

      <Label>Emoji</Label>
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS.map((e) => (
          <button key={e} className="chip !px-0 text-xl" aria-pressed={f.emoji === e} aria-label={`Emoji ${e}`} onClick={() => set("emoji", e)}>
            {e}
          </button>
        ))}
        <input className="field !w-16 text-center text-xl" aria-label="Custom emoji" placeholder="＋" maxLength={4} value={EMOJIS.includes(f.emoji) ? "" : f.emoji} onChange={(e) => e.target.value && set("emoji", e.target.value)} />
      </div>

      <Label>Color</Label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
        {COLORS.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={f.color === c}
            aria-label={`Color ${c}`}
            onClick={() => set("color", c)}
            className="h-11 w-11 rounded-full border-4 transition-transform active:scale-90"
            style={{ background: c, borderColor: f.color === c ? "var(--ink)" : "transparent" }}
          />
        ))}
      </div>

      <Label>Category</Label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} className="chip" aria-pressed={f.category === c} onClick={() => set("category", c)}>
            {c}
          </button>
        ))}
      </div>

      <Label>Goal</Label>
      <div className="flex gap-2" role="radiogroup" aria-label="Goal type">
        {(["check", "count", "duration"] as TargetType[]).map((t) => (
          <button key={t} role="radio" aria-checked={f.target.type === t} className="chip flex-1" onClick={() => setTarget(t)}>
            {t === "check" ? "✅ Check" : t === "count" ? "🔢 Count" : "⏱️ Timer"}
          </button>
        ))}
      </div>
      {f.target.type === "count" && (
        <div className="mt-2 flex gap-2">
          <input type="number" inputMode="numeric" min={1} className="field !w-24 text-center" aria-label="Target count" value={f.target.value} onChange={(e) => set("target", { ...f.target, value: Math.max(1, Number(e.target.value) || 1) })} />
          <input className="field" aria-label="Unit" placeholder="unit, e.g. glasses" value={f.target.unit ?? ""} onChange={(e) => set("target", { ...f.target, unit: e.target.value })} maxLength={16} />
        </div>
      )}
      {f.target.type === "duration" && (
        <div className="mt-2 flex items-center gap-2 text-sm font-bold">
          <input type="number" inputMode="numeric" min={1} className="field !w-24 text-center" aria-label="Minutes" value={f.target.value} onChange={(e) => set("target", { ...f.target, value: Math.max(1, Number(e.target.value) || 1) })} />
          minutes
        </div>
      )}

      <Label>Repeat</Label>
      <FrequencyPicker value={f.frequency} onChange={(v) => set("frequency", v)} startDate={f.startDate} weekStart={weekStart} />

      <Label>Checklist (optional)</Label>
      <ul className="space-y-1.5">
        {f.subtasks.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <input className="field" aria-label="Subtask" value={s.title} onChange={(e) => set("subtasks", f.subtasks.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))} />
            <button className="chip !px-0" aria-label={`Remove ${s.title}`} onClick={() => set("subtasks", f.subtasks.filter((x) => x.id !== s.id))}>
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-1.5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newSub.trim()) return;
          set("subtasks", [...f.subtasks, { id: uid(), title: newSub.trim() }]);
          setNewSub("");
        }}
      >
        <input className="field" placeholder="Add a step…" aria-label="New subtask" value={newSub} onChange={(e) => setNewSub(e.target.value)} maxLength={50} />
        <button className="chip !px-0" aria-label="Add subtask" type="submit">
          <Plus size={18} />
        </button>
      </form>

      <Label htmlFor="reminder">Reminder</Label>
      <div className="flex gap-2">
        <input id="reminder" type="time" className="field" value={f.reminderTime ?? ""} onChange={(e) => set("reminderTime", e.target.value || undefined)} />
        {f.reminderTime && (
          <button className="chip !px-0" aria-label="Clear reminder" onClick={() => set("reminderTime", undefined)}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="start">Starts</Label>
          <input id="start" type="date" className="field" value={f.startDate} onChange={(e) => e.target.value && set("startDate", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="end">Ends (optional)</Label>
          <input id="end" type="date" className="field" value={f.endDate ?? ""} onChange={(e) => set("endDate", e.target.value || undefined)} />
        </div>
      </div>

      <Label htmlFor="note">Note</Label>
      <textarea id="note" className="field min-h-20" value={f.note ?? ""} onChange={(e) => set("note", e.target.value)} placeholder="Why does this matter to you?" maxLength={200} />

      <button className="btn mt-5 w-full" onClick={save}>
        {existing ? "Save changes" : "Create routine"}
      </button>

      {existing && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            className="chip"
            onClick={() => {
              useStore.getState().duplicateRoutine(existing.id);
              useUI.getState().showToast("Duplicated 📄");
              close();
            }}
          >
            <Copy size={15} /> Copy
          </button>
          <button
            className="chip"
            onClick={() => {
              useStore.getState().archiveRoutine(existing.id, !existing.archived);
              useUI.getState().showToast(existing.archived ? "Restored" : "Archived 📦");
              close();
            }}
          >
            {existing.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />} {existing.archived ? "Restore" : "Archive"}
          </button>
          {confirmDelete ? (
            <button
              className="chip !bg-red-500 !text-white"
              onClick={() => {
                useStore.getState().deleteRoutine(existing.id);
                useUI.getState().showToast("Deleted");
                close();
              }}
            >
              Confirm
            </button>
          ) : (
            <button className="chip text-red-500" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
