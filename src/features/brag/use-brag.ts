import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { bragEntries, type BragEntry, type NewBragEntry } from "@/db/schema";

const KEY = ["brag"];

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function useBragEntries() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () =>
      db.select().from(bragEntries).orderBy(desc(bragEntries.date)),
  });
}

export function useCreateBrag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NewBragEntry> & { title: string }) => {
      await db.insert(bragEntries).values(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBrag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<BragEntry> & { id: string }) => {
      await db.update(bragEntries).set(patch).where(eq(bragEntries.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBrag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(bragEntries).where(eq(bragEntries.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
