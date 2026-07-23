import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { format } from "date-fns";
import { CalendarDays, GripVertical, MoreHorizontal, Plus, User } from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm";
import { useAppActions } from "@/components/layout/app-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@/db/schema";
import { JiraKeyBadge } from "@/features/jira/jira-key-badge";
import { cn } from "@/lib/utils";
import {
  PRIORITY_ACCENT,
  PRIORITY_BADGE,
  TASK_STATUSES,
  type TaskPriority,
} from "./constants";
import { suggestWin } from "./suggest-win";
import { useDeleteTask, useMoveTasks } from "./use-tasks";

const taskDndId = (id: string) => `task:${id}`;
const columnDndId = (status: string) => `column:${status}`;

type TaskDragData = { type: "task"; taskId: string; status: string };
type ColumnDragData = { type: "column"; status: string };
type DropTarget =
  | { type: "task"; taskId: string; status: string; edge: "top" | "bottom" }
  | { type: "column"; status: string };

function isTaskData(data: unknown): data is TaskDragData {
  if (!data || typeof data !== "object") return false;
  const value = data as Record<string, unknown>;
  return (
    value.type === "task" &&
    typeof value.taskId === "string" &&
    typeof value.status === "string"
  );
}

function isColumnData(data: unknown): data is ColumnDragData {
  if (!data || typeof data !== "object") return false;
  const value = data as Record<string, unknown>;
  return value.type === "column" && typeof value.status === "string";
}

const boardCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    const card = pointerCollisions.find((collision) =>
      String(collision.id).startsWith("task:"),
    );
    return card ? [card] : pointerCollisions;
  }
  return rectIntersection(args);
};

function edgeForOver(event: DragOverEvent | DragEndEvent): "top" | "bottom" {
  const translated = event.active.rect.current.translated;
  const activeCenter = translated
    ? translated.top + translated.height / 2
    : event.active.rect.current.initial
      ? event.active.rect.current.initial.top + event.active.rect.current.initial.height / 2
      : event.over!.rect.top;
  return activeCenter < event.over!.rect.top + event.over!.rect.height / 2
    ? "top"
    : "bottom";
}

function targetForEvent(event: DragOverEvent | DragEndEvent): DropTarget | null {
  const data = event.over?.data.current;
  if (isTaskData(data)) {
    return {
      type: "task",
      taskId: data.taskId,
      status: data.status,
      edge: edgeForOver(event),
    };
  }
  if (isColumnData(data)) return { type: "column", status: data.status };
  return null;
}

function DropIndicator({ edge }: { edge: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-primary pointer-events-none absolute right-1 left-1 z-20 h-0.5 rounded-full shadow-sm",
        edge === "top" ? "-top-[5px]" : "-bottom-[5px]",
      )}
    >
      <span className="border-primary bg-background absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full border-2" />
    </div>
  );
}

function TaskMeta({ task }: { task: Task }) {
  return (
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
  );
}

