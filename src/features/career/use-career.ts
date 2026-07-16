import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { careerGoals, type CareerGoal, type NewCareerGoal } from "@/db/schema";

const KEY = ["career"];

export const GOAL_STATUSES = [
  { value: "active", label: "Active" },
  { value: "done", label: "Done" },
  { value: "paused", label: "Paused" },
] as const;

export const GOAL_CATEGORIES = [
  "Skill",
  "Certification",
  "Project",
  "Networking",
  "Leadership",
  "Other",
] as const;

export function useCareerGoals() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () =>
      db.select().from(careerGoals).orderBy(desc(careerGoals.createdAt)),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NewCareerGoal> & { title: string }) => {
      await db.insert(careerGoals).values(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CareerGoal> & { id: string }) => {
      await db.update(careerGoals).set(patch).where(eq(careerGoals.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(careerGoals).where(eq(careerGoals.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
