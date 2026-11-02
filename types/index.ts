export type DateKey = string; // YYYY-MM-DD, local time zone

export type FrequencyType = "daily" | "weekdays" | "timesPerWeek" | "monthDays" | "monthly" | "interval";

export interface Frequency {
  type: FrequencyType;
  /** weekdays: 0=Sun..6=Sat. monthDays: 1..31 */
  days: number[];
  /** interval: every N days */
  interval: number;
  timesPerWeek: number;
}

export type TargetType = "check" | "count" | "duration";

export interface Target {
  type: TargetType;
  /** check: 1. count: number of units. duration: minutes. */
  value: number;
  /** label for count targets, e.g. "glasses" */
  unit?: string;
}

export interface Subtask {
  id: string;
  title: string;
}

export interface Routine {
  id: string;
  title: string;
  emoji: string;
  color: string;
  category: string;
  note?: string;
  frequency: Frequency;
  target: Target;
  /** HH:mm, optional */
  reminderTime?: string;
  subtasks: Subtask[];
  startDate: DateKey;
  endDate?: DateKey;
  archived: boolean;
  order: number;
  createdAt: string;
}

export type RoutineInput = Omit<Routine, "id" | "order" | "createdAt" | "archived"> & { archived?: boolean };

export interface Completion {
  /** `${routineId}|${date}` */
  id: string;
  routineId: string;
  date: DateKey;
  /** check: 0/1. count: units done. duration: seconds done. */
  value: number;
  skipped: boolean;
  note?: string;
  completedAt?: string;
  subtasksDone?: string[];
}

export type ThemeMode = "light" | "dark" | "auto";
export type PaletteId = "candy" | "mint" | "lavender" | "sky" | "peach";

export interface Settings {
  theme: ThemeMode;
  palette: PaletteId;
  weekStart: 0 | 1 | 6;
  timeFormat: "12" | "24";
  language: string;
  notifications: boolean;
  haptics: boolean;
  userName: string;
}

export interface Profile {
  xp: number;
  level: number;
  badges: string[];
  settings: Settings;
  startedAt: string;
  lastBackupAt: string | null;
  backupSnoozedUntil: string | null;
}

export type CompletionMap = Record<string, Completion>;

export interface PersistedData {
  schemaVersion: number;
  routines: Routine[];
  completions: CompletionMap;
  profile: Profile;
  onboarded: boolean;
  hasDemo: boolean;
}

export type DayStatus = "done" | "skipped" | "pending";

export interface DayEntry {
  routine: Routine;
  completion?: Completion;
  status: DayStatus;
}

export type Period = "week" | "month" | "year";
