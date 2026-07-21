import { useQuery } from "@tanstack/react-query";

import { db } from "@/db/client";
import {
  bragEntries,
  careerGoals,
  promotionMilestones,
  timelineEvents,
} from "@/db/schema";

export function parseTags(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

/** Turns a comma-separated string into a JSON tag array (or null when empty). */
export function serializeTags(input: string): string | null {
  const list = input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return list.length ? JSON.stringify(list) : null;
}

export type TaggedType = "brag" | "goal" | "milestone" | "event";
export type TaggedItem = {
  type: TaggedType;
  id: string;
  title: string;
  tags: string[];
};

export const TAGGED_LABEL: Record<TaggedType, string> = {
  brag: "Win",
  goal: "Goal",
  milestone: "Milestone",
  event: "Event",
};

export const TAGGED_ROUTE: Record<TaggedType, string> = {
  brag: "/brag",
  goal: "/career",
  milestone: "/promotion",
  event: "/timeline",
};

/** Every tagged item across the entities that support tags. */
export function useTaggedItems() {
  return useQuery<TaggedItem[]>({
    queryKey: ["tagged-items"],
    // Tag edits invalidate per-entity keys, not this one — refetch on mount.
    staleTime: 0,
    queryFn: async () => {
      const [b, g, m, e] = await Promise.all([
        db.select().from(bragEntries),
        db.select().from(careerGoals),
        db.select().from(promotionMilestones),
        db.select().from(timelineEvents),
      ]);
      const items: TaggedItem[] = [];
      for (const x of b) items.push({ type: "brag", id: x.id, title: x.title, tags: parseTags(x.tags) });
      for (const x of g) items.push({ type: "goal", id: x.id, title: x.title, tags: parseTags(x.tags) });
      for (const x of m) items.push({ type: "milestone", id: x.id, title: x.title, tags: parseTags(x.tags) });
      for (const x of e) items.push({ type: "event", id: x.id, title: x.title, tags: parseTags(x.tags) });
      return items.filter((i) => i.tags.length > 0);
    },
  });
}
