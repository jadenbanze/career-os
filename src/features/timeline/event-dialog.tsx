import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
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
import type { TimelineEvent } from "@/db/schema";
import { RelatedItems } from "@/features/links/related-items";
import { parseTags, serializeTags } from "@/features/tags/use-tags";
import { EVENT_CATEGORIES, useCreateEvent, useUpdateEvent } from "./use-timeline";

export function EventDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: TimelineEvent | null;
}) {
  const isEdit = Boolean(event);
  const create = useCreateEvent();
  const update = useUpdateEvent();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [category, setCategory] = useState("personal");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(event?.title ?? "");
    setDate(event?.date ? new Date(event.date) : new Date());
    setCategory(event?.category ?? "personal");
    setNotes(event?.notes ?? "");
    setTags(parseTags(event?.tags).join(", "));
  }, [open, event]);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      title: title.trim(),
      date: date ?? new Date(),
      category,
      notes: notes.trim() || null,
      tags: serializeTags(tags),
    };
    try {
      if (isEdit && event) {
        await update.mutateAsync({ id: event.id, ...payload });
        toast.success("Event updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Event added");
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
          <DialogTitle>{isEdit ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ev-title">Event</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Started a new role, shipped a big launch..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ev-date">Date</Label>
              <DatePicker id="ev-date" value={date} onChange={setDate} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-notes">Notes</Label>
            <Textarea
              id="ev-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything worth remembering..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-tags">Tags</Label>
            <Input
              id="ev-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="promotion, milestone"
            />
          </div>
          {isEdit && event ? <RelatedItems type="event" id={event.id} /> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {isEdit ? "Save changes" : "Add event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
