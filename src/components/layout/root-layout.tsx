import { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { listen } from "@tauri-apps/api/event";
import { Search } from "lucide-react";

import { RouteFallback } from "@/components/route-fallback";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { formatCombo } from "@/features/hotkeys/hotkeys";
import { useGlobalQuickBar } from "@/features/hotkeys/use-global-quickbar";
import { useHotkeys } from "@/features/hotkeys/use-hotkeys";
import { Onboarding } from "@/features/onboarding/onboarding";
import { AutoSync } from "@/features/sync/auto-sync";
import { UpdateAgent } from "@/features/updates/update-agent";
import { AppActionsProvider } from "./app-actions";
import { AppSidebar } from "./app-sidebar";
import { CommandMenu } from "./command-menu";

export function RootLayout() {
  const [commandOpen, setCommandOpen] = useState(false);
  const qc = useQueryClient();
  const hotkeys = useHotkeys().data;
  useGlobalQuickBar(hotkeys.quickBar);

  // Refresh the Inbox when the global quick bar captures something.
  useEffect(() => {
    const unlisten = listen("careeros://capture", () => {
      qc.invalidateQueries({ queryKey: ["inbox", "pending"] });
    });
    return () => {
      void unlisten.then((f) => f());
    };
  }, [qc]);

  return (
    <AppActionsProvider>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground ml-1 h-8 w-full max-w-72 justify-start gap-2 font-normal"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="size-4" />
            <span>Search or jump to...</span>
            <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium select-none">
              {formatCombo(hotkeys.commandPalette)}
            </kbd>
          </Button>
        </header>
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
      <Onboarding />
      <AutoSync />
      <UpdateAgent />
    </SidebarProvider>
    </AppActionsProvider>
  );
}
