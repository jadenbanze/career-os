import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { convertFileSrc } from "@tauri-apps/api/core";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { visionItems, type NewVisionItem, type VisionItem } from "@/db/schema";

const KEY = ["vision"];

/** Resolves a stored image path to a displayable src (URL or local asset). */
export function resolveImageSrc(path: string): string {
  return /^https?:\/\//.test(path) ? path : convertFileSrc(path);
}

export function useVisionItems() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () =>
      db
        .select()
        .from(visionItems)
        .orderBy(asc(visionItems.position), asc(visionItems.createdAt)),
  });
}

export function useCreateVisionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NewVisionItem> & { title: string }) => {
      await db.insert(visionItems).values(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVisionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<VisionItem> & { id: string }) => {
      await db.update(visionItems).set(patch).where(eq(visionItems.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVisionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(visionItems).where(eq(visionItems.id, id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReorderVisionItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          db.update(visionItems).set({ position: index }).where(eq(visionItems.id, id)),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
