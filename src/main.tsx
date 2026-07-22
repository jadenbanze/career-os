import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { ConfirmProvider } from "@/components/confirm";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initDb } from "@/db/client";
import { reconcileStuckInbox } from "@/features/inbox/use-inbox";
import { runReminders } from "@/features/reminders/reminders";
import { queryClient } from "@/lib/query-client";
import { router } from "@/router";
import "./index.css";

// Load the database (and run migrations) early, then run startup housekeeping.
// Update checks are handled by <UpdateAgent /> inside the app shell.
// (The quick-capture panel is a separate window with its own entry:
// quickbar.html → src/quickbar/main.tsx.)
initDb()
  .then(async () => {
    await reconcileStuckInbox();
    await runReminders();
  })
  .catch((e) => console.error("Database init failed", e));

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
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

