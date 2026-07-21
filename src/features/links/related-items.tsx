import { useState } from "react";
import { Link2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ENTITY_LABEL,
  relatedFor,
  useAddLink,
  useLinkables,
  useLinks,
  useRemoveLink,
  type EntityType,
} from "./use-links";

/**
 * A reusable "Linked & related" panel: shows items linked to (type,id) in either
 * direction, with a search-to-link picker across every entity. Render only for
 * saved items (needs a real id).
 */
export function RelatedItems({ type, id }: { type: EntityType; id: string }) {
  const { data: all = [] } = useLinks();
  const { data: linkables = [] } = useLinkables();
  const add = useAddLink();
  const remove = useRemoveLink();
  const [open, setOpen] = useState(false);

  const byKey = new Map(linkables.map((l) => [`${l.type}:${l.id}`, l]));
  const related = relatedFor(all, type, id);
  const linkedKeys = new Set(related.map((r) => `${r.type}:${r.id}`));
  const options = linkables.filter(
    (l) => !(l.type === type && l.id === id) && !linkedKeys.has(`${l.type}:${l.id}`),
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Linked &amp; related</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Link2 className="size-3" />
              Link
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search items to link…" />
              <CommandList>
                <CommandEmpty>Nothing to link.</CommandEmpty>
                {options.map((o) => (
                  <CommandItem
                    key={`${o.type}:${o.id}`}
                    value={`${o.title} ${ENTITY_LABEL[o.type]}`}
                    onSelect={() => {
                      add.mutate({
                        sourceType: type,
                        sourceId: id,
                        targetType: o.type,
                        targetId: o.id,
                      });
                      setOpen(false);
                    }}
                  >
                    <Badge variant="secondary" className="mr-2 shrink-0">
                      {ENTITY_LABEL[o.type]}
                    </Badge>
                    <span className="truncate">{o.title}</span>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {related.length === 0 ? (
        <p className="text-muted-foreground text-xs">Nothing linked yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {related.map((r) => {
            const item = byKey.get(`${r.type}:${r.id}`);
            return (
              <span
                key={r.linkId}
                className="bg-muted/50 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
              >
                <span className="text-muted-foreground">{ENTITY_LABEL[r.type]}</span>
                <span className="max-w-[160px] truncate">
                  {item?.title ?? "(deleted)"}
                </span>
                <button
                  type="button"
                  onClick={() => remove.mutate(r.linkId)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove link"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
