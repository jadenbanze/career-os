import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  feedback,
  oneOnOnes,
  type Feedback,
  type NewFeedback,
  type NewOneOnOne,
  type OneOnOne,
} from "@/db/schema";

const ONE_ON_ONE_KEY = ["one_on_ones"];
const FEEDBACK_KEY = ["feedback"];

export const FEEDBACK_KINDS = [
  { value: "praise", label: "Praise" },
  { value: "constructive", label: "Constructive" },
  { value: "other", label: "Other" },
] as const;

export function useOneOnOnes() {
  return useQuery({
    queryKey: ONE_ON_ONE_KEY,
    queryFn: async () => db.select().from(oneOnOnes).orderBy(desc(oneOnOnes.date)),
  });
}

export function useCreateOneOnOne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NewOneOnOne>) => {
      await db.insert(oneOnOnes).values(input as NewOneOnOne);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ONE_ON_ONE_KEY }),
  });
}

export function useUpdateOneOnOne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<OneOnOne> & { id: string }) => {
      await db.update(oneOnOnes).set(patch).where(eq(oneOnOnes.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ONE_ON_ONE_KEY }),
  });
}

export function useDeleteOneOnOne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(oneOnOnes).where(eq(oneOnOnes.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ONE_ON_ONE_KEY }),
  });
}

export function useFeedback() {
  return useQuery({
    queryKey: FEEDBACK_KEY,
    queryFn: async () => db.select().from(feedback).orderBy(desc(feedback.date)),
  });
}

export function useCreateFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NewFeedback> & { content: string }) => {
      await db.insert(feedback).values(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FEEDBACK_KEY }),
  });
}

export function useUpdateFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Feedback> & { id: string }) => {
      await db.update(feedback).set(patch).where(eq(feedback.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FEEDBACK_KEY }),
  });
}

export function useDeleteFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(feedback).where(eq(feedback.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FEEDBACK_KEY }),
  });
}
