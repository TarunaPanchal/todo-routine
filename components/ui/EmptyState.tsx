"use client";
import { Mascot, type Mood } from "./Mascot";

export function EmptyState({ title, body, action, mood = "sleepy" }: { title: string; body: string; action?: React.ReactNode; mood?: Mood }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <Mascot mood={mood} size={120} />
      <h3 className="mt-3 text-lg font-extrabold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
