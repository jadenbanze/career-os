import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Award, CalendarDays, CheckCircle2, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

import { useAppActions } from "@/components/layout/app-actions";
import { Page, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  todayKey,
  useDailyNote,
  useSaveDailyNote,
  useTodayRollup,
} from "@/features/today/use-today";

function Section({
  icon: Icon,
  title,
  items,
  empty,
}: {
  icon: typeof Award;
  title: string;
  items: { id: string; label: string }[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4" />
          {title}
          <span className="text-muted-foreground font-normal">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((i) => (
              <li key={i.id} className="truncate text-sm">
                {i.label}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function TodayPage() {
  const date = todayKey();
  const { data: rollup } = useTodayRollup();
  const { data: note } = useDailyNote(date);
  const save = useSaveDailyNote();
  const actions = useAppActions();

  const [text, setText] = useState("");
  useEffect(() => {
    setText(note?.notes ?? "");
  }, [note]);

  const saveNote = () => {
    save.mutate(
      { date, notes: text },
      { onSuccess: () => toast.success("Journal saved") },
    );
  };

  return (
    <Page>
      <PageHeader
        title="Today"
        description={format(new Date(), "EEEE, MMMM d, yyyy")}
        icon={CalendarDays}
        actions={
          <Button onClick={() => actions.openQuickCapture()}>
            <Plus className="size-4" />
            Capture
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={saveNote}
              rows={5}
              placeholder="How did today go? What did you learn or ship?"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={saveNote} disabled={save.isPending}>
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Section
            icon={Award}
            title="Wins logged"
            empty="No wins logged today."
            items={(rollup?.wins ?? []).map((w) => ({ id: w.id, label: w.title }))}
          />
          <Section
            icon={CheckCircle2}
            title="Tasks completed"
            empty="Nothing marked done today."
            items={(rollup?.doneTasks ?? []).map((t) => ({ id: t.id, label: t.title }))}
          />
          <Section
            icon={Clock}
            title="Events"
            empty="No events dated today."
            items={(rollup?.events ?? []).map((e) => ({ id: e.id, label: e.title }))}
          />
        </div>
      </div>
    </Page>
  );
}
