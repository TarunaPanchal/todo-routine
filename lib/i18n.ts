import { useStore } from "@/store/useStore";

const en = {
  "tab.today": "Today",
  "tab.calendar": "Calendar",
  "tab.add": "Add routine",
  "tab.reports": "Reports",
  "tab.settings": "Settings",
  "today.goodMorning": "Good morning",
  "today.goodAfternoon": "Good afternoon",
  "today.goodEvening": "Good evening",
  "today.progress": "Today's progress",
  "today.empty.title": "Nothing planned",
  "today.empty.body": "Add a routine and start building your streak!",
  "today.noneToday": "No routines scheduled for this day",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.done": "Done",
  "settings.title": "Settings",
  "settings.appearance": "Appearance",
  "settings.theme": "Theme",
  "settings.palette": "Palette",
  "settings.preferences": "Preferences",
  "settings.weekStart": "Week starts on",
  "settings.timeFormat": "Time format",
  "settings.language": "Language",
  "settings.notifications": "Reminders",
  "settings.data": "Your data",
  "reports.title": "Insights",
  "calendar.title": "Calendar",
} as const;

export type I18nKey = keyof typeof en;
type Dict = Partial<Record<I18nKey, string>>;

/** Add a language by dropping another Dict here and listing it in LANGUAGES. */
const dictionaries: Record<string, Dict> = { en };
export const LANGUAGES = [{ code: "en", label: "English" }];

export function translate(lang: string, key: I18nKey, vars?: Record<string, string | number>): string {
  let s = dictionaries[lang]?.[key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function useT() {
  const lang = useStore((s) => s.profile.settings.language);
  return (key: I18nKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
