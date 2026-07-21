import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Award,
  Link2,
  ListTodo,
  MoreHorizontal,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm";
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
import type { BragEntry } from "@/db/schema";
import { BragDialog } from "@/features/brag/brag-dialog";
import { parseLinks, type BragLinkType } from "@/features/brag/links";
import { parseTags, useBragEntries, useDeleteBrag } from "@/features/brag/use-brag";

const LINK_ICON = {
  task: ListTodo,
  jira: Link2,
  milestone: TrendingUp,
} as const;

const LINK_DEST: Record<BragLinkType, string> = {
  task: "/tasks",
  jira: "/tasks",
  milestone: "/promotion",
};

function BragCard({ entry, onEdit }: { entry: BragEntry; onEdit: (e: BragEntry) => void }) {
  const del = useDeleteBrag();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const tags = parseTags(entry.tags);
  const links = parseLinks(entry.links);
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{entry.title}</h3>
          </div>
          <p className="text-muted-foreground text-xs">
            {format(new Date(entry.date), "MMMM d, yyyy")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(entry)}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={async () => {
                if (
                  !(await confirm({
                    title: "Delete win?",
                    description: `"${entry.title}" will be permanently removed.`,
                    confirmText: "Delete",
                    destructive: true,
                  }))
                )
                  return;
                await del.mutateAsync(entry.id);
                toast.success("Win deleted");
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        {entry.impact ? (
          <div className="bg-muted/50 flex items-start gap-2 rounded-md p-2.5">
            <Sparkles className="text-amber-500 mt-0.5 size-4 shrink-0" />
            <p className="text-sm">{entry.impact}</p>
          </div>
        ) : null}
        {entry.description ? (
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {entry.description}
          </p>
        ) : null}
        {tags.length > 0 || links.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {links.map((l) => {
              const Icon = LINK_ICON[l.type];
              return (
                <Badge
                  key={`${l.type}:${l.id}`}
                  variant="outline"
                  className="hover:bg-muted cursor-pointer gap-1"
                  onClick={() => navigate(LINK_DEST[l.type])}
                >
                  <Icon className="size-3" />
                  <span className="max-w-40 truncate">{l.label}</span>
                </Badge>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function BragSheetPage() {
  const { data: entries, isLoading } = useBragEntries();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BragEntry | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (entry: BragEntry) => {
    setEditing(entry);
    setDialogOpen(true);
  };

  return (
    <Page>
      <PageHeader
        title="Brag Sheet"
        description="Capture your wins while they're fresh — future-you will thank you at review time."
        icon={Award}
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Log a win
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No wins logged yet"
          description="Every accomplishment counts. Log your first win to start building your brag sheet."
          action={
            <Button onClick={openNew}>
              <Plus className="size-4" />
              Log a win
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <BragCard key={entry.id} entry={entry} onEdit={openEdit} />
          ))}
        </div>
      )}

      <BragDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} />
    </Page>
  );
}
