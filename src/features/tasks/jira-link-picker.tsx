import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

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
import { cn } from "@/lib/utils";

export function JiraLinkPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (key: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: issues } = useJiraIssues();
  const selected = issues?.find((i) => i.key === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="font-mono text-xs">{value}</span>
              <span className="text-muted-foreground truncate">
                {selected?.summary}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Link a JIRA issue…</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search issues…" />
          <CommandList>
            <CommandEmpty>No synced issues — sync JIRA first.</CommandEmpty>
            <CommandGroup>
              {value ? (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <X className="size-4" />
                  Clear link
                </CommandItem>
              ) : null}
              {(issues ?? []).map((issue) => (
                <CommandItem
                  key={issue.key}
                  value={`${issue.key} ${issue.summary}`}
                  onSelect={() => {
                    onChange(issue.key);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === issue.key ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="font-mono text-xs">{issue.key}</span>
                  <span className="truncate">{issue.summary}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