function TaskPreview({ task }: { task: Task }) {
  return (
    <div
      className={cn(
        "bg-card w-[var(--drag-width)] rotate-[0.5deg] rounded-lg border border-l-2 p-3 shadow-2xl",
        PRIORITY_ACCENT[task.priority as TaskPriority],
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="text-muted-foreground/40 mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1 text-sm font-medium break-words">{task.title}</div>
      </div>
      {task.description ? (
        <p className="text-muted-foreground mt-1.5 line-clamp-2 pl-6 text-xs break-words [overflow-wrap:anywhere]">
          {task.description}
        </p>
      ) : null}
      <TaskMeta task={task} />
    </div>
  );
}

function TaskCard({
  task,
  dropEdge,
  onEdit,
}: {
  task: Task;
  dropEdge: "top" | "bottom" | null;
  onEdit: (task: Task) => void;
}) {
  const del = useDeleteTask();
  const confirm = useConfirm();
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: taskDndId(task.id),
    data: { type: "task", taskId: task.id, status: task.status } satisfies TaskDragData,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // The source never transforms or leaves layout. Only DragOverlay moves;
        // this guarantees stable source/destination geometry with no jitter.
        "bg-card group relative rounded-lg border border-l-2 p-3 shadow-xs",
        PRIORITY_ACCENT[task.priority as TaskPriority],
        isDragging && "opacity-0",
      )}
    >
      {dropEdge ? <DropIndicator edge={dropEdge} /> : null}
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${task.title}`}
          className="text-muted-foreground/40 hover:text-muted-foreground mt-0.5 cursor-grab touch-none rounded-sm outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical className="size-4 shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="min-w-0 flex-1 text-left text-sm font-medium break-words hover:underline"
        >
          {task.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
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
        <p className="text-muted-foreground mt-1.5 line-clamp-2 pl-6 text-xs break-words [overflow-wrap:anywhere]">
          {task.description}
        </p>
      ) : null}
      <TaskMeta task={task} />
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
  target,
  onEdit,
  onAdd,
}: {
  status: string;
  label: string;
  tasks: Task[];
  target: DropTarget | null;
  onEdit: (task: Task) => void;
  onAdd: (status: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDndId(status),
    data: { type: "column", status } satisfies ColumnDragData,
  });
  const targetInColumn = target?.status === status;

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-muted-foreground text-xs tabular-nums">{tasks.length}</span>
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
      <SortableContext
        items={tasks.map((task) => taskDndId(task.id))}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          data-testid={`task-column-${status}`}
          className={cn(
            "bg-muted/40 relative min-h-32 space-y-2 rounded-lg p-2 transition-[background-color,box-shadow] sm:min-h-56 lg:min-h-[calc(100dvh-20rem)]",
            targetInColumn && "bg-muted/70 ring-primary/30 ring-2",
          )}
        >
          <div
            className={cn(
              "text-muted-foreground/50 pointer-events-none absolute inset-0 flex items-center justify-center text-xs transition-opacity duration-150",
              tasks.length === 0 && !isOver ? "opacity-100" : "opacity-0",
            )}
          >
            Drop tasks here
          </div>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              dropEdge={
                target?.type === "task" && target.taskId === task.id ? target.edge : null
              }
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
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
  const moveTasks = useMoveTasks().mutate;
  const actions = useAppActions();
  const [boardTasks, setBoardTasks] = useState(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
  const dragging = useRef(false);
  const pendingTasks = useRef<Task[] | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (dragging.current) pendingTasks.current = tasks;
    else setBoardTasks(tasks);
  }, [tasks]);

  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const status of TASK_STATUSES) map[status.value] = [];
    for (const task of boardTasks) (map[task.status] ??= []).push(task);
    return map;
  }, [boardTasks]);

  const activeTask = activeId
    ? boardTasks.find((task) => task.id === activeId) ?? null
    : null;

  const clearDrag = () => {
    dragging.current = false;
    setActiveId(null);
    setTarget(null);
  };

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (!isTaskData(data)) return;
    dragging.current = true;
    setActiveId(data.taskId);
    const width = event.active.rect.current.initial?.width;
    if (width) document.documentElement.style.setProperty("--drag-width", `${width}px`);
  };

  const onDragOver = (event: DragOverEvent) => {
    const next = targetForEvent(event);
    setTarget((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next,
    );
  };

  const onDragCancel = (_event: DragCancelEvent) => {
    if (pendingTasks.current) setBoardTasks(pendingTasks.current);
    pendingTasks.current = null;
    clearDrag();
  };

  const onDragEnd = (event: DragEndEvent) => {
    const dropTarget = targetForEvent(event) ?? target;
    const sourceData = event.active.data.current;
    if (!isTaskData(sourceData) || !dropTarget) {
      onDragCancel(event);
      return;
    }

    const previous = boardTasks;
    const dragged = previous.find((task) => task.id === sourceData.taskId);
    if (!dragged || (dropTarget.type === "task" && dropTarget.taskId === dragged.id)) {
      clearDrag();
      return;
    }

    const destinationStatus = dropTarget.status;
    const lists: Record<string, Task[]> = {};
    for (const status of TASK_STATUSES) lists[status.value] = [];
    for (const task of previous) (lists[task.status] ??= []).push(task);
    lists[dragged.status] = (lists[dragged.status] ?? []).filter(
      (task) => task.id !== dragged.id,
    );

    const destination = [...(lists[destinationStatus] ?? [])];
    let destinationIndex = destination.length;
    if (dropTarget.type === "task") {
      const targetIndex = destination.findIndex((task) => task.id === dropTarget.taskId);
      if (targetIndex !== -1) {
        destinationIndex = targetIndex + (dropTarget.edge === "bottom" ? 1 : 0);
      }
    }
    destination.splice(destinationIndex, 0, {
      ...dragged,
      status: destinationStatus,
    });
    lists[destinationStatus] = destination;

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

    pendingTasks.current = null;
    flushSync(() => {
      if (updates.length > 0) setBoardTasks(nextTasks);
      clearDrag();
    });
    if (updates.length === 0) return;

    moveTasks(
      { updates, nextTasks },
      { onError: () => setBoardTasks(previous) },
    );
    if (dragged.status !== "done" && destinationStatus === "done") {
      suggestWin(dragged, actions.openBrag);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={boardCollisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status.value}
            status={status.value}
            label={status.label}
            tasks={byStatus[status.value] ?? []}
            target={target}
            onEdit={onEdit}
            onAdd={onAdd}
          />
        ))}
      </div>
      <DragOverlay adjustScale={false} dropAnimation={null}>
        {activeTask ? <TaskPreview task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
