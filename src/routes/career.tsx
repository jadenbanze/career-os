import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Plus, Rocket } from "lucide-react";
import { toast } from "sonner";

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
import type { CareerGoal } from "@/db/schema";
import { GoalDialog } from "@/features/career/goal-dialog";
import {
  GOAL_STATUSES,
  useCareerGoals,
  useDeleteGoal,
} from "@/features/career/use-career";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  active: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  paused: "bg-muted text-muted-foreground",
};

function statusLabel(value: string) {
  return GOAL_STATUSES.find((s) => s.value === value)?.label ?? value;
}

function GoalCard({ goal, onEdit }: { goal: CareerGoal; onEdit: (g: CareerGoal) => void }) {
  const del = useDeleteGoal();
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 space-y-1.5">
          <h3 className="font-medium">{goal.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {goal.category ? <Badge variant="outline">{goal.category}</Badge> : null}
            <Badge variant="secondary" className={cn("border-0", STATUS_TONE[goal.status])}>
              {statusLabel(goal.status)}
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
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {goal.notes}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function CareerPage() {
  const { data: goals, isLoading } = useCareerGoals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CareerGoal | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <Page>
      <PageHeader
        title="Career Development"
        description="Grow deliberately with goals, skills, and mentors."
        icon={Rocket}
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Add goal
          </Button>
        }
      />

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
    </Page>
  );
}
