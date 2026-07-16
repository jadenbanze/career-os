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
      { path: "tasks", element: <Pages.Tasks /> },
      { path: "activity", element: <Pages.Activity /> },
      { path: "brag", element: <Pages.Brag /> },
      { path: "promotion", element: <Pages.Promotion /> },
      { path: "career", element: <Pages.Career /> },
      { path: "feedback", element: <Pages.Feedback /> },
      { path: "vision", element: <Pages.Vision /> },
      { path: "timeline", element: <Pages.Timeline /> },
      { path: "settings", element: <Pages.Settings /> },
    ],
  },
  { path: "/packet", element: withSuspense(<Pages.Packet />) },
]);
