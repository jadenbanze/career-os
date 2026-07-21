import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Printer,
  RefreshCw,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/page";
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
import { AiSettingsCard } from "@/features/ai/ai-settings-card";
import { savePromoPacket, saveBackup } from "@/features/export/export";
import { GithubSettingsCard } from "@/features/github/github-settings-card";
import { useSyncJira } from "@/features/jira/use-jira";
import {
  useClearJiraToken,
  useJiraConfig,
  useSaveJiraConfig,
} from "@/features/settings/use-settings";
import { cn } from "@/lib/utils";

const TOKEN_URL = "https://id.atlassian.com/manage-profile/security/api-tokens";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { data: config } = useJiraConfig();
  const save = useSaveJiraConfig();
  const clear = useClearJiraToken();
  const sync = useSyncJira();

  const exportPacket = async () => {
    try {
      if (await savePromoPacket()) toast.success("Promo packet saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };
  const backup = async () => {
    try {
      if (await saveBackup()) toast.success("Backup saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const [site, setSite] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (config) {
      setSite(config.site);
      setEmail(config.email);
    }
  }, [config]);

  const onSave = async () => {
    if (!site.trim() || !email.trim()) {
      toast.error("Site and email are required");
      return;
    }
    try {
      await save.mutateAsync({ site, email, token: token || undefined });
      setToken("");
      toast.success("JIRA settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const onTest = async () => {
    try {
      const count = await sync.mutateAsync();
      toast.success(`Connected — synced ${count} issue${count === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const onClear = async () => {
    try {
      await clear.mutateAsync();
      toast.success("API token removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Page>
      <PageHeader
        title="Settings"
        description="Connect JIRA and manage your workspace."
        icon={SettingsIcon}
      />

      <div className="space-y-6">
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>JIRA connection</CardTitle>
              <CardDescription>
                Read-only access to the issues assigned to you (JIRA Cloud).
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
            <Label htmlFor="jira-site">Site</Label>
            <Input
              id="jira-site"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="yourcompany.atlassian.net"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jira-email">Email</Label>
            <Input
              id="jira-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jira-token">API token</Label>
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
              id="jira-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={config?.hasToken ? "•••••••• (leave blank to keep)" : "Paste your API token"}
              autoComplete="off"
            />
            <p className="text-muted-foreground text-xs">
              Stored securely in your macOS Keychain — never written to the app database.
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

        <GithubSettingsCard />

        <AiSettingsCard />

        <Card>
          <CardHeader>
            <CardTitle>Export &amp; backup</CardTitle>
            <CardDescription>
              Generate a promotion packet or back up all your data locally.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/packet")}>
              <Printer className="size-4" />
              Promo packet (print / PDF)
            </Button>
            <Button variant="outline" onClick={exportPacket}>
              <FileText className="size-4" />
              Export packet (.md)
            </Button>
            <Button variant="outline" onClick={backup}>
              <Database className="size-4" />
              Back up data (.json)
            </Button>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
