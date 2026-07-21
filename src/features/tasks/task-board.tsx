import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
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
import { PRIORITY_BADGE, TASK_STATUSES, type TaskPriority } from "./constants";
import { suggestWin } from "./suggest-win";
import { useDeleteTask, useUpdateTask } from "./use-tasks";

function TaskCard({
  task,
  onEdit,
  overlay,
}: {
  task: Task;
  onEdit?: (task: Task) => void;
  overlay?: boolean;
}) {
  const del = useDeleteTask();
  const confirm = useConfirm();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, disabled: overlay });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card group rounded-lg border p-3 shadow-xs",
        isDragging && "opacity-40",
        overlay && "shadow-lg",
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className="text-muted-foreground/50 hover:text-muted-foreground mt-0.5 cursor-grab touch-none active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label="Drag task"
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(task)}
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
            <DropdownMenuItem onSelect={() => onEdit?.(task)}>
              Edit
            </DropdownMenuItem>
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
          className={cn("border-0", PRIORITY_BADGE[task.priority as TaskPriority])}
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
  const { setNodeRef, isOver } = useDroppable({ id: status });
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
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/40 flex flex-1 flex-col gap-2 rounded-lg p-2 transition-colors",
          isOver && "bg-muted ring-primary/30 ring-2",
        )}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
        {tasks.length === 0 ? (
          <div className="text-muted-foreground/60 flex h-16 items-center justify-center text-xs">
            Drop tasks here
          </div>
        ) : null}
      </div>
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
  const update = useUpdateTask();
  const actions = useAppActions();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const s of TASK_STATUSES) map[s.value] = [];
    for (const t of tasks) (map[t.status] ??= []).push(t);
    return map;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const task = tasks.find((t) => t.id === String(active.id));
    const newStatus = String(over.id);
    if (task && task.status !== newStatus) {
      update.mutate({ id: task.id, status: newStatus });
      if (newStatus === "done") suggestWin(task, actions.openBrag);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
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
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
