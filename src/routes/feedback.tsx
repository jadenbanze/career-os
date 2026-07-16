import { useState } from "react";
import { format } from "date-fns";
import { Award, MessageSquare, MoreHorizontal, Plus, Users } from "lucide-react";
import { toast } from "sonner";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Feedback, OneOnOne } from "@/db/schema";
import { useCreateBrag } from "@/features/brag/use-brag";
import {
  FeedbackDialog,
  OneOnOneDialog,
} from "@/features/feedback/feedback-dialogs";
import {
  useDeleteFeedback,
  useDeleteOneOnOne,
  useFeedback,
  useOneOnOnes,
} from "@/features/feedback/use-feedback";
import { cn } from "@/lib/utils";

const KIND_TONE: Record<string, string> = {
  praise: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  constructive: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  other: "bg-muted text-muted-foreground",
};

function OneOnOnesTab() {
  const { data: notes } = useOneOnOnes();
  const del = useDeleteOneOnOne();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OneOnOne | null>(null);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          New 1:1 note
        </Button>
      </div>
      {!notes || notes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No 1:1 notes yet"
          description="Keep a running log of your 1:1s so nothing slips through the cracks."
        />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <Card key={n.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <h3 className="font-medium">{n.person || "1:1"}</h3>
                  <p className="text-muted-foreground text-xs">
                    {format(new Date(n.date), "MMMM d, yyyy")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(n);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={async () => {
                        await del.mutateAsync(n.id);
                        toast.success("Note deleted");
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              {n.notes ? (
                <CardContent>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {n.notes}
                  </p>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}
      <OneOnOneDialog open={open} onOpenChange={setOpen} note={editing} />
    </div>
  );
}

function FeedbackTab() {
  const { data: entries } = useFeedback();
  const del = useDeleteFeedback();
  const createBrag = useCreateBrag();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Feedback | null>(null);

  const logAsWin = async (entry: Feedback) => {
    await createBrag.mutateAsync({
      title: `Feedback${entry.source ? ` from ${entry.source}` : ""}`,
      description: entry.content,
      date: new Date(entry.date),
      tags: JSON.stringify(["feedback"]),
    });
    toast.success("Added to your brag sheet");
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Log feedback
        </Button>
      </div>
      {!entries || entries.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback logged"
          description="Capture praise and constructive feedback — turn the good stuff into brag-sheet wins."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((f) => (
            <Card key={f.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{f.source || "Feedback"}</h3>
                  <Badge variant="secondary" className={cn("border-0 capitalize", KIND_TONE[f.kind])}>
                    {f.kind}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(f.date), "MMM d, yyyy")}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => logAsWin(f)}>
                      <Award className="size-4" />
                      Log as win
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(f);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={async () => {
                        await del.mutateAsync(f.id);
                        toast.success("Feedback deleted");
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{f.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <FeedbackDialog open={open} onOpenChange={setOpen} entry={editing} />
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Page>
      <PageHeader
        title="1:1s & Feedback"
        description="Meeting notes and the feedback you receive."
        icon={MessageSquare}
      />
      <Tabs defaultValue="feedback">
        <TabsList>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="oneonones">1:1 Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="feedback">
          <FeedbackTab />
        </TabsContent>
        <TabsContent value="oneonones">
          <OneOnOnesTab />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
