import { useMemo } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { Activity, ExternalLink, GitPullRequest, RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GithubPr } from "@/db/schema";
import { useBragEntries } from "@/features/brag/use-brag";
import {
  ssoAuthorizeUrl,
  useGithubActivity,
  useGithubConfig,
  useGithubEvents,
  useGithubPrs,
  useGithubSummary,
  useSyncGithub,
} from "@/features/github/use-github";
import { useJiraIssues } from "@/features/jira/use-jira";
import { useTasks } from "@/features/tasks/use-tasks";
import { cn } from "@/lib/utils";

const MONDAY = { weekStartsOn: 1 } as const;

function prStateTone(state: string | null): string {
  switch (state) {
    case "open":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "merged":
      return "bg-violet-500/15 text-violet-600 dark:text-violet-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function PrList({ prs }: { prs: GithubPr[] | undefined }) {
  if (!prs || prs.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No pull requests found. Sync GitHub to populate this.
      </p>
    );
  }
  return (
    <div className="divide-y">
      {prs.map((pr) => (
        <button
          key={pr.id}
          type="button"
          onClick={() => pr.url && openUrl(pr.url)}
          className="hover:bg-muted/50 flex w-full items-center gap-3 px-1 py-2.5 text-left"
        >
          <span className="text-muted-foreground w-40 shrink-0 truncate font-mono text-xs">
            {pr.repo}#{pr.number}
          </span>
          <span className="flex-1 truncate text-sm">{pr.title}</span>
          <Badge variant="secondary" className={cn("border-0", prStateTone(pr.state))}>
            {pr.state}
          </Badge>
          <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
        </button>
      ))}
    </div>
  );
}

