export const TASK_STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
] as const;

export const TASK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]["value"];
export type TaskPriority = (typeof TASK_PRIORITIES)[number]["value"];

export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  high: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  urgent: "bg-red-500/15 text-red-600 dark:text-red-400",
};

/** Colored left accent on cards, keyed by urgency. */
export const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  low: "border-l-transparent",
  medium: "border-l-blue-500/60",
  high: "border-l-amber-500/70",
  urgent: "border-l-red-500/80",
};

/** Small solid dot color for compact urgency cues. */
export const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-muted-foreground/40",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};

export function statusLabel(value: string): string {
  return TASK_STATUSES.find((s) => s.value === value)?.label ?? value;
}
