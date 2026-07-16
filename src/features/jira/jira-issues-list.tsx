import { openUrl } from "@tauri-apps/plugin-opener";
import { format } from "date-fns";
import { Check, ExternalLink, Link2, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCreateTask, useTasks } from "@/features/tasks/use-tasks";
import { useJiraIssues } from "./use-jira";

function statusTone(category: string | null): string {
  switch (category) {
    case "Done":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "In Progress":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function JiraIssuesList() {
  const { data: issues, isLoading } = useJiraIssues();
  const { data: tasks } = useTasks();
  const createTask = useCreateTask();

  const linkedKeys = new Set(
    (tasks ?? []).map((t) => t.jiraKey).filter(Boolean) as string[],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <EmptyState
        icon={Link2}
        title="No JIRA issues yet"
        description="Connect JIRA in Settings, then hit Sync to pull the issues assigned to you."
      />
    );
  }

  const open = async (url: string | null) => {
    if (!url) return;
    try {
      await openUrl(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const createLinked = async (summary: string, key: string) => {
    await createTask.mutateAsync({ title: summary, jiraKey: key });
    toast.success(`Created task linked to ${key}`);
  };

  return (
    <div className="divide-y rounded-lg border">
      {issues.map((issue) => {
        const linked = linkedKeys.has(issue.key);
        return (
          <div
            key={issue.key}
            className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3 transition-colors"
          >
            <button
              type="button"
              onClick={() => open(issue.url)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="text-muted-foreground w-24 shrink-0 font-mono text-xs">
                {issue.key}
              </span>
              <span className="flex-1 truncate text-sm">{issue.summary}</span>
              {issue.status ? (
                <Badge
                  variant="secondary"
                  className={cn("border-0", statusTone(issue.statusCategory))}
                >
                  {issue.status}
                </Badge>
              ) : null}
              {issue.updated ? (
                <span className="text-muted-foreground hidden w-16 shrink-0 text-right text-xs md:inline">
                  {format(new Date(issue.updated), "MMM d")}
                </span>
              ) : null}
              <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
            </button>
            {linked ? (
              <Badge variant="secondary" className="shrink-0 gap-1">
                <Check className="size-3" />
                Linked
              </Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => createLinked(issue.summary, issue.key)}
                disabled={createTask.isPending}
              >
                <Plus className="size-4" />
                Task
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
