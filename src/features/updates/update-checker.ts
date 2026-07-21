import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";

/** The running app's version (from tauri.conf.json at build time). */
export async function getAppVersion(): Promise<string> {
  try {
    return await getVersion();
  } catch {
    return "unknown";
  }
}

// Guards against re-downloading the same update on the next interval tick /
// concurrent checks. Stays true once an update is installed and pending restart.
let handling = false;

function promptRestart(version: string) {
  toast(`Updated to v${version}`, {
    description: "Restart to finish applying the update.",
    duration: Infinity,
    action: { label: "Restart now", onClick: () => void relaunch() },
  });
}

/**
 * Background update agent: silently downloads + installs any newer signed
 * release, then prompts the user to restart. The new version is applied in
 * place (macOS swaps the .app bundle), so there's no old copy left behind.
 * Only runs in a packaged build.
 */
export async function runUpdateAgent(): Promise<void> {
  if (!import.meta.env.PROD || handling) return;
  try {
    const update = await check();
    if (!update) return;
    handling = true;
    await update.downloadAndInstall();
    promptRestart(update.version);
  } catch (e) {
    handling = false; // let a later tick retry
    console.error("Update agent failed", e);
  }
}

/** Manual "Check for updates" (Settings button) with user-facing feedback. */
export async function checkForUpdatesManually(): Promise<void> {
  if (!import.meta.env.PROD) {
    toast.info("Updates run in the installed app, not in dev mode.");
    return;
  }
  const pending = toast.loading("Checking for updates…");
  try {
    const update = await check();
    if (!update) {
      toast.dismiss(pending);
      toast.success("You're on the latest version.");
      return;
    }
    handling = true;
    toast.dismiss(pending);
    const downloading = toast.loading(`Downloading v${update.version}…`);
    await update.downloadAndInstall();
    toast.dismiss(downloading);
    promptRestart(update.version);
  } catch (e) {
    toast.dismiss(pending);
    handling = false;
    toast.error(e instanceof Error ? e.message : String(e));
  }
}
