import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, copyFile, mkdir } from "@tauri-apps/plugin-fs";
import { ImagePlus } from "lucide-react";
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
import type { VisionItem } from "@/db/schema";
import { useCreateVisionItem, useUpdateVisionItem } from "./use-vision";

export const VISION_CATEGORIES = [
  "Career",
  "Learning",
  "Lifestyle",
  "Financial",
  "Health",
  "Other",
] as const;

export function VisionDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: VisionItem | null;
}) {
  const isEdit = Boolean(item);
  const create = useCreateVisionItem();
  const update = useUpdateVisionItem();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Career");
  const [imagePath, setImagePath] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(item?.title ?? "");
    setCategory(item?.category ?? "Career");
    setImagePath(item?.imagePath ?? "");
    setNote(item?.note ?? "");
  }, [open, item]);

  const uploadImage = async () => {
    try {
      const selected = await openFileDialog({
        multiple: false,
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp"] },
        ],
      });
      if (!selected || typeof selected !== "string") return;
      const ext = selected.split(".").pop() || "png";
      const name = `${crypto.randomUUID()}.${ext}`;
      await mkdir("vision", { baseDir: BaseDirectory.AppLocalData, recursive: true });
      await copyFile(selected, `vision/${name}`, {
        toPathBaseDir: BaseDirectory.AppLocalData,
      });
      const abs = await join(await appLocalDataDir(), "vision", name);
      setImagePath(abs);
      toast.success("Image added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const previewSrc = imagePath
    ? /^https?:\/\//.test(imagePath)
      ? imagePath
      : convertFileSrc(imagePath)
    : "";

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      title: title.trim(),
      category,
      imagePath: imagePath.trim() || null,
      note: note.trim() || null,
    };
    try {
      if (isEdit && item) {
        await update.mutateAsync({ id: item.id, ...payload });
        toast.success("Card updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Card added");
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
          <DialogTitle>{isEdit ? "Edit card" : "New vision card"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vi-title">Title</Label>
            <Input
              id="vi-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Become a staff engineer"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISION_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vi-image">Image (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="vi-image"
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
                placeholder="Paste a URL or upload…"
              />
              <Button type="button" variant="outline" onClick={uploadImage}>
                <ImagePlus className="size-4" />
                Upload
              </Button>
            </div>
            {previewSrc ? (
              <div className="bg-muted mt-1 aspect-video w-full overflow-hidden rounded-md">
                <img
                  src={previewSrc}
                  alt=""
                  className="size-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vi-note">Note</Label>
            <Textarea
              id="vi-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Why this matters to you..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {isEdit ? "Save changes" : "Add card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
