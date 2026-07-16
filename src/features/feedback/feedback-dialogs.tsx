import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Feedback, OneOnOne } from "@/db/schema";
import {
  FEEDBACK_KINDS,
  useCreateFeedback,
  useCreateOneOnOne,
  useUpdateFeedback,
  useUpdateOneOnOne,
} from "./use-feedback";

function toDateInput(d: Date | null | undefined): string {
  const dt = d ? new Date(d) : new Date();
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
}

export function OneOnOneDialog({
  open,
  onOpenChange,
  note,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: OneOnOne | null;
}) {
  const isEdit = Boolean(note);
  const create = useCreateOneOnOne();
  const update = useUpdateOneOnOne();

  const [person, setPerson] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setPerson(note?.person ?? "");
    setDate(toDateInput(note?.date ?? null));
    setNotes(note?.notes ?? "");
  }, [open, note]);

  const submit = async () => {
    const payload = {
      person: person.trim() || null,
      date: date ? new Date(date) : new Date(),
      notes: notes.trim() || null,
    };
    try {
      if (isEdit && note) {
        await update.mutateAsync({ id: note.id, ...payload });
        toast.success("Note updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("1:1 note saved");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit 1:1 note" : "New 1:1 note"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oo-person">With</Label>
              <Input
                id="oo-person"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Manager, mentor..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oo-date">Date</Label>
              <Input
                id="oo-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="oo-notes">Notes</Label>
            <Textarea
              id="oo-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Talking points, decisions, action items..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {isEdit ? "Save changes" : "Save note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FeedbackDialog({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Feedback | null;
}) {
  const isEdit = Boolean(entry);
  const create = useCreateFeedback();
  const update = useUpdateFeedback();

  const [source, setSource] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState("praise");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) return;
    setSource(entry?.source ?? "");
    setDate(toDateInput(entry?.date ?? null));
    setKind(entry?.kind ?? "praise");
    setContent(entry?.content ?? "");
  }, [open, entry]);

  const submit = async () => {
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    const payload = {
      source: source.trim() || null,
      date: date ? new Date(date) : new Date(),
      kind,
      content: content.trim(),
    };
    try {
      if (isEdit && entry) {
        await update.mutateAsync({ id: entry.id, ...payload });
        toast.success("Feedback updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Feedback saved");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit feedback" : "Log feedback"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fb-source">From</Label>
              <Input
                id="fb-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Who gave it?"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-date">Date</Label>
              <Input
                id="fb-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-content">Feedback</Label>
            <Textarea
              id="fb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="What was said..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {isEdit ? "Save changes" : "Save feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
