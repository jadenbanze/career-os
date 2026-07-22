import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  CircleDot,
  MoreHorizontal,
  Plus,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm";
import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CareerGoal, PromotionMilestone } from "@/db/schema";
import { useBragEntries } from "@/features/brag/use-brag";
import { WinsPanel } from "@/features/brag/wins-panel";
import { GoalDialog } from "@/features/career/goal-dialog";
import { GOAL_STATUSES, useCareerGoals, useDeleteGoal } from "@/features/career/use-career";
import { MilestoneDialog } from "@/features/promotion/milestone-dialog";
import {
  useDeleteMilestone,
  usePromotionMilestones,
  useUpdateMilestone,
} from "@/features/promotion/use-promotion";
import { cn } from "@/lib/utils";

/* ----------------------------- Goals ----------------------------- */

const GOAL_STATUS_TONE: Record<string, string> = {
  active: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  paused: "bg-muted text-muted-foreground",
};

function goalStatusLabel(value: string) {
  return GOAL_STATUSES.find((s) => s.value === value)?.label ?? value;
}

function GoalCard({ goal, onEdit }: { goal: CareerGoal; onEdit: (g: CareerGoal) => void }) {
  const del = useDeleteGoal();
  const confirm = useConfirm();
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 space-y-1.5">
          <h3 className="font-medium">{goal.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {goal.category ? <Badge variant="outline">{goal.category}</Badge> : null}
            <Badge variant="secondary" className={cn("border-0", GOAL_STATUS_TONE[goal.status])}>
              {goalStatusLabel(goal.status)}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(goal)}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={async () => {
                if (
                  !(await confirm({
                    title: "Delete goal?",
                    description: `"${goal.title}" will be permanently removed.`,
                    confirmText: "Delete",
                    destructive: true,
                  }))
                )
                  return;
                await del.mutateAsync(goal.id);
                toast.success("Goal deleted");
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
            <span>Progress</span>
            <span className="tabular-nums">{goal.progress}%</span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
        {goal.targetDate ? (
          <p className="text-muted-foreground text-xs">
            Target {format(new Date(goal.targetDate), "MMM d, yyyy")}
          </p>
        ) : null}
        {goal.notes ? (
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{goal.notes}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GoalsPanel() {
  const { data: goals, isLoading } = useCareerGoals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CareerGoal | null>(null);
  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Add goal
        </Button>
      </div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !goals || goals.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="No goals yet"
          description="Set development goals and track your progress toward them."
          action={
            <Button onClick={openNew}>
              <Plus className="size-4" />
              Add goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => {
                setEditing(g);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}
      <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} goal={editing} />
    </div>
  );
}

/* --------------------------- Promotion --------------------------- */

const NEXT_STATUS: Record<string, string> = {
  not_started: "in_progress",
  in_progress: "complete",
  complete: "not_started",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "complete") return <CheckCircle2 className="size-5 text-emerald-500" />;
  if (status === "in_progress") return <CircleDot className="size-5 text-blue-500" />;
  return <Circle className="text-muted-foreground/40 size-5" />;
}

function PromotionPanel() {
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Add milestone
        </Button>
      </div>
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
          <Card>
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
                  {i < items.length - 1 ? <div className="bg-border my-1 w-px flex-1" /> : null}
                </div>
                <div className="min-w-0 flex-1 pb-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            m.status === "complete" && "text-muted-foreground line-through",
                          )}
                        >
                          {m.title}
                        </span>
                        {m.targetLevel ? <Badge variant="secondary">{m.targetLevel}</Badge> : null}
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
      <MilestoneDialog open={dialogOpen} onOpenChange={setDialogOpen} milestone={editing} />
    </div>
  );
}

/* ----------------------------- Page ------------------------------ */

function TabCount({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">{n}</span>
  );
}

export default function GrowthPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "wins";
  const { data: wins } = useBragEntries();
  const { data: goals } = useCareerGoals();
  const { data: milestones } = usePromotionMilestones();

  return (
    <Page>
      <PageHeader
        title="Journey"
        description="Your wins, development goals, and path to the next level."
        icon={Rocket}
      />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="wins">
            Wins
            <TabCount n={wins?.length} />
          </TabsTrigger>
          <TabsTrigger value="goals">
            Goals
            <TabCount n={goals?.length} />
          </TabsTrigger>
          <TabsTrigger value="promotion">
            Promotion
            <TabCount n={milestones?.length} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="wins" className="mt-4">
          <WinsPanel />
        </TabsContent>
        <TabsContent value="goals" className="mt-4">
          <GoalsPanel />
        </TabsContent>
        <TabsContent value="promotion" className="mt-4">
          <PromotionPanel />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
