import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db/client";
import { bragEntries, dailyNotes, tasks, timelineEvents } from "@/db/schema";

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayBounds(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Wins logged, tasks completed, and events dated today. */
export function useTodayRollup() {
  return useQuery({
    queryKey: ["today", "rollup"],
    staleTime: 0,
    queryFn: async () => {
      const { start, end } = dayBounds();
      const [wins, doneTasks, events] = await Promise.all([
        db
          .select()
          .from(bragEntries)
          .where(and(gte(bragEntries.date, start), lte(bragEntries.date, end))),
        db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.status, "done"),
              gte(tasks.updatedAt, start),
              lte(tasks.updatedAt, end),
            ),
          ),
        db
          .select()
          .from(timelineEvents)
          .where(and(gte(timelineEvents.date, start), lte(timelineEvents.date, end))),
      ]);
      return { wins, doneTasks, events };
    },
  });
}

export function useDailyNote(date: string) {
  return useQuery({
    queryKey: ["daily-note", date],
    queryFn: async () => {
      const rows = await db.select().from(dailyNotes).where(eq(dailyNotes.date, date));
      return rows[0] ?? null;
    },
  });
}

export function useSaveDailyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, notes }: { date: string; notes: string }) => {
      const existing = await db
        .select()
        .from(dailyNotes)
        .where(eq(dailyNotes.date, date));
      if (existing.length) {
        await db
          .update(dailyNotes)
          .set({ notes, updatedAt: new Date() })
          .where(eq(dailyNotes.date, date));
      } else {
        await db.insert(dailyNotes).values({ date, notes, updatedAt: new Date() });
      }
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["daily-note", v.date] }),
  });
}
