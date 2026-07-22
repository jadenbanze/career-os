import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "@/components/theme-provider";
import { queryClient } from "@/lib/query-client";
import { QuickBar } from "@/quickbar/quick-bar";
import "../index.css";

// Dedicated entry for the always-on-top quick-capture panel window. Kept
// separate from the main app so it loads instantly and paints transparent.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <QuickBar />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
