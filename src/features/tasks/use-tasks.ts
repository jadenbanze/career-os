import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { tasks, type NewTask, type Task } from "@/db/schema";

const KEY = ["tasks"];

export function useTasks() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () =>
      db.select().from(tasks).orderBy(asc(tasks.position), asc(tasks.createdAt)),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<NewTask> & { title: string }) => {
      await db.insert(tasks).values(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Task> & { id: string }) => {
      await db
        .update(tasks)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(tasks.id, id));
    },
    // Optimistically apply the change so the board/list updates instantly.
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Task[]>(KEY);
      if (prev) {
        qc.setQueryData<Task[]>(
          KEY,
          prev.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: new Date() } : t,
          ),
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

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(tasks).where(eq(tasks.id, id));
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Task[]>(KEY);
      if (prev) {
        qc.setQueryData<Task[]>(
          KEY,
          prev.filter((t) => t.id !== id),
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
