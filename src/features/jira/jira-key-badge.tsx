import { openUrl } from "@tauri-apps/plugin-opener";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useJiraIssues } from "./use-jira";

export function JiraKeyBadge({
  issueKey,
  className,
}: {
  issueKey: string;
  className?: string;
}) {
  const { data: issues } = useJiraIssues();
  const issue = issues?.find((i) => i.key === issueKey);

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px]",
        issue?.url && "hover:bg-muted cursor-pointer",
        className,
      )}
      title={issue?.summary ?? issueKey}
      onClick={(e) => {
        e.stopPropagation();
        if (issue?.url) void openUrl(issue.url);
      }}
    >
      {issueKey}
    </Badge>
  );
}
