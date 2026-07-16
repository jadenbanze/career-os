import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateBrag } from "@/features/brag/use-brag";
import { useCreateTask } from "@/features/tasks/use-tasks";
import { useCreateEvent } from "@/features/timeline/use-timeline";

const TYPES = [
  { value: "task", label: "Task" },
  { value: "win", label: "Win" },
  { value: "event", label: "Event" },
] as const;

export function QuickCaptureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<string>("task");
  const [text, setText] = useState("");
  const createTask = useCreateTask();
  const createBrag = useCreateBrag();
  const createEvent = useCreateEvent();

  useEffect(() => {
    if (open) {
      setText("");
      setType("task");
    }
  }, [open]);

  const submit = async () => {
    const title = text.trim();
    if (!title) return;
    try {
      if (type === "task") await createTask.mutateAsync({ title });
      else if (type === "win") await createBrag.mutateAsync({ title });
      else await createEvent.mutateAsync({ title, date: new Date() });
      toast.success("Captured");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick capture</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {TYPES.map((t) => (
              <Button
                key={t.value}
                type="button"
                variant={type === t.value ? "default" : "outline"}
                size="sm"
                onClick={() => setType(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Type it and hit Enter…"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
