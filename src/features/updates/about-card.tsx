import { useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Info, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { checkForUpdatesManually, getAppVersion } from "./update-checker";

const RELEASES_URL = "https://github.com/jadenbanze/career-os/releases";

export function AboutCard() {
  const [version, setVersion] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void getAppVersion().then(setVersion);
  }, []);

  const onCheck = async () => {
    setChecking(true);
    try {
      await checkForUpdatesManually();
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="size-4" />
          About
        </CardTitle>
        <CardDescription>
          Career OS updates itself automatically from GitHub Releases and installs
          in place — no reinstalling or removing the old version.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Version</span>
          <span className="font-mono">{version || "…"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Identifier</span>
          <span className="text-muted-foreground font-mono text-xs">
            com.careeros.app
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" onClick={onCheck} disabled={checking}>
            <RefreshCw className={cn("size-4", checking && "animate-spin")} />
            Check for updates
          </Button>
          <Button variant="ghost" onClick={() => openUrl(RELEASES_URL)}>
            Release notes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
