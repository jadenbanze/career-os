import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { desc } from "drizzle-orm";

import { db } from "@/db/client";
import { jiraIssues } from "@/db/schema";
import {
  getSetting,
  JIRA_EMAIL_KEY,
  JIRA_SITE_KEY,
} from "@/features/settings/use-settings";

const KEY = ["jira", "issues"];

function normalizeSite(site: string): string {
  return site.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function useJiraIssues() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () =>
      db.select().from(jiraIssues).orderBy(desc(jiraIssues.updated)),
  });
}

type RawIssue = {
  key: string;
  fields?: {
    summary?: string;
    status?: { name?: string; statusCategory?: { name?: string } };
    priority?: { name?: string };
    issuetype?: { name?: string };
    assignee?: { displayName?: string };
    project?: { name?: string };
    updated?: string;
  };
};

export function useSyncJira() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const [site, email] = await Promise.all([
        getSetting(JIRA_SITE_KEY),
        getSetting(JIRA_EMAIL_KEY),
      ]);
      if (!site || !email) {
        throw new Error("Add your JIRA site and email in Settings first.");
      }

      const data = await invoke<{ issues?: RawIssue[] }>("jira_fetch_issues", {
        site,
        email,
        jql: null,
        maxResults: 100,
      });

      const base = normalizeSite(site);
      const issues = Array.isArray(data?.issues) ? data.issues : [];
      const rows = issues.map((it) => ({
        key: it.key,
        summary: it.fields?.summary ?? "(no summary)",
        status: it.fields?.status?.name ?? null,
        statusCategory: it.fields?.status?.statusCategory?.name ?? null,
        priority: it.fields?.priority?.name ?? null,
        issueType: it.fields?.issuetype?.name ?? null,
        assignee: it.fields?.assignee?.displayName ?? null,
        project: it.fields?.project?.name ?? null,
        url: `https://${base}/browse/${it.key}`,
        updated: it.fields?.updated ? new Date(it.fields.updated) : null,
        raw: JSON.stringify(it),
        syncedAt: new Date(),
      }));

      await db.delete(jiraIssues);
      if (rows.length > 0) {
        await db.insert(jiraIssues).values(rows);
      }
      return rows.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
