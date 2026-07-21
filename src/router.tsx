import { Suspense, type ReactNode } from "react";
import { createHashRouter } from "react-router-dom";

import { RootLayout } from "@/components/layout/root-layout";
import { RouteFallback } from "@/components/route-fallback";
import { Pages } from "@/routes/lazy";

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

export const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Pages.Dashboard /> },
      { path: "inbox", element: <Pages.Inbox /> },
      { path: "tasks", element: <Pages.Tasks /> },
      { path: "activity", element: <Pages.Activity /> },
      { path: "brag", element: <Pages.Brag /> },
      { path: "growth", element: <Pages.Growth /> },
      { path: "feedback", element: <Pages.Feedback /> },
      { path: "timeline", element: <Pages.Timeline /> },
      { path: "tags", element: <Pages.Tags /> },
      { path: "graph", element: <Pages.Graph /> },
      { path: "settings", element: <Pages.Settings /> },
    ],
  },
  { path: "/packet", element: withSuspense(<Pages.Packet />) },
]);
