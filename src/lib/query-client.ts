import { QueryClient } from "@tanstack/react-query";

// This is a local-first app: every write invalidates its own query keys, so
// data never becomes stale on its own. Marking queries as always-fresh avoids
// redundant SQLite round-trips when navigating between pages, and a long gcTime
// keeps results cached so revisiting a page is instant.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});
