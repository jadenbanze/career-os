import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";

/**
 * Checks GitHub Releases for a newer signed build and offers to install it.
 * Only runs in a packaged (production) app — the updater has no endpoint in dev.
 */
export async function checkForUpdates(): Promise<void> {
  if (!import.meta.env.PROD) return;

  try {
    const update = await check();
    if (!update) return;

    toast("Update available", {
      description: `Version ${update.version} is ready to install.`,
      duration: Infinity,
      action: {
        label: "Update & restart",
        onClick: async () => {
          const pending = toast.loading("Downloading update…");
          try {
            await update.downloadAndInstall();
            toast.dismiss(pending);
            await relaunch();
          } catch (e) {
            toast.dismiss(pending);
            toast.error(e instanceof Error ? e.message : String(e));
          }
        },
      },
    });
  } catch (e) {
    // Network hiccups / no releases yet shouldn't disrupt startup.
    console.error("Update check failed", e);
  }
}
