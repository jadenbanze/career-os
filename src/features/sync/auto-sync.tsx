import { useEffect, useRef } from "react";

import { useGithubConfig, useSyncGithub } from "@/features/github/use-github";
import { useSyncJira } from "@/features/jira/use-jira";
import { useJiraConfig } from "@/features/settings/use-settings";

const INTERVAL_MS = 15 * 60 * 1000;
const INITIAL_DELAY_MS = 1500;

/**
 * Silently refreshes the JIRA and GitHub caches on launch and every 15 minutes,
 * but only for connections that are configured. Renders nothing.
 */
export function AutoSync() {
  const { data: jira } = useJiraConfig();
  const { data: github } = useGithubConfig();
  const syncJira = useSyncJira();
  const syncGithub = useSyncGithub();

  const jiraReady = Boolean(jira?.site && jira?.email && jira?.hasToken);
  const ghReady = Boolean(github?.hasToken);

  // Latest values for the timer callbacks (mutation objects change each render).
  const ref = useRef({ jiraReady, ghReady, syncJira, syncGithub });
  ref.current = { jiraReady, ghReady, syncJira, syncGithub };

  useEffect(() => {
    if (!jiraReady && !ghReady) return;
    const run = () => {
      const r = ref.current;
      if (r.jiraReady && !r.syncJira.isPending) {
        r.syncJira.mutateAsync().catch(() => {});
      }
      if (r.ghReady && !r.syncGithub.isPending) {
        r.syncGithub.mutateAsync().catch(() => {});
      }
    };
    const initial = setTimeout(run, INITIAL_DELAY_MS);
    const interval = setInterval(run, INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [jiraReady, ghReady]);

  return null;
}
