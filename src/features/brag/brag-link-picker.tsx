import { useState } from "react";
import { ListTodo, Link2, Plus, TrendingUp, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useJiraIssues } from "@/features/jira/use-jira";
import { usePromotionMilestones } from "@/features/promotion/use-promotion";
import { useTasks } from "@/features/tasks/use-tasks";
import type { BragLink } from "./links";

const TYPE_ICON = {
  task: ListTodo,
  jira: Link2,
  milestone: TrendingUp,
} as const;

export function BragLinkPicker({
  value,
  onChange,
}: {
  value: BragLink[];
  onChange: (links: BragLink[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: tasks } = useTasks();
  const { data: jira } = useJiraIssues();
  const { data: milestones } = usePromotionMilestones();

  const has = (type: string, id: string) =>
    value.some((l) => l.type === type && l.id === id);

  const add = (link: BragLink) => {
    if (!has(link.type, link.id)) onChange([...value, link]);
    setOpen(false);
  };
  const remove = (link: BragLink) =>
    onChange(value.filter((l) => !(l.type === link.type && l.id === link.id)));

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((l) => {
            const Icon = TYPE_ICON[l.type];
            return (
              <Badge key={`${l.type}:${l.id}`} variant="secondary" className="gap-1">
                <Icon className="size-3" />
                <span className="max-w-40 truncate">{l.label}</span>
                <button
                  type="button"
                  onClick={() => remove(l)}
                  className="hover:text-foreground ml-0.5"
                  aria-label="Remove link"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus className="size-4" />
            Add link
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Link a task, issue, or milestone…" />
            <CommandList>
              <CommandEmpty>Nothing to link yet.</CommandEmpty>
              {tasks && tasks.length > 0 ? (
                <CommandGroup heading="Tasks">
                  {tasks.map((t) => (
                    <CommandItem
                      key={`task-${t.id}`}
                      value={`task ${t.title}`}
                      onSelect={() => add({ type: "task", id: t.id, label: t.title })}
                    >
                      <ListTodo className="size-4" />
                      <span className="truncate">{t.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {jira && jira.length > 0 ? (
                <CommandGroup heading="JIRA">
                  {jira.map((j) => (
                    <CommandItem
                      key={`jira-${j.key}`}
                      value={`jira ${j.key} ${j.summary}`}
                      onSelect={() =>
                        add({ type: "jira", id: j.key, label: `${j.key} ${j.summary}` })
                      }
                    >
                      <Link2 className="size-4" />
                      <span className="font-mono text-xs">{j.key}</span>
                      <span className="truncate">{j.summary}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {milestones && milestones.length > 0 ? (
                <CommandGroup heading="Milestones">
                  {milestones.map((m) => (
                    <CommandItem
                      key={`ms-${m.id}`}
                      value={`milestone ${m.title}`}
                      onSelect={() =>
                        add({ type: "milestone", id: m.id, label: m.title })
                      }
                    >
                      <TrendingUp className="size-4" />
                      <span className="truncate">{m.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
