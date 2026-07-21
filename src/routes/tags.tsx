import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag as TagIcon, Tags as TagsIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  TAGGED_LABEL,
  TAGGED_ROUTE,
  useTaggedItems,
} from "@/features/tags/use-tags";

export default function TagsPage() {
  const { data: items = [], isLoading } = useTaggedItems();
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) for (const t of it.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items]);

  const filtered = useMemo(
    () => (active ? items.filter((i) => i.tags.includes(active)) : []),
    [items, active],
  );

  return (
    <Page>
      <PageHeader
        title="Tags"
        description="Browse your wins, goals, milestones, and events by theme."
        icon={TagsIcon}
      />

      {isLoading ? null : tagCounts.length === 0 ? (
        <EmptyState
          icon={TagsIcon}
          title="No tags yet"
          description="Add tags to a win, goal, milestone, or event and they'll show up here to browse by theme."
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {tagCounts.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActive(active === tag ? null : tag)}
              >
                <Badge
                  variant={active === tag ? "default" : "secondary"}
                  className="cursor-pointer gap-1"
                >
                  <TagIcon className="size-3" />
                  {tag}
                  <span className="opacity-60">{count}</span>
                </Badge>
              </button>
            ))}
          </div>

          {active ? (
            <div className="space-y-2">
              <h2 className="text-muted-foreground text-sm font-semibold">
                #{active} · {filtered.length}
              </h2>
              {filtered.map((it) => (
                <Card
                  key={`${it.type}:${it.id}`}
                  className="hover:border-primary/40 cursor-pointer transition-colors"
                  onClick={() => navigate(TAGGED_ROUTE[it.type])}
                >
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <span className="truncate">{it.title}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {TAGGED_LABEL[it.type]}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Select a tag to see everything filed under it.
            </p>
          )}
        </div>
      )}
    </Page>
  );
}
