import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  timelineEvents,
  type NewTimelineEvent,
  type TimelineEvent,
} from "@/db/schema";

const KEY = ["timeline"];

export const EVENT_CATEGORIES = [
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "milestone", label: "Milestone" },
] as const;

export const CATEGORY_TONE: Record<string, string> = {
  work: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  personal: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  milestone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export function useTimelineEvents() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () =>
      db.select().from(timelineEvents).orderBy(desc(timelineEvents.date)),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NewTimelineEvent> & { title: string }) => {
      await db.insert(timelineEvents).values(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<TimelineEvent> & { id: string }) => {
      await db.update(timelineEvents).set(patch).where(eq(timelineEvents.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
