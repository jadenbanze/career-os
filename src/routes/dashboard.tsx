import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Award,
  CalendarClock,
  CircleDot,
  Link2,
  ListTodo,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Page, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { parseTags, useBragEntries } from "@/features/brag/use-brag";
import { useJiraIssues } from "@/features/jira/use-jira";
import { usePromotionMilestones } from "@/features/promotion/use-promotion";
import { statusLabel } from "@/features/tasks/constants";
import { useTasks } from "@/features/tasks/use-tasks";
import { CATEGORY_TONE, useTimelineEvents } from "@/features/timeline/use-timeline";
import { todayKey, useDailyNote, useSaveDailyNote } from "@/features/today/use-today";
import { cn } from "@/lib/utils";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  icon: typeof ListTodo;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="bg-muted text-foreground flex size-10 items-center justify-center rounded-lg">
            <Icon className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
            <div className="text-muted-foreground text-xs">{label}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: tasks } = useTasks();
  const { data: brag } = useBragEntries();
  const { data: jira } = useJiraIssues();
  const { data: milestones } = usePromotionMilestones();
  const { data: events } = useTimelineEvents();

  const date = todayKey();
  const { data: note } = useDailyNote(date);
  const saveNote = useSaveDailyNote();
  const [journal, setJournal] = useState("");
  useEffect(() => {
    setJournal(note?.notes ?? "");
  }, [note]);

  const allTasks = tasks ?? [];
  const openTasks = allTasks.filter((t) => t.status !== "done");
  const inProgress = allTasks.filter((t) => t.status === "in_progress");
  const recentWins = (brag ?? []).slice(0, 3);
  const focus = [
    ...inProgress,
    ...openTasks.filter((t) => t.status !== "in_progress"),
  ].slice(0, 5);

  const ms = milestones ?? [];
  const msComplete = ms.filter((m) => m.status === "complete").length;
  const msPct = ms.length ? Math.round((msComplete / ms.length) * 100) : 0;

  const now = Date.now();
  const upcoming = (events ?? [])
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <Page>
      <PageHeader
        title={greeting()}
        description={format(new Date(), "EEEE, MMMM d")}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open tasks" value={openTasks.length} icon={ListTodo} to="/tasks" />
        <StatCard label="In progress" value={inProgress.length} icon={CircleDot} to="/tasks" />
        <StatCard label="JIRA assigned" value={(jira ?? []).length} icon={Link2} to="/tasks" />
        <StatCard label="Wins logged" value={(brag ?? []).length} icon={Award} to="/brag" />
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Journal</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            onBlur={() => saveNote.mutate({ date, notes: journal })}
            rows={3}
            placeholder="How's today going? What did you ship or learn?"
          />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Focus</CardTitle>
          </CardHeader>
          <CardContent>
            {focus.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nothing on deck. Add a task to get going.
              </p>
            ) : (
              <ul className="space-y-2">
                {focus.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate">{task.title}</span>
                    <Badge variant="outline">{statusLabel(task.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Upcoming</CardTitle>
            <CalendarClock className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No upcoming events. Add dates on the Timeline.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate">{e.title}</span>
                    <Badge
                      variant="secondary"
                      className={cn("border-0 capitalize", CATEGORY_TONE[e.category])}
                    >
                      {e.category}
                    </Badge>
                    <span className="text-muted-foreground w-16 shrink-0 text-right text-xs">
                      {format(new Date(e.date), "MMM d")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Promotion progress</CardTitle>
            <TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {ms.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Add milestones on the Growth page to track your path.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>
                    {msComplete} of {ms.length} milestones
                  </span>
                  <span className="tabular-nums">{msPct}%</span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${msPct}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent wins</CardTitle>
          </CardHeader>
          <CardContent>
            {recentWins.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No wins logged yet — capture one on the Brag Sheet.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentWins.map((win) => (
                  <li key={win.id} className="flex items-start gap-2 text-sm">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{win.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {format(new Date(win.date), "MMM d")}
                        {parseTags(win.tags).length > 0
                          ? ` · ${parseTags(win.tags).join(", ")}`
                          : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
