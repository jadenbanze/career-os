import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  promotionMilestones,
  type NewPromotionMilestone,
  type PromotionMilestone,
} from "@/db/schema";

const KEY = ["promotion"];

export const MILESTONE_STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
] as const;

export function usePromotionMilestones() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () =>
      db
        .select()
        .from(promotionMilestones)
        .orderBy(
          asc(promotionMilestones.position),
          asc(promotionMilestones.createdAt),
        ),
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NewPromotionMilestone> & { title: string }) => {
      await db.insert(promotionMilestones).values(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<PromotionMilestone> & { id: string }) => {
      await db
        .update(promotionMilestones)
        .set(patch)
        .where(eq(promotionMilestones.id, id));
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<PromotionMilestone[]>(KEY);
      if (prev) {
        qc.setQueryData<PromotionMilestone[]>(
          KEY,
          prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(promotionMilestones).where(eq(promotionMilestones.id, id));
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<PromotionMilestone[]>(KEY);
      if (prev) {
        qc.setQueryData<PromotionMilestone[]>(
          KEY,
          prev.filter((m) => m.id !== id),
        );
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
