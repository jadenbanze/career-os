import { useEffect } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { openUrl } from "@tauri-apps/plugin-opener";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { toast } from "sonner";

import { formatCombo, toAccelerator } from "./hotkeys";

// macOS System Settings → Keyboard shortcuts (harmless no-op on other OSes).
const KEYBOARD_SETTINGS_URL =
  "x-apple.systempreferences:com.apple.Keyboard-Settings.extension";

/**
 * Summon or dismiss the quick bar. It's created fresh each time and closed on
 * dismiss (rather than kept hidden), because macOS suspends/terminates the
 * webview of a hidden window — which left the bar broken until an app restart.
 */
async function toggleQuickBar() {
  try {
    const existing = await WebviewWindow.getByLabel("quickbar");
    if (existing) {
      await existing.close();
      return;
    }
    const win = new WebviewWindow("quickbar", {
      url: "index.html",
      width: 640,
      height: 380,
      resizable: false,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      center: true,
      // Created hidden; the QuickBar reveals it once painted, so there's no
      // white flash while the fresh webview loads.
      visible: false,
      skipTaskbar: true,
      title: "Quick Capture",
    });
    win.once("tauri://error", (e) =>
      console.error("quickbar window failed to open", e),
    );
  } catch (e) {
    console.error("toggleQuickBar failed", e);
  }
}

// Only announce (re)registration after the initial silent bind at launch, so
// the user gets feedback when they change the shortcut in Settings.
let announced = false;

/**
 * Registers the system-wide quick-bar shortcut (re-registering when it changes).
 * Runs once from the main window; the handler toggles the quickbar window.
 */
export function useGlobalQuickBar(combo: string | undefined) {
  useEffect(() => {
    if (!combo) return;
    const accel = toAccelerator(combo);
    let active = true;

    (async () => {
      try {
        await unregisterAll(); // clear our previous binding before rebinding
        await register(accel, (event) => {
          if (active && event.state === "Pressed") void toggleQuickBar();
        });
        if (announced) toast.success(`Global quick bar bound to ${formatCombo(combo)}`);
        announced = true;
      } catch (e) {
        console.error("Failed to register global shortcut", accel, e);
        announced = true;
        toast.error(
          `Couldn't bind ${formatCombo(combo)} — it may be reserved by macOS or another app.`,
          {
            action: {
              label: "Keyboard settings",
              onClick: () => void openUrl(KEYBOARD_SETTINGS_URL).catch(() => {}),
            },
          },
        );
      }
    })();

    return () => {
      active = false;
      void unregisterAll().catch(() => {});
    };
  }, [combo]);
}
