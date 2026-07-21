import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppActions } from "./app-actions";

export function QuickCaptureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const actions = useAppActions();
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const submit = () => {
    const clean = text.trim();
    if (!clean) return;
    actions.captureToInbox(clean);
    toast.success("Captured to Inbox", {
      description: "AI is sorting it — review and file it from your Inbox.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick capture</DialogTitle>
          <DialogDescription>
            Dump anything — a win, task, or event. It lands in your Inbox and AI
            categorizes it so you can organize later.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="e.g. At the MongoDB event networking with the data platform team"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Sparkles className="size-3" />
            AI will categorize this · Enter to capture
          </span>
          <Button onClick={submit}>Capture</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
