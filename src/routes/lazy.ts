import { lazy } from "react";

// Single source of truth for route code-split imports, so the router can lazy
// them and the sidebar can prefetch the same chunk on hover.
export const routeImporters = {
  "/": () => import("@/routes/dashboard"),
  "/inbox": () => import("@/routes/inbox"),
  "/tasks": () => import("@/routes/tasks"),
  "/activity": () => import("@/routes/activity"),
  "/brag": () => import("@/routes/brag-sheet"),
  "/promotion": () => import("@/routes/promotion"),
  "/career": () => import("@/routes/career"),
  "/feedback": () => import("@/routes/feedback"),
  "/vision": () => import("@/routes/vision-board"),
  "/timeline": () => import("@/routes/timeline"),
  "/settings": () => import("@/routes/settings"),
} as const;

export const Pages = {
  Dashboard: lazy(routeImporters["/"]),
  Inbox: lazy(routeImporters["/inbox"]),
  Tasks: lazy(routeImporters["/tasks"]),
  Activity: lazy(routeImporters["/activity"]),
  Brag: lazy(routeImporters["/brag"]),
  Promotion: lazy(routeImporters["/promotion"]),
  Career: lazy(routeImporters["/career"]),
  Feedback: lazy(routeImporters["/feedback"]),
  Vision: lazy(routeImporters["/vision"]),
  Timeline: lazy(routeImporters["/timeline"]),
  Settings: lazy(routeImporters["/settings"]),
  Packet: lazy(() => import("@/routes/packet")),
};

const prefetched = new Set<string>();

/** Warms a route's chunk (called on sidebar hover/focus). Idempotent. */
export function prefetchRoute(url: string): void {
  if (prefetched.has(url)) return;
  const importer = routeImporters[url as keyof typeof routeImporters];
  if (importer) {
    prefetched.add(url);
    void importer();
  }
}
