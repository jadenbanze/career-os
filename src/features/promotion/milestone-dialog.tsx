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
import type { PromotionMilestone } from "@/db/schema";
import { RelatedItems } from "@/features/links/related-items";
import { parseTags, serializeTags } from "@/features/tags/use-tags";
import {
  MILESTONE_STATUSES,
  useCreateMilestone,
  useUpdateMilestone,
} from "./use-promotion";

export function MilestoneDialog({
  open,
  onOpenChange,
  milestone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: PromotionMilestone | null;
}) {
  const isEdit = Boolean(milestone);
  const create = useCreateMilestone();
  const update = useUpdateMilestone();

  const [title, setTitle] = useState("");
  const [targetLevel, setTargetLevel] = useState("");
  const [status, setStatus] = useState("not_started");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(milestone?.title ?? "");
    setTargetLevel(milestone?.targetLevel ?? "");
    setStatus(milestone?.status ?? "not_started");
    setDueDate(milestone?.dueDate ? new Date(milestone.dueDate) : null);
    setNotes(milestone?.notes ?? "");
    setTags(parseTags(milestone?.tags).join(", "));
  }, [open, milestone]);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      title: title.trim(),
      targetLevel: targetLevel.trim() || null,
      status,
      dueDate,
      notes: notes.trim() || null,
      tags: serializeTags(tags),
    };
    try {
      if (isEdit && milestone) {
        await update.mutateAsync({ id: milestone.id, ...payload });
        toast.success("Milestone updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Milestone added");
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
          <DialogTitle>{isEdit ? "Edit milestone" : "New milestone"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ms-title">Milestone</Label>
            <Input
              id="ms-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lead a cross-team project"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ms-level">Target level</Label>
              <Input
                id="ms-level"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                placeholder="Senior / L5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-due">Target date</Label>
              <DatePicker
                id="ms-due"
                value={dueDate}
                onChange={setDueDate}
                placeholder="No target date"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-notes">Notes / evidence</Label>
            <Textarea
              id="ms-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What does 'done' look like? Link supporting work..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-tags">Tags</Label>
            <Input
              id="ms-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="scope, leadership"
            />
          </div>
          {isEdit && milestone ? (
            <RelatedItems type="milestone" id={milestone.id} />
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {isEdit ? "Save changes" : "Add milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
