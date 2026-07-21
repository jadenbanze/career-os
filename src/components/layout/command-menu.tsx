import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  CalendarClock,
  Link2,
  ListTodo,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useBragEntries } from "@/features/brag/use-brag";
import { useCareerGoals } from "@/features/career/use-career";
import { useGithubPrs, useSyncGithub } from "@/features/github/use-github";
import { useSyncJira } from "@/features/jira/use-jira";
import { useTasks } from "@/features/tasks/use-tasks";
import { useTimelineEvents } from "@/features/timeline/use-timeline";
import { allNav } from "@/lib/navigation";
import { useAppActions } from "./app-actions";

const MAX_RESULTS = 25;

export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const actions = useAppActions();
  const [search, setSearch] = useState("");

  const syncJira = useSyncJira();
  const syncGithub = useSyncGithub();
  const { data: tasks } = useTasks();
  const { data: brag } = useBragEntries();
  const { data: goals } = useCareerGoals();
  const { data: events } = useTimelineEvents();
  const { data: prs } = useGithubPrs();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    // Defer so the dialog closes before the next one opens.
    setTimeout(fn, 0);
  };

  const runSync = (
    label: string,
    mut: { mutateAsync: () => Promise<unknown> },
  ) => {
    onOpenChange(false);
    toast.promise(mut.mutateAsync(), {
      loading: `Syncing ${label}…`,
      success: `${label} synced`,
      error: (e) => (e instanceof Error ? e.message : String(e)),
    });
  };

  const go = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  const q = search.trim().length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search or run a command…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            value="quick capture inbox organize later"
            onSelect={() => run(actions.openQuickCapture)}
          >
            <Zap />
            <span>Capture to Inbox</span>
          </CommandItem>
          <CommandItem value="new task" onSelect={() => run(actions.openTask)}>
            <Plus />
            <span>New task</span>
          </CommandItem>
          <CommandItem value="log a win brag" onSelect={() => run(() => actions.openBrag())}>
            <Award />
            <span>Log a win</span>
          </CommandItem>
          <CommandItem value="new milestone promotion" onSelect={() => run(actions.openMilestone)}>
            <TrendingUp />
            <span>New milestone</span>
          </CommandItem>
          <CommandItem value="new goal career" onSelect={() => run(actions.openGoal)}>
            <Rocket />
            <span>New career goal</span>
          </CommandItem>
          <CommandItem value="new event timeline" onSelect={() => run(actions.openEvent)}>
            <CalendarClock />
            <span>New timeline event</span>
          </CommandItem>
          <CommandItem value="new vision card" onSelect={() => run(actions.openVision)}>
            <Sparkles />
            <span>New vision card</span>
          </CommandItem>
          <CommandItem value="sync jira" onSelect={() => runSync("JIRA", syncJira)}>
            <RefreshCw />
            <span>Sync JIRA</span>
          </CommandItem>
          <CommandItem value="sync github" onSelect={() => runSync("GitHub", syncGithub)}>
            <RefreshCw />
            <span>Sync GitHub</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          {allNav.map((item) => (
            <CommandItem key={item.url} value={`go ${item.title}`} onSelect={() => go(item.url)}>
              <item.icon />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {q ? (
          <>
            {tasks && tasks.length > 0 ? (
              <CommandGroup heading="Tasks">
                {tasks.slice(0, MAX_RESULTS).map((t) => (
                  <CommandItem key={t.id} value={`task ${t.title}`} onSelect={() => go("/tasks")}>
                    <ListTodo />
                    <span className="truncate">{t.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {brag && brag.length > 0 ? (
              <CommandGroup heading="Wins">
                {brag.slice(0, MAX_RESULTS).map((b) => (
                  <CommandItem key={b.id} value={`win ${b.title}`} onSelect={() => go("/brag")}>
                    <Award />
                    <span className="truncate">{b.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {goals && goals.length > 0 ? (
              <CommandGroup heading="Goals">
                {goals.slice(0, MAX_RESULTS).map((g) => (
                  <CommandItem key={g.id} value={`goal ${g.title}`} onSelect={() => go("/career")}>
                    <Rocket />
                    <span className="truncate">{g.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {events && events.length > 0 ? (
              <CommandGroup heading="Timeline">
                {events.slice(0, MAX_RESULTS).map((e) => (
                  <CommandItem key={e.id} value={`event ${e.title}`} onSelect={() => go("/timeline")}>
                    <CalendarClock />
                    <span className="truncate">{e.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {prs && prs.length > 0 ? (
              <CommandGroup heading="Pull requests">
                {prs.slice(0, MAX_RESULTS).map((p) => (
                  <CommandItem key={p.id} value={`pr ${p.repo} ${p.title}`} onSelect={() => go("/activity")}>
                    <Link2 />
                    <span className="truncate">{p.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
