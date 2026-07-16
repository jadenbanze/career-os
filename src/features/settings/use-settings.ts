import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { appSettings } from "@/db/schema";

export const JIRA_SITE_KEY = "jira_site";
export const JIRA_EMAIL_KEY = "jira_email";
export const JIRA_TOKEN_ACCOUNT = "jira_api_token";

const JIRA_CONFIG_KEY = ["settings", "jira"];

export async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export type JiraConfig = { site: string; email: string; hasToken: boolean };

export function useJiraConfig() {
  return useQuery<JiraConfig>({
    queryKey: JIRA_CONFIG_KEY,
    queryFn: async () => {
      const [site, email, hasToken] = await Promise.all([
        getSetting(JIRA_SITE_KEY),
        getSetting(JIRA_EMAIL_KEY),
        invoke<boolean>("has_secret", { account: JIRA_TOKEN_ACCOUNT }),
      ]);
      return { site: site ?? "", email: email ?? "", hasToken };
    },
  });
}

export function useSaveJiraConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      site,
      email,
      token,
    }: {
      site: string;
      email: string;
      token?: string;
    }) => {
      await setSetting(JIRA_SITE_KEY, site.trim());
      await setSetting(JIRA_EMAIL_KEY, email.trim());
      if (token && token.length > 0) {
        await invoke("set_secret", {
          account: JIRA_TOKEN_ACCOUNT,
          secret: token,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JIRA_CONFIG_KEY }),
  });
}

export function useClearJiraToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await invoke("delete_secret", { account: JIRA_TOKEN_ACCOUNT });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JIRA_CONFIG_KEY }),
  });
}
