import { useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  CircleDot,
  MoreHorizontal,
  Plus,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm";
import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { PromotionMilestone } from "@/db/schema";
import { MilestoneDialog } from "@/features/promotion/milestone-dialog";
import {
  useDeleteMilestone,
  usePromotionMilestones,
  useUpdateMilestone,
} from "@/features/promotion/use-promotion";
import { cn } from "@/lib/utils";

const NEXT_STATUS: Record<string, string> = {
  not_started: "in_progress",
  in_progress: "complete",
  complete: "not_started",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "complete")
    return <CheckCircle2 className="size-5 text-emerald-500" />;
  if (status === "in_progress")
    return <CircleDot className="size-5 text-blue-500" />;
  return <Circle className="text-muted-foreground/40 size-5" />;
}

export default function PromotionPage() {
  const { data: milestones, isLoading } = usePromotionMilestones();
  const update = useUpdateMilestone();
  const del = useDeleteMilestone();
  const confirm = useConfirm();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromotionMilestone | null>(null);

  const items = milestones ?? [];
  const completed = items.filter((m) => m.status === "complete").length;
  const pct = items.length ? Math.round((completed / items.length) * 100) : 0;

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const cycleStatus = (m: PromotionMilestone) =>
    update.mutate({ id: m.id, status: NEXT_STATUS[m.status] ?? "not_started" });

  return (
    <Page>
      <PageHeader
        title="Promotion"
        description="Track your path toward the next level."
        icon={TrendingUp}
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Add milestone
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No milestones yet"
          description="Break your promotion into concrete milestones and track them here."
          action={
            <Button onClick={openNew}>
              <Plus className="size-4" />
              Add milestone
            </Button>
          }
        />
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Overall progress</span>
                <span className="text-muted-foreground">
                  {completed} of {items.length} complete
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="relative space-y-1 pl-2">
            {items.map((m, i) => (
              <div key={m.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => cycleStatus(m)}
                    title="Click to change status"
                    className="hover:opacity-80"
                  >
                    <StatusIcon status={m.status} />
                  </button>
                  {i < items.length - 1 ? (
                    <div className="bg-border my-1 w-px flex-1" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pb-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            m.status === "complete" &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {m.title}
                        </span>
                        {m.targetLevel ? (
                          <Badge variant="secondary">{m.targetLevel}</Badge>
                        ) : null}
                      </div>
                      {m.dueDate ? (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Target {format(new Date(m.dueDate), "MMM d, yyyy")}
                        </p>
                      ) : null}
                      {m.notes ? (
                        <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                          {m.notes}
                        </p>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(m);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={async () => {
                            if (
                              !(await confirm({
                                title: "Delete milestone?",
                                description: `"${m.title}" will be permanently removed.`,
                                confirmText: "Delete",
                                destructive: true,
                              }))
                            )
                              return;
                            await del.mutateAsync(m.id);
                            toast.success("Milestone deleted");
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        milestone={editing}
      />
    </Page>
  );
}
