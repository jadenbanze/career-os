import { useState } from "react";
import { format } from "date-fns";
import { CalendarClock, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimelineEvent } from "@/db/schema";
import {
  addToAppleCalendar,
  addToGoogleCalendar,
  type CalEvent,
} from "@/features/calendar/calendar";
import { EventDialog } from "@/features/timeline/event-dialog";
import {
  CATEGORY_TONE,
  useDeleteEvent,
  useTimelineEvents,
} from "@/features/timeline/use-timeline";
import { cn } from "@/lib/utils";

function groupByYear(events: TimelineEvent[]): [string, TimelineEvent[]][] {
  const groups = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const year = String(new Date(e.date).getFullYear());
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(e);
  }
  return Array.from(groups.entries());
}

export default function TimelinePage() {
  const { data: events, isLoading } = useTimelineEvents();
  const del = useDeleteEvent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const addToCalendar = async (e: TimelineEvent, target: "google" | "apple") => {
    const cal: CalEvent = {
      uid: e.id,
      title: e.title,
      date: new Date(e.date),
      description: e.notes ?? undefined,
    };
    try {
      if (target === "google") await addToGoogleCalendar(cal);
      else await addToAppleCalendar(cal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const grouped = groupByYear(events ?? []);

  return (
    <Page>
      <PageHeader
        title="Timeline"
        description="Important dates, work and personal."
        icon={CalendarClock}
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Add event
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !events || events.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No events yet"
          description="Log meaningful moments — role changes, launches, personal milestones."
          action={
            <Button onClick={openNew}>
              <Plus className="size-4" />
              Add event
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([year, yearEvents]) => (
            <div key={year}>
              <h2 className="text-muted-foreground mb-3 text-sm font-semibold">
                {year}
              </h2>
              <div className="space-y-1 border-l pl-5">
                {yearEvents.map((e) => (
                  <div key={e.id} className="relative pb-5">
                    <span className="bg-background border-primary absolute top-1 -left-[26px] size-3 rounded-full border-2" />
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{e.title}</span>
                          <Badge
                            variant="secondary"
                            className={cn("border-0 capitalize", CATEGORY_TONE[e.category])}
                          >
                            {e.category}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {format(new Date(e.date), "MMMM d, yyyy")}
                        </p>
                        {e.notes ? (
                          <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                            {e.notes}
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
                          <DropdownMenuItem onSelect={() => addToCalendar(e, "google")}>
                            Add to Google Calendar
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => addToCalendar(e, "apple")}>
                            Add to Apple Calendar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditing(e);
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={async () => {
                              await del.mutateAsync(e.id);
                              toast.success("Event deleted");
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <EventDialog open={dialogOpen} onOpenChange={setDialogOpen} event={editing} />
    </Page>
  );
}
