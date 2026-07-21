import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  bragEntries,
  careerGoals,
  feedback,
  links,
  oneOnOnes,
  promotionMilestones,
  tasks,
  timelineEvents,
  type Link,
} from "@/db/schema";

export const ENTITY_TYPES = [
  "task",
  "brag",
  "goal",
  "milestone",
  "event",
  "feedback",
  "oneonone",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_LABEL: Record<EntityType, string> = {
  task: "Task",
  brag: "Win",
  goal: "Goal",
  milestone: "Milestone",
  event: "Event",
  feedback: "Feedback",
  oneonone: "1:1",
};

/** Route each entity type lives on, for click-through navigation. */
export const ENTITY_ROUTE: Record<EntityType, string> = {
  task: "/tasks",
  brag: "/brag",
  goal: "/growth",
  milestone: "/growth",
  event: "/timeline",
  feedback: "/feedback",
  oneonone: "/feedback",
};

export type Linkable = { type: EntityType; id: string; title: string };

/** A flat, searchable list of everything that can be linked. */
export function useLinkables() {
  return useQuery<Linkable[]>({
    queryKey: ["linkables"],
    queryFn: async () => {
      const [t, b, g, m, e, f, o] = await Promise.all([
        db.select().from(tasks),
        db.select().from(bragEntries),
        db.select().from(careerGoals),
        db.select().from(promotionMilestones),
        db.select().from(timelineEvents),
        db.select().from(feedback),
        db.select().from(oneOnOnes),
      ]);
      return [
        ...t.map((x) => ({ type: "task" as const, id: x.id, title: x.title })),
        ...b.map((x) => ({ type: "brag" as const, id: x.id, title: x.title })),
        ...g.map((x) => ({ type: "goal" as const, id: x.id, title: x.title })),
        ...m.map((x) => ({ type: "milestone" as const, id: x.id, title: x.title })),
        ...e.map((x) => ({ type: "event" as const, id: x.id, title: x.title })),
        ...f.map((x) => ({
          type: "feedback" as const,
          id: x.id,
          title: (x.content ?? "").slice(0, 60) || "Feedback",
        })),
        ...o.map((x) => ({
          type: "oneonone" as const,
          id: x.id,
          title: x.person ? `1:1 with ${x.person}` : "1:1",
        })),
      ];
    },
  });
}

export function useLinks() {
  return useQuery<Link[]>({
    queryKey: ["links"],
    queryFn: async () => db.select().from(links),
  });
}

export type RelatedLink = { linkId: string; type: EntityType; id: string };

/** All items linked to (type,id), scanning both edge directions. */
export function relatedFor(all: Link[], type: EntityType, id: string): RelatedLink[] {
  const out: RelatedLink[] = [];
  for (const l of all) {
    if (l.sourceType === type && l.sourceId === id) {
      out.push({ linkId: l.id, type: l.targetType as EntityType, id: l.targetId });
    } else if (l.targetType === type && l.targetId === id) {
      out.push({ linkId: l.id, type: l.sourceType as EntityType, id: l.sourceId });
    }
  }
  return out;
}

export function useAddLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (l: {
      sourceType: EntityType;
      sourceId: string;
      targetType: EntityType;
      targetId: string;
    }) => {
      if (l.sourceType === l.targetType && l.sourceId === l.targetId) return;
      await db.insert(links).values(l);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  });
}

export function useRemoveLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(links).where(eq(links.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  });
}
