import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { format, isPast, isToday, isTomorrow } from "date-fns";

import { db } from "@/db/client";
import { tasks, timelineEvents } from "@/db/schema";
import { getSetting, setSetting } from "@/features/settings/use-settings";

const LAST_RUN_KEY = "reminders_last_run";

/**
 * Fires local notifications for upcoming timeline events, due/overdue tasks,
 * and a Friday "log a win" nudge. Runs at most once per day.
 */
export async function runReminders(): Promise<void> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      granted = (await requestPermission()) === "granted";
    }
    if (!granted) return;

    const today = format(new Date(), "yyyy-MM-dd");
    if ((await getSetting(LAST_RUN_KEY)) === today) return;

    const [events, allTasks] = await Promise.all([
      db.select().from(timelineEvents),
      db.select().from(tasks),
    ]);

    const soon = events.filter((e) => {
      const d = new Date(e.date);
      return isToday(d) || isTomorrow(d);
    });
    if (soon.length > 0) {
      sendNotification({
        title: "Upcoming events",
        body: soon.slice(0, 3).map((e) => e.title).join(", "),
      });
    }

    const due = allTasks.filter(
      (t) =>
        t.status !== "done" &&
        t.dueDate &&
        (isToday(new Date(t.dueDate)) || isPast(new Date(t.dueDate))),
    );
    if (due.length > 0) {
      sendNotification({
        title: `${due.length} task${due.length === 1 ? "" : "s"} due`,
        body: due.slice(0, 3).map((t) => t.title).join(", "),
      });
    }

    // Friday nudge to log a win.
    if (new Date().getDay() === 5) {
      sendNotification({
        title: "Weekly check-in",
        body: "Log a win from this week on your brag sheet.",
      });
    }

    await setSetting(LAST_RUN_KEY, today);
  } catch (e) {
    console.error("Reminders failed", e);
  }
}
