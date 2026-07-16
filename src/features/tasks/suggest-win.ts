import { toast } from "sonner";

import type { Task } from "@/db/schema";
import type { BragDefaults } from "@/features/brag/brag-dialog";
import type { BragLink } from "@/features/brag/links";

/**
 * Prompts the user (via a toast action) to log a brag-sheet win when they
 * complete a task, pre-linking the task (and its JIRA issue, if any).
 */
export function suggestWin(task: Task, openBrag: (d?: BragDefaults) => void) {
  const links: BragLink[] = [{ type: "task", id: task.id, label: task.title }];
  if (task.jiraKey) {
    links.push({ type: "jira", id: task.jiraKey, label: task.jiraKey });
  }
  toast("Task completed", {
    description: "Want to log this as a win?",
    action: {
      label: "Log a win",
      onClick: () => openBrag({ title: task.title, links }),
    },
  });
}
