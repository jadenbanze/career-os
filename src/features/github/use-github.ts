import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { asc, desc } from "drizzle-orm";

import { db } from "@/db/client";
import { githubActivity, githubEvents, githubPrs } from "@/db/schema";
import { getSetting, setSetting } from "@/features/settings/use-settings";

export const GITHUB_USER_KEY = "github_user";
export const GITHUB_TOKEN_ACCOUNT = "github_token";
export const GITHUB_SUMMARY_KEY = "github_summary";

export type GithubSummary = {
  login?: string;
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
  totalContributions: number;
};

export type GithubConfig = { user: string; hasToken: boolean };

/**
 * Given an `X-GitHub-SSO` header value, returns the best URL to authorize the
 * token for the org (falls back to the tokens settings page).
 */
export function ssoAuthorizeUrl(sso?: string | null): string {
  const match = sso?.match(/url=([^;\s]+)/);
  return match ? match[1] : "https://github.com/settings/tokens";
}

export function useGithubConfig() {
  return useQuery<GithubConfig>({
    queryKey: ["settings", "github"],
    queryFn: async () => {
      const [user, hasToken] = await Promise.all([
        getSetting(GITHUB_USER_KEY),
        invoke<boolean>("has_secret", { account: GITHUB_TOKEN_ACCOUNT }),
      ]);
      return { user: user ?? "", hasToken };
    },
  });
}

export function useSaveGithubConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, token }: { user: string; token?: string }) => {
      await setSetting(GITHUB_USER_KEY, user.trim());
      if (token && token.length > 0) {
        await invoke("set_secret", { account: GITHUB_TOKEN_ACCOUNT, secret: token });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "github"] }),
  });
}

export function useClearGithubToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await invoke("delete_secret", { account: GITHUB_TOKEN_ACCOUNT });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "github"] }),
  });
}

export function useGithubPrs(role?: "author" | "reviewer" | "commenter") {
  return useQuery({
    queryKey: ["github", "prs", role ?? "all"],
    queryFn: async () => {
      const rows = await db
        .select()
        .from(githubPrs)
        .orderBy(desc(githubPrs.updated));
      return role ? rows.filter((r) => r.role === role) : rows;
    },
  });
}

export function useGithubEvents() {
  return useQuery({
    queryKey: ["github", "events"],
    queryFn: async () =>
      db.select().from(githubEvents).orderBy(desc(githubEvents.createdAt)),
  });
}

export function useGithubActivity() {
  return useQuery({
    queryKey: ["github", "activity"],
    queryFn: async () =>
      db.select().from(githubActivity).orderBy(asc(githubActivity.date)),
  });
}

export function useGithubSummary() {
  return useQuery({
    queryKey: ["github", "summary"],
    queryFn: async (): Promise<GithubSummary | null> => {
      const raw = await getSetting(GITHUB_SUMMARY_KEY);
      return raw ? (JSON.parse(raw) as GithubSummary) : null;
    },
  });
}

type SearchItem = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  repository_url?: string;
  updated_at?: string;
  user?: { login?: string };
  pull_request?: { merged_at?: string | null };
};

function repoFromUrl(url?: string): string {
  if (!url) return "";
  const i = url.indexOf("/repos/");
  return i >= 0 ? url.slice(i + 7) : url;
}

function mapPrs(data: { items?: SearchItem[] }, role: string) {
  return (data?.items ?? []).map((it) => {
    const repo = repoFromUrl(it.repository_url);
    const state = it.pull_request?.merged_at ? "merged" : it.state;
    return {
      id: `${role}:${repo}#${it.number}`,
      number: it.number,
      repo,
      title: it.title,
      state,
      role,
      url: it.html_url,
      authorLogin: it.user?.login ?? null,
      updated: it.updated_at ? new Date(it.updated_at) : null,
      raw: JSON.stringify(it),
      syncedAt: new Date(),
    };
  });
}

type GithubEvent = {
  id: string;
  type: string;
  repo?: { name?: string };
  payload?: Record<string, unknown>;
  created_at?: string;
};

