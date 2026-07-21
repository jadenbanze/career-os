import { save } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { addDays, format } from "date-fns";
import { isNotNull } from "drizzle-orm";

import { db } from "@/db/client";
import { promotionMilestones, tasks, timelineEvents } from "@/db/schema";

export type CalEvent = {
  uid: string;
  title: string;
  date: Date;
  description?: string;
  location?: string;
};

function escapeText(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function stamp(d: Date): string {
  // e.g. 20260721T153711Z
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Builds a Google Calendar "create event" URL (no API/OAuth — opens a prefilled form). */
export function googleCalendarUrl(ev: CalEvent): string {
  const start = format(ev.date, "yyyyMMdd");
  const end = format(addDays(ev.date, 1), "yyyyMMdd");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${start}/${end}`,
  });
  if (ev.description) params.set("details", ev.description);
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Serializes events to an all-day iCalendar (.ics) string. */
export function toIcs(events: CalEvent[]): string {
  const now = stamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Career OS//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const ev of events) {
    const start = format(ev.date, "yyyyMMdd");
    const end = format(addDays(ev.date, 1), "yyyyMMdd");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}@careeros`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeText(ev.title)}`,
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Opens a prefilled Google Calendar create-event page. */
export function addToGoogleCalendar(ev: CalEvent): Promise<void> {
  return openUrl(googleCalendarUrl(ev));
}

/** Writes a one-event .ics to app data and opens it (Apple Calendar on macOS). */
export async function addToAppleCalendar(ev: CalEvent): Promise<void> {
  const name = `careeros-event-${ev.uid}.ics`;
  await writeTextFile(name, toIcs([ev]), { baseDir: BaseDirectory.AppLocalData });
  const full = await join(await appLocalDataDir(), name);
  await openPath(full);
}

/**
 * Exports every dated item (timeline events + tasks/milestones with due dates)
 * as one .ics the user can import into any calendar. Returns false if cancelled.
 */
export async function exportCalendarIcs(): Promise<boolean> {
  const [events, dueTasks, dueMilestones] = await Promise.all([
    db.select().from(timelineEvents),
    db.select().from(tasks).where(isNotNull(tasks.dueDate)),
    db.select().from(promotionMilestones).where(isNotNull(promotionMilestones.dueDate)),
  ]);

  const cal: CalEvent[] = [
    ...events.map((e) => ({
      uid: e.id,
      title: e.title,
      date: new Date(e.date),
      description: e.notes ?? undefined,
    })),
    ...dueTasks.map((t) => ({
      uid: `task-${t.id}`,
      title: `Task due: ${t.title}`,
      date: new Date(t.dueDate!),
      description: t.description ?? undefined,
    })),
    ...dueMilestones.map((m) => ({
      uid: `milestone-${m.id}`,
      title: `Milestone: ${m.title}`,
      date: new Date(m.dueDate!),
      description: m.notes ?? undefined,
    })),
  ];

  const path = await save({
    defaultPath: `career-os-${format(new Date(), "yyyy-MM-dd")}.ics`,
    filters: [{ name: "iCalendar", extensions: ["ics"] }],
  });
  if (!path) return false;
  await writeTextFile(path, toIcs(cal));
  return true;
}
