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
import { Textarea } from "@/components/ui/textarea";
import type { BragEntry } from "@/db/schema";
import { BragLinkPicker } from "./brag-link-picker";
import { parseLinks, serializeLinks, type BragLink } from "./links";
import { parseTags, useCreateBrag, useUpdateBrag } from "./use-brag";

export type BragDefaults = {
  title?: string;
  description?: string;
  links?: BragLink[];
};

export function BragDialog({
  open,
  onOpenChange,
  entry,
  defaults,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: BragEntry | null;
  defaults?: BragDefaults;
}) {
  const isEdit = Boolean(entry);
  const create = useCreateBrag();
  const update = useUpdateBrag();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [tags, setTags] = useState("");
  const [links, setLinks] = useState<BragLink[]>([]);

  useEffect(() => {
    if (!open) return;
    setTitle(entry?.title ?? defaults?.title ?? "");
    setDescription(entry?.description ?? defaults?.description ?? "");
    setImpact(entry?.impact ?? "");
    setDate(entry?.date ? new Date(entry.date) : new Date());
    setTags(parseTags(entry?.tags).join(", "));
    setLinks(entry ? parseLinks(entry.links) : (defaults?.links ?? []));
  }, [open, entry, defaults]);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      impact: impact.trim() || null,
      date: date ?? new Date(),
      tags: tagList.length ? JSON.stringify(tagList) : null,
      links: serializeLinks(links),
    };
    try {
      if (isEdit && entry) {
        await update.mutateAsync({ id: entry.id, ...payload });
        toast.success("Win updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Win logged");
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
          <DialogTitle>{isEdit ? "Edit win" : "Log a win"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brag-title">What did you accomplish?</Label>
            <Input
              id="brag-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Led the migration to..."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brag-impact">Impact</Label>
            <Input
              id="brag-impact"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="Cut build times 40%, unblocked 3 teams"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brag-desc">Details</Label>
            <Textarea
              id="brag-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Context, your specific contribution, links..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brag-date">Date</Label>
              <DatePicker id="brag-date" value={date} onChange={setDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brag-tags">Tags</Label>
              <Input
                id="brag-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="leadership, impact"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Linked to</Label>
            <BragLinkPicker value={links} onChange={setLinks} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending || update.isPending}
          >
            {isEdit ? "Save changes" : "Log win"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
