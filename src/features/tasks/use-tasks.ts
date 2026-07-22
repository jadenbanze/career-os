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

export type TaskMoveUpdate = Pick<Task, "id" | "status" | "position">;

/** Persists a synchronously-applied board move without a one-frame snap-back. */
export function useMoveTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ updates }: { updates: TaskMoveUpdate[]; nextTasks: Task[] }) => {
      const updatedAt = new Date();
      for (const task of updates) {
        await db
          .update(tasks)
          .set({ status: task.status, position: task.position, updatedAt })
          .where(eq(tasks.id, task.id));
      }
    },
    onMutate: ({ nextTasks }) => {
      const prev = qc.getQueryData<Task[]>(KEY);
      void qc.cancelQueries({ queryKey: KEY });
      qc.setQueryData<Task[]>(KEY, nextTasks);
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