function describeEvent(e: GithubEvent): { title: string; url: string } {
  const repo = e.repo?.name ?? "";
  const base = `https://github.com/${repo}`;
  const p = e.payload as any;
  switch (e.type) {
    case "PushEvent": {
      const n = p?.size ?? p?.commits?.length ?? 0;
      return { title: `Pushed ${n} commit${n === 1 ? "" : "s"} to ${repo}`, url: base };
    }
    case "PullRequestEvent":
      return {
        title: `${p?.action ?? "updated"} PR #${p?.number ?? ""}: ${p?.pull_request?.title ?? ""}`,
        url: p?.pull_request?.html_url ?? base,
      };
    case "PullRequestReviewEvent":
      return {
        title: `Reviewed PR #${p?.pull_request?.number ?? ""} in ${repo}`,
        url: p?.pull_request?.html_url ?? base,
      };
    case "IssueCommentEvent":
      return {
        title: `Commented on #${p?.issue?.number ?? ""} in ${repo}`,
        url: p?.comment?.html_url ?? base,
      };
    case "CreateEvent":
      return { title: `Created ${p?.ref_type ?? "ref"} in ${repo}`, url: base };
    default:
      return { title: `${e.type.replace(/Event$/, "")} in ${repo}`, url: base };
  }
}

export function useSyncGithub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // The backend resolves the real login from the token, so an empty or
      // mistyped username still works.
      const user = (await getSetting(GITHUB_USER_KEY)) ?? "";

      const data = await invoke<any>("github_sync", { user });

      // Debug aid: dump the raw response so sync issues can be diagnosed.
      try {
        const { writeTextFile, BaseDirectory } = await import("@tauri-apps/plugin-fs");
        await writeTextFile("github-last-sync.json", JSON.stringify(data, null, 2), {
          baseDir: BaseDirectory.AppLocalData,
        });
      } catch {
        /* non-fatal */
      }

      // Contribution calendar -> daily counts + summary
      const cc = data?.contributions?.data?.viewer?.contributionsCollection;
      const days: { date: string; count: number; syncedAt: Date }[] = [];
      const now = new Date();
      for (const week of cc?.contributionCalendar?.weeks ?? []) {
        for (const d of week?.contributionDays ?? []) {
          days.push({ date: d.date, count: d.contributionCount ?? 0, syncedAt: now });
        }
      }
      const summary: GithubSummary = {
        login: data?.contributions?.data?.viewer?.login,
        commits: cc?.totalCommitContributions ?? 0,
        pullRequests: cc?.totalPullRequestContributions ?? 0,
        reviews: cc?.totalPullRequestReviewContributions ?? 0,
        issues: cc?.totalIssueContributions ?? 0,
        totalContributions: cc?.contributionCalendar?.totalContributions ?? 0,
      };

      const prs = [
        ...mapPrs(data?.authored, "author"),
        ...mapPrs(data?.reviewed, "reviewer"),
        ...mapPrs(data?.commented, "commenter"),
      ];
      // De-dupe on synthetic id (a PR can match multiple queries within a role).
      const prById = new Map(prs.map((p) => [p.id, p]));

      const events = (Array.isArray(data?.events) ? data.events : []).map(
        (e: GithubEvent) => {
          const { title, url } = describeEvent(e);
          return {
            id: e.id,
            type: e.type,
            repo: e.repo?.name ?? null,
            title,
            url,
            createdAt: e.created_at ? new Date(e.created_at) : null,
            raw: JSON.stringify(e),
          };
        },
      );

      await db.delete(githubPrs);
      if (prById.size > 0) await db.insert(githubPrs).values([...prById.values()]);
      await db.delete(githubActivity);
      if (days.length > 0) await db.insert(githubActivity).values(days);
      await db.delete(githubEvents);
      if (events.length > 0) await db.insert(githubEvents).values(events);
      await setSetting(GITHUB_SUMMARY_KEY, JSON.stringify(summary));

      return {
        login: (data?.login as string) ?? "",
        prs: prById.size,
        events: events.length,
        contributions: summary.totalContributions,
        sso: (data?.sso as string | null) ?? null,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["github"] });
    },
  });
}
