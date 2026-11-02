import type { RoutineInput } from "@/types";
import { todayKey } from "./date";

export const COLORS = ["#7fc4ff", "#ffb482", "#ffd66b", "#9ee493", "#6fd6c8", "#4f7fe0", "#a99bff", "#c7a6ff"];
export const CATEGORIES = ["Health", "Mind", "Work", "Home", "Social", "Fun"];
export const EMOJIS = ["🌞", "💧", "🏃", "📚", "🧘", "🛌", "🪥", "🍎", "💊", "🐶", "🧹", "✍️", "🎸", "🌱", "💻", "☕", "🚴", "🥗", "🧴", "🎨"];

export const blankRoutine = (): RoutineInput => ({
  title: "",
  emoji: "🌞",
  color: COLORS[0],
  category: "Health",
  note: "",
  frequency: { type: "daily", days: [], interval: 2, timesPerWeek: 3 },
  target: { type: "check", value: 1 },
  reminderTime: undefined,
  subtasks: [],
  startDate: todayKey(),
  endDate: undefined,
});

export interface Template {
  id: string;
  name: string;
  make: () => RoutineInput;
}

const sub = (titles: string[]) => titles.map((title, i) => ({ id: `t${i}`, title }));

export const TEMPLATES: Template[] = [
  {
    id: "morning",
    name: "Morning",
    make: () => ({
      ...blankRoutine(),
      title: "Morning routine",
      emoji: "🌞",
      color: COLORS[2],
      category: "Health",
      reminderTime: "07:30",
      subtasks: sub(["Make bed", "Brush teeth", "Stretch", "Healthy breakfast"]),
    }),
  },
  {
    id: "workout",
    name: "Workout",
    make: () => ({
      ...blankRoutine(),
      title: "Workout",
      emoji: "🏃",
      color: COLORS[1],
      category: "Health",
      frequency: { type: "weekdays", days: [1, 3, 5], interval: 2, timesPerWeek: 3 },
      target: { type: "duration", value: 30 },
      reminderTime: "18:00",
    }),
  },
  {
    id: "study",
    name: "Study",
    make: () => ({
      ...blankRoutine(),
      title: "Study session",
      emoji: "📚",
      color: COLORS[5],
      category: "Mind",
      frequency: { type: "weekdays", days: [1, 2, 3, 4, 5], interval: 2, timesPerWeek: 3 },
      target: { type: "duration", value: 45 },
    }),
  },
  {
    id: "selfcare",
    name: "Self-care",
    make: () => ({
      ...blankRoutine(),
      title: "Self-care",
      emoji: "🧴",
      color: COLORS[7],
      category: "Mind",
      frequency: { type: "timesPerWeek", days: [], interval: 2, timesPerWeek: 3 },
      subtasks: sub(["Skincare", "Journal", "Quiet time"]),
    }),
  },
  {
    id: "water",
    name: "Water",
    make: () => ({
      ...blankRoutine(),
      title: "Drink water",
      emoji: "💧",
      color: COLORS[4],
      category: "Health",
      target: { type: "count", value: 8, unit: "glasses" },
    }),
  },
  {
    id: "sleep",
    name: "Sleep",
    make: () => ({
      ...blankRoutine(),
      title: "Wind down & sleep",
      emoji: "🛌",
      color: COLORS[6],
      category: "Health",
      reminderTime: "22:30",
      subtasks: sub(["Screens off", "Prep tomorrow", "Lights out"]),
    }),
  },
];
