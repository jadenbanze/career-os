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
import type { Task } from "@/db/schema";
import { useAppActions } from "@/components/layout/app-actions";
import { RelatedItems } from "@/features/links/related-items";
import { TASK_PRIORITIES, TASK_STATUSES } from "./constants";
import { JiraLinkPicker } from "./jira-link-picker";
import { suggestWin } from "./suggest-win";
import { useCreateTask, useUpdateTask } from "./use-tasks";

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultStatus?: string;
}) {
  const isEdit = Boolean(task);
  const create = useCreateTask();
  const update = useUpdateTask();
  const actions = useAppActions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [jiraKey, setJiraKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setStatus(task?.status ?? defaultStatus ?? "todo");
    setPriority(task?.priority ?? "medium");
    setOwner(task?.owner ?? "");
    setDueDate(task?.dueDate ? new Date(task.dueDate) : null);
    setJiraKey(task?.jiraKey ?? null);
  }, [open, task, defaultStatus]);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      owner: owner.trim() || null,
      dueDate,
      jiraKey,
    };
    try {
      if (isEdit && task) {
        await update.mutateAsync({ id: task.id, ...payload });
        toast.success("Task updated");
        if (task.status !== "done" && status === "done") {
          suggestWin({ ...task, ...payload } as Task, actions.openBrag);
        }
      } else {
        await create.mutateAsync(payload);
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-[32rem] sm:max-w-[32rem]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              wrap="soft"
              className="h-32 max-h-32"
              placeholder="Add details, links, context..."
            />
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-4 [&>*]:min-w-0">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-owner">Owner</Label>
              <Input
                id="task-owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Who owns it?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <DatePicker
                id="task-due"
                value={dueDate}
                onChange={setDueDate}
                placeholder="No due date"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>JIRA issue</Label>
            <JiraLinkPicker value={jiraKey} onChange={setJiraKey} />
          </div>
          {isEdit && task ? <RelatedItems type="task" id={task.id} /> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending || update.isPending}
          >
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
