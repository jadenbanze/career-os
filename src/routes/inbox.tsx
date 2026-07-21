import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Inbox, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { useAppActions } from "@/components/layout/app-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { InboxItem } from "@/db/schema";
import { INBOX_CATEGORIES, type InboxCategory } from "@/features/ai/use-ai";
import {
  useDismissInboxItem,
  useEnrichInboxItem,
  useFileInboxItem,
  useInboxItems,
} from "@/features/inbox/use-inbox";

const CATEGORY_LABELS: Record<InboxCategory, string> = {
  win: "Win (brag sheet)",
  task: "Task",
  event: "Timeline event",
  goal: "Career goal",
  feedback: "Feedback",
  milestone: "Promotion milestone",
};

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const p = JSON.parse(tags);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

function InboxCard({ item }: { item: InboxItem }) {
  const file = useFileInboxItem();
  const dismiss = useDismissInboxItem();
  const enrich = useEnrichInboxItem();

  const [category, setCategory] = useState<InboxCategory>(
    (item.category as InboxCategory) ?? "win",
  );
  const [title, setTitle] = useState(item.title ?? item.text);
  const [details, setDetails] = useState(item.details ?? "");
  const [size, setSize] = useState(item.size ?? "medium");
  const [tags, setTags] = useState(parseTags(item.tags).join(", "));

  const loading = item.aiState === "loading";

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
          <div className="min-w-0">
            <p className="truncate text-sm">{item.text}</p>
            <p className="text-muted-foreground text-xs">Categorizing with AI…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onFile = async () => {
    await file.mutateAsync({
      id: item.id,
      category,
      title,
      details,
      size: category === "win" ? size : null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    toast.success(`Filed as ${CATEGORY_LABELS[category].toLowerCase()}`);
  };

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-muted-foreground text-xs italic">"{item.text}"</p>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => enrich.mutate({ id: item.id, text: item.text })}
              disabled={enrich.isPending}
              title="Re-run AI"
            >
              <Sparkles className="size-3" />
              Redo
            </Button>
          </div>
        </div>

        {item.aiState === "error" ? (
          <p className="text-muted-foreground text-xs">
            AI was unavailable — used a quick guess. Edit and file below.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="space-y-2">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as InboxCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INBOX_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Details</Label>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            placeholder="Optional context…"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {category === "win" ? (
            <div className="space-y-2">
              <Label className="text-xs">Win size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label className="text-xs">Tags</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma, separated"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={async () => {
                await dismiss.mutateAsync(item.id);
                toast.success("Dismissed");
              }}
            >
              <Trash2 className="size-4" />
              Dismiss
            </Button>
            <Button size="sm" onClick={onFile} disabled={file.isPending}>
              <Check className="size-4" />
              File it
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InboxPage() {
  const { data: items, isLoading } = useInboxItems();
  const actions = useAppActions();

  return (
    <Page>
      <PageHeader
        title="Inbox"
        description="Capture anything fast; AI sorts it. Review and file when you have a moment."
        icon={Inbox}
        actions={
          <Button onClick={() => actions.openQuickCapture()}>
            <Plus className="size-4" />
            Capture
          </Button>
        }
      />

      {isLoading ? null : !items || items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox zero"
          description="Hit ⌘⇧N anywhere to jot something down — a win, a task, an event. AI files it here for you to organize later."
          action={
            <Button onClick={() => actions.openQuickCapture()}>
              <Plus className="size-4" />
              Capture something
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <InboxCard key={`${item.id}:${item.aiState}`} item={item} />
          ))}
        </div>
      )}
    </Page>
  );
}