const ghConfig = {
  count: { label: "Contributions", color: "var(--chart-1)" },
} satisfies ChartConfig;
const tpConfig = {
  tasks: { label: "Tasks", color: "var(--chart-1)" },
  jira: { label: "JIRA", color: "var(--chart-2)" },
} satisfies ChartConfig;
const winsConfig = {
  wins: { label: "Wins", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function ActivityPage() {
  const { data: config } = useGithubConfig();
  const sync = useSyncGithub();
  const { data: summary } = useGithubSummary();
  const { data: activity } = useGithubActivity();
  const { data: authored } = useGithubPrs("author");
  const { data: reviewed } = useGithubPrs("reviewer");
  const { data: commented } = useGithubPrs("commenter");
  const { data: events } = useGithubEvents();
  const { data: tasks } = useTasks();
  const { data: jira } = useJiraIssues();
  const { data: brag } = useBragEntries();

  const ghWeekly = useMemo(() => {
    const end = new Date();
    const buckets = eachWeekOfInterval(
      { start: subWeeks(startOfWeek(end, MONDAY), 25), end },
      MONDAY,
    );
    const map = new Map(buckets.map((b) => [format(b, "yyyy-MM-dd"), 0]));
    for (const d of activity ?? []) {
      const key = format(startOfWeek(new Date(d.date), MONDAY), "yyyy-MM-dd");
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + d.count);
    }
    return buckets.map((b) => ({
      week: format(b, "MMM d"),
      count: map.get(format(b, "yyyy-MM-dd")) ?? 0,
    }));
  }, [activity]);

  const throughput = useMemo(() => {
    const end = new Date();
    const buckets = eachWeekOfInterval(
      { start: subWeeks(startOfWeek(end, MONDAY), 11), end },
      MONDAY,
    );
    const map = new Map(
      buckets.map((b) => [format(b, "yyyy-MM-dd"), { tasks: 0, jira: 0 }]),
    );
    const keyOf = (d: Date) => format(startOfWeek(d, MONDAY), "yyyy-MM-dd");
    for (const t of tasks ?? []) {
      if (t.status === "done" && t.updatedAt) {
        const e = map.get(keyOf(new Date(t.updatedAt)));
        if (e) e.tasks += 1;
      }
    }
    for (const j of jira ?? []) {
      if (j.statusCategory === "Done" && j.updated) {
        const e = map.get(keyOf(new Date(j.updated)));
        if (e) e.jira += 1;
      }
    }
    return buckets.map((b) => {
      const e = map.get(format(b, "yyyy-MM-dd")) ?? { tasks: 0, jira: 0 };
      return { week: format(b, "MMM d"), ...e };
    });
  }, [tasks, jira]);

  const winsMonthly = useMemo(() => {
    const end = new Date();
    const buckets = eachMonthOfInterval({ start: subMonths(startOfMonth(end), 7), end });
    const map = new Map(buckets.map((b) => [format(b, "yyyy-MM"), 0]));
    for (const w of brag ?? []) {
      const key = format(new Date(w.date), "yyyy-MM");
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return buckets.map((b) => ({
      month: format(b, "MMM"),
      wins: map.get(format(b, "yyyy-MM")) ?? 0,
    }));
  }, [brag]);

  const runSync = async () => {
    try {
      const res = await sync.mutateAsync();
      if (res.sso) {
        toast.warning("GitHub SSO authorization required", {
          description:
            "Your token isn't authorized for your enterprise org, so results are hidden. Authorize it, then sync again.",
          action: {
            label: "Authorize",
            onClick: () => openUrl(ssoAuthorizeUrl(res.sso)),
          },
          duration: 30000,
        });
      } else if (res.prs === 0 && res.contributions === 0 && res.events === 0) {
        toast.warning("Connected, but no data came back", {
          description: `Authenticated as ${res.login}. For an enterprise/EMU account, authorize the token for SSO and ensure it has the 'repo' scope.`,
          action: {
            label: "Open tokens",
            onClick: () => openUrl("https://github.com/settings/tokens"),
          },
          duration: 30000,
        });
      } else {
        toast.success(
          `Synced as ${res.login || "?"}: ${res.prs} PRs, ${res.contributions} contributions`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const stats = summary
    ? [
        { label: "Commits", value: summary.commits },
        { label: "PRs", value: summary.pullRequests },
        { label: "Reviews", value: summary.reviews },
        { label: "Issues", value: summary.issues },
      ]
    : [];

  return (
    <Page className="max-w-6xl">
      <PageHeader
        title="Activity"
        description="Your GitHub activity and delivery velocity."
        icon={Activity}
        actions={
          <Button
            variant="outline"
            onClick={runSync}
            disabled={sync.isPending}
          >
            <RefreshCw className={cn("size-4", sync.isPending && "animate-spin")} />
            Sync GitHub
          </Button>
        }
      />

      {!config?.hasToken ? (
        <div className="mb-6">
          <EmptyState
            icon={GitPullRequest}
            title="Connect GitHub"
            description="Add a GitHub token in Settings to see your PRs, reviews, and contribution activity here. Your local velocity charts work without it."
          />
        </div>
      ) : null}

      {summary ? (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4">
                <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
                <div className="text-muted-foreground text-xs">{s.label} (last year)</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GitHub contributions / week</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ghConfig} className="h-[220px] w-full">
              <BarChart data={ghWeekly}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Throughput / week</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={tpConfig} className="h-[220px] w-full">
              <BarChart data={throughput}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="tasks" stackId="a" fill="var(--color-tasks)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="jira" stackId="a" fill="var(--color-jira)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <p className="text-muted-foreground mt-2 text-xs">
              Tasks &amp; JIRA issues you moved to Done each week.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wins / month</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={winsConfig} className="h-[220px] w-full">
              <BarChart data={winsMonthly}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="wins" fill="var(--color-wins)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent GitHub activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!events || events.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No recent events. Sync GitHub to populate this.
              </p>
            ) : (
              <div className="max-h-[220px] space-y-2 overflow-auto">
                {events.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => e.url && openUrl(e.url)}
                    className="hover:bg-muted/50 flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-sm"
                  >
                    <span className="flex-1 truncate">{e.title}</span>
                    {e.createdAt ? (
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {format(new Date(e.createdAt), "MMM d")}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Pull requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="author">
            <TabsList>
              <TabsTrigger value="author">Authored ({authored?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="reviewer">Reviewed ({reviewed?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="commenter">Commented ({commented?.length ?? 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="author">
              <PrList prs={authored} />
            </TabsContent>
            <TabsContent value="reviewer">
              <PrList prs={reviewed} />
            </TabsContent>
            <TabsContent value="commenter">
              <PrList prs={commented} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Page>
  );
}
