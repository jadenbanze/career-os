import { useEffect } from "react";

import { runUpdateAgent } from "./update-checker";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

/** Runs the background update check on launch and on an interval. Renders nothing. */
export function UpdateAgent() {
  useEffect(() => {
    void runUpdateAgent();
    const id = setInterval(() => void runUpdateAgent(), CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
  return null;
}
