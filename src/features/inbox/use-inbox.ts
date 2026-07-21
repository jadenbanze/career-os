import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  bragEntries,
  careerGoals,
  feedback,
  inboxItems,
  promotionMilestones,
  tasks,
  timelineEvents,
} from "@/db/schema";
import {
  categorizeWithAi,
  heuristicCategorize,
  isAiEnabled,
  type AiSuggestion,
  type InboxCategory,
} from "@/features/ai/use-ai";

const KEY = ["inbox", "pending"];

export function useInboxItems() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () =>
      db
        .select()
        .from(inboxItems)
        .where(eq(inboxItems.status, "pending"))
        .orderBy(desc(inboxItems.createdAt)),
  });
}

/** Runs AI (or heuristic fallback) and writes the suggestion onto the item. */
export async function enrichInbox(id: string, text: string): Promise<void> {
  let suggestion: AiSuggestion;
  let state: "done" | "error" = "done";
  try {
    suggestion = (await isAiEnabled())
      ? await categorizeWithAi(text)
      : heuristicCategorize(text);
  } catch {
    // AI unreachable/off — fall back to the heuristic so the item is still usable.
    suggestion = heuristicCategorize(text);
    state = "error";
  }
  await db
    .update(inboxItems)
    .set({
      aiState: state,
      category: suggestion.category,
      title: suggestion.title,
      details: suggestion.details,
      size: suggestion.size,
      tags: suggestion.tags.length ? JSON.stringify(suggestion.tags) : null,
    })
    .where(eq(inboxItems.id, id));
}

export function useEnrichInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      await db.update(inboxItems).set({ aiState: "loading" }).where(eq(inboxItems.id, id));
      qc.invalidateQueries({ queryKey: KEY });
      await enrichInbox(id, text);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDismissInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(inboxItems).where(eq(inboxItems.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export type FilePayload = {
  id: string;
  category: InboxCategory;
  title: string;
  details: string;
  size: string | null;
  tags: string[];
};

/** Creates the real record in the chosen section, then removes the inbox item. */
export function useFileInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: FilePayload) => {
      const now = new Date();
      const title = item.title.trim() || "(untitled)";
      const details = item.details.trim() || null;
      const tagsJson = item.tags.length ? JSON.stringify(item.tags) : null;

      switch (item.category) {
        case "task":
          await db.insert(tasks).values({ title, description: details });
          break;
        case "event":
          await db
            .insert(timelineEvents)
            .values({ title, date: now, category: "work", notes: details });
          break;
        case "goal":
          await db.insert(careerGoals).values({ title, notes: details });
          break;
        case "feedback":
          await db
            .insert(feedback)
            .values({ content: details ?? title, source: null, date: now });
          break;
        case "milestone":
          await db.insert(promotionMilestones).values({ title, notes: details });
          break;
        case "win":
        default:
          await db.insert(bragEntries).values({
            title,
            description: details,
            size: item.size,
            date: now,
            tags: tagsJson,
          });
          break;
      }

      await db.delete(inboxItems).where(eq(inboxItems.id, item.id));
    },
    onSuccess: () => {
      // The filed record could land in any section — refresh everything.
      qc.invalidateQueries();
    },
  });
}

/** Marks any stuck "loading" items as errored (e.g. after an app restart). */
export async function reconcileStuckInbox(): Promise<void> {
  await db
    .update(inboxItems)
    .set({ aiState: "error" })
    .where(and(eq(inboxItems.status, "pending"), eq(inboxItems.aiState, "loading")));
}
