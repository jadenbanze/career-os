import { useState } from "react";
import { format } from "date-fns";
import { ListTodo, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task } from "@/db/schema";
import { JiraIssuesList } from "@/features/jira/jira-issues-list";
import { JiraKeyBadge } from "@/features/jira/jira-key-badge";
import { useSyncJira } from "@/features/jira/use-jira";
import { PRIORITY_BADGE, statusLabel, type TaskPriority } from "@/features/tasks/constants";
import { TaskBoard } from "@/features/tasks/task-board";
import { TaskDialog } from "@/features/tasks/task-dialog";
import { useTasks } from "@/features/tasks/use-tasks";
import { cn } from "@/lib/utils";

function TaskListView({ tasks, onEdit }: { tasks: Task[]; onEdit: (t: Task) => void }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No tasks yet"
        description="Create your first task to start tracking your work."
      />
    );
  }
  return (
    <div className="divide-y rounded-lg border">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={() => onEdit(task)}
          className="hover:bg-muted/50 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
        >
          <span className="flex-1 truncate text-sm font-medium">{task.title}</span>
          {task.jiraKey ? <JiraKeyBadge issueKey={task.jiraKey} /> : null}
          <Badge
            variant="secondary"
            className={cn("border-0", PRIORITY_BADGE[task.priority as TaskPriority])}
          >
            {task.priority}
          </Badge>
          <Badge variant="outline">{statusLabel(task.status)}</Badge>
          {task.dueDate ? (
            <span className="text-muted-foreground hidden w-20 shrink-0 text-right text-xs md:inline">
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const sync = useSyncJira();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<string | undefined>();

  const openNew = (status?: string) => {
    setEditing(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditing(task);
    setDefaultStatus(undefined);
    setDialogOpen(true);
  };

  const runSync = async () => {
    try {
      const count = await sync.mutateAsync();
      toast.success(`Synced ${count} JIRA issue${count === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Page>
      <PageHeader
        title="Tasks"
        description="Your work tasks and JIRA issues in one place."
        icon={ListTodo}
        actions={
          <Button onClick={() => openNew()}>
            <Plus className="size-4" />
            New task
          </Button>
        }
      />

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="jira">JIRA</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <TaskBoard tasks={tasks ?? []} onEdit={openEdit} onAdd={openNew} />
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <TaskListView tasks={tasks ?? []} onEdit={openEdit} />
          )}
        </TabsContent>

        <TabsContent value="jira" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Read-only issues assigned to you in JIRA.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={runSync}
              disabled={sync.isPending}
            >
              <RefreshCw
                className={cn("size-4", sync.isPending && "animate-spin")}
              />
              Sync
            </Button>
          </div>
          <JiraIssuesList />
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        defaultStatus={defaultStatus}
      />
    </Page>
  );
}
