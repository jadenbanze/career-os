import { useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CheckCircle2, ExternalLink, GitBranch, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ssoAuthorizeUrl,
  useClearGithubToken,
  useGithubConfig,
  useSaveGithubConfig,
  useSyncGithub,
} from "./use-github";

const TOKEN_URL = "https://github.com/settings/tokens";

export function GithubSettingsCard() {
  const { data: config } = useGithubConfig();
  const save = useSaveGithubConfig();
  const clear = useClearGithubToken();
  const sync = useSyncGithub();

  const [user, setUser] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (config) setUser(config.user);
  }, [config]);

  const onSave = async () => {
    if (!user.trim()) {
      toast.error("GitHub username is required");
      return;
    }
    try {
      await save.mutateAsync({ user, token: token || undefined });
      setToken("");
      toast.success("GitHub settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const onTest = async () => {
    try {
      const res = await sync.mutateAsync();
      if (res.sso) {
        toast.warning("GitHub SSO authorization required", {
          description:
            "Your token isn't authorized for your enterprise org, so results are hidden. Authorize it, then sync again.",
          action: {
            label: "Authorize",
            onClick: () => openUrl(ssoAuthorizeUrl(res.sso)),
          },
          duration: 30000,
        });
      } else if (res.prs === 0 && res.contributions === 0 && res.events === 0) {
        toast.warning("Connected, but no data came back", {
          description: `Authenticated as ${res.login}. For an enterprise/EMU account, authorize the token for SSO and make sure it has the 'repo' scope (or use a fine-grained token approved for your org).`,
          action: {
            label: "Open tokens",
            onClick: () => openUrl("https://github.com/settings/tokens"),
          },
          duration: 30000,
        });
      } else {
        toast.success(
          `Synced as ${res.login || "?"}: ${res.prs} PRs, ${res.contributions} contributions, ${res.events} events`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const onClear = async () => {
    try {
      await clear.mutateAsync();
      toast.success("GitHub token removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-4" />
              GitHub connection
            </CardTitle>
            <CardDescription>
              Read-only access to your PRs, reviews, and contribution activity.
            </CardDescription>
          </div>
          {config?.hasToken ? (
            <Badge
              variant="secondary"
              className="border-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="size-3.5" />
              Token saved
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gh-user">Username</Label>
          <Input
            id="gh-user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="octocat"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="gh-token">Personal access token</Label>
            <button
              type="button"
              onClick={() => openUrl(TOKEN_URL)}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
            >
              Create a token
              <ExternalLink className="size-3" />
            </button>
          </div>
          <Input
            id="gh-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={config?.hasToken ? "•••••••• (leave blank to keep)" : "ghp_…"}
            autoComplete="off"
          />
          <p className="text-muted-foreground text-xs">
            Classic token with <code>repo</code> + <code>read:user</code> scopes.
            Stored in your macOS Keychain.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={onSave} disabled={save.isPending}>
            Save
          </Button>
          <Button variant="outline" onClick={onTest} disabled={sync.isPending}>
            <RefreshCw className={cn("size-4", sync.isPending && "animate-spin")} />
            Test &amp; sync
          </Button>
          {config?.hasToken ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive ml-auto"
              onClick={onClear}
              disabled={clear.isPending}
            >
              Remove token
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
