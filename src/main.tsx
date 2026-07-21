import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { ConfirmProvider } from "@/components/confirm";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initDb } from "@/db/client";
import { reconcileStuckInbox } from "@/features/inbox/use-inbox";
import { runReminders } from "@/features/reminders/reminders";
import { QuickBar } from "@/quickbar/quick-bar";
import { queryClient } from "@/lib/query-client";
import { router } from "@/router";
import "./index.css";

const rootEl = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootEl);

// The always-on-top quick-capture panel is a separate window that renders a
// minimal UI instead of the full app.
if (getCurrentWindow().label === "quickbar") {
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <QuickBar />
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
} else {
  // Load the database (and run migrations) early, then run startup housekeeping.
  // Update checks are handled by <UpdateAgent /> inside the app shell.
  initDb()
    .then(async () => {
      await reconcileStuckInbox();
      await runReminders();
    })
    .catch((e) => console.error("Database init failed", e));

  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={0}>
            <ConfirmProvider>
              <RouterProvider router={router} />
            </ConfirmProvider>
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
}
