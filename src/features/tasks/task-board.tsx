import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DropResult,
} from "@hello-pangea/dnd";
import { format } from "date-fns";
import { CalendarDays, GripVertical, MoreHorizontal, Plus, User } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task } from "@/db/schema";
import { useConfirm } from "@/components/confirm";
import { useAppActions } from "@/components/layout/app-actions";
import { JiraKeyBadge } from "@/features/jira/jira-key-badge";
import {
  PRIORITY_ACCENT,
  PRIORITY_BADGE,
  TASK_STATUSES,
  type TaskPriority,
} from "./constants";
import { suggestWin } from "./suggest-win";
import { useDeleteTask, useMoveTasks } from "./use-tasks";

function TaskCard({
  task,
  onEdit,
  provided,
  snapshot,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}) {
  const del = useDeleteTask();
  const confirm = useConfirm();
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{
        ...provided.draggableProps.style,
        // Clear the leftover transform once dropped, so cards don't drift/jitter.
        transform: snapshot.isDragging
          ? provided.draggableProps.style?.transform
          : "none",
      }}
      className={cn(
        "bg-card group rounded-lg border border-l-2 p-3 shadow-xs",
        PRIORITY_ACCENT[task.priority as TaskPriority],
        snapshot.isDragging && "shadow-xl",
      )}
    >
      <div className="flex items-start gap-1.5">
        <span
          {...(provided.dragHandleProps ?? {})}
          className={cn(
            "text-muted-foreground/40 hover:text-muted-foreground mt-0.5 cursor-grab touch-none",
            snapshot.isDragging && "cursor-grabbing",
          )}
        >
          <GripVertical className="size-4 shrink-0" />
        </span>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="flex-1 text-left text-sm font-medium hover:underline"
        >
          {task.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(task)}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={async () => {
                if (
                  !(await confirm({
                    title: "Delete task?",
                    description: `"${task.title}" will be permanently removed.`,
                    confirmText: "Delete",
                    destructive: true,
                  }))
                )
                  return;
                await del.mutateAsync(task.id);
                toast.success("Task deleted");
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description ? (
        <p className="text-muted-foreground mt-1.5 line-clamp-2 pl-6 text-xs">
          {task.description}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
        <Badge
          variant="secondary"
          className={cn("border-0 capitalize", PRIORITY_BADGE[task.priority as TaskPriority])}
        >
          {task.priority}
        </Badge>
        {task.jiraKey ? <JiraKeyBadge issueKey={task.jiraKey} /> : null}
        {task.owner ? (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <User className="size-3" />
            {task.owner}
          </span>
        ) : null}
        {task.dueDate ? (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <CalendarDays className="size-3" />
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
  onEdit,
  onAdd,
}: {
  status: string;
  label: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAdd: (status: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-muted-foreground text-xs">{tasks.length}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => onAdd(status)}
          aria-label={`Add task to ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <Droppable droppableId={status}>
        {(dropProvided, dropSnapshot) => (
          <div
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            className={cn(
              // Use sibling spacing, not flex gap: the DnD placeholder measures
              // draggable margins but not CSS gap, which caused a small source
              // column size twitch. min-h-32 keeps a one-card column stable.
              "bg-muted/40 relative min-h-32 space-y-2 rounded-lg p-2 transition-colors",
              dropSnapshot.isDraggingOver && "bg-muted ring-primary/30 ring-2",
            )}
          >
            {/* Absolutely positioned so it never shifts the column size. */}
            {tasks.length === 0 ? (
              <div
                className={cn(
                  "text-muted-foreground/50 pointer-events-none absolute inset-0 flex items-center justify-center text-xs transition-opacity",
                  dropSnapshot.isDraggingOver && "opacity-0",
                )}
              >
                Drop tasks here
              </div>
            ) : null}
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <TaskCard
                    task={task}
                    onEdit={onEdit}
                    provided={provided}
                    snapshot={snapshot}
                  />
                )}
              </Draggable>
            ))}
            {dropProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export function TaskBoard({
  tasks,
  onEdit,
  onAdd,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAdd: (status: string) => void;
}) {
  const move = useMoveTasks();
  const actions = useAppActions();
  const [boardTasks, setBoardTasks] = useState(tasks);
  const dragging = useRef(false);
  const pendingTasks = useRef<Task[] | null>(null);

  // Avoid changing the measured list under the DnD engine mid-drag. If a query
  // refresh lands while dragging, apply it after cancel/drop instead.
  useEffect(() => {
    if (dragging.current) pendingTasks.current = tasks;
    else setBoardTasks(tasks);
  }, [tasks]);

  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const s of TASK_STATUSES) map[s.value] = [];
    for (const t of boardTasks) (map[t.status] ??= []).push(t);
    return map;
  }, [boardTasks]);

  const onDragEnd = (result: DropResult) => {
    dragging.current = false;
    const { source, destination, draggableId } = result;
    if (!destination) {
      if (pendingTasks.current) setBoardTasks(pendingTasks.current);
      pendingTasks.current = null;
      return;
    }
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      if (pendingTasks.current) setBoardTasks(pendingTasks.current);
      pendingTasks.current = null;
      return;
    }

    const previous = boardTasks;
    const lists: Record<string, Task[]> = {};
    for (const s of TASK_STATUSES) lists[s.value] = [];
    for (const task of previous) (lists[task.status] ??= []).push(task);

    const sourceList = [...(lists[source.droppableId] ?? [])];
    const [dragged] = sourceList.splice(source.index, 1);
    if (!dragged || dragged.id !== draggableId) {
      if (pendingTasks.current) setBoardTasks(pendingTasks.current);
      pendingTasks.current = null;
      return;
    }

    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, dragged);
      lists[source.droppableId] = sourceList;
    } else {
      const destinationList = [...(lists[destination.droppableId] ?? [])];
      destinationList.splice(destination.index, 0, {
        ...dragged,
        status: destination.droppableId,
      });
      lists[source.droppableId] = sourceList;
      lists[destination.droppableId] = destinationList;
    }

    const nextTasks = TASK_STATUSES.flatMap((status) =>
      (lists[status.value] ?? []).map((task, position) =>
        task.position === position ? task : { ...task, position },
      ),
    );
    const previousById = new Map(previous.map((task) => [task.id, task]));
    const updates = nextTasks
      .filter((task) => {
        const old = previousById.get(task.id);
        return old && (old.status !== task.status || old.position !== task.position);
      })
      .map(({ id, status, position }) => ({ id, status, position }));

    // @hello-pangea/dnd requires this reorder synchronously inside onDragEnd.
    // Without flushSync the item briefly snaps back to the source before the
    // React Query optimistic mutation arrives on the next microtask.
    pendingTasks.current = null;
    flushSync(() => setBoardTasks(nextTasks));
    move.mutate(
      { updates, nextTasks },
      { onError: () => setBoardTasks(previous) },
    );

    if (dragged.status !== "done" && destination.droppableId === "done") {
      suggestWin(dragged, actions.openBrag);
    }
  };

  return (
    <DragDropContext
      onDragStart={() => {
        dragging.current = true;
      }}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TASK_STATUSES.map((s) => (
          <Column
            key={s.value}
            status={s.value}
            label={s.label}
            tasks={byStatus[s.value] ?? []}
            onEdit={onEdit}
            onAdd={onAdd}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
