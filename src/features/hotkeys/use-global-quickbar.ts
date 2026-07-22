import { useEffect } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { openUrl } from "@tauri-apps/plugin-opener";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { toast } from "sonner";

import { formatCombo, toAccelerator } from "./hotkeys";

// macOS System Settings → Keyboard shortcuts (harmless no-op on other OSes).
const KEYBOARD_SETTINGS_URL =
  "x-apple.systempreferences:com.apple.Keyboard-Settings.extension";
const BIND_TOAST_ID = "global-quickbar-binding";

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
      url: "quickbar.html",
      width: 640,
      height: 380,
      resizable: false,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      center: true,
      focus: true,
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

// Serialize registrations so a stale async effect cannot unregister a newer
// combo or show a second, contradictory toast.
let bindQueue = Promise.resolve();
let bindGeneration = 0;
let hasAttemptedBind = false;

/**
 * Registers the system-wide quick-bar shortcut (re-registering when it changes).
 * Runs once from the main window; the handler toggles the quickbar window.
 */
export function useGlobalQuickBar(combo: string | undefined) {
  useEffect(() => {
    if (!combo) return;
    const accel = toAccelerator(combo);
    const generation = ++bindGeneration;
    let active = true;

    bindQueue = bindQueue.then(async () => {
      if (!active || generation !== bindGeneration) return;
      try {
        await unregisterAll();
        if (!active || generation !== bindGeneration) return;
        await register(accel, (event) => {
          if (active && event.state === "Pressed") void toggleQuickBar();
        });
        if (!active || generation !== bindGeneration) return;
        if (hasAttemptedBind) {
          toast.success(`Global quick bar bound to ${formatCombo(combo)}`, {
            id: BIND_TOAST_ID,
          });
        }
        hasAttemptedBind = true;
      } catch (e) {
        if (!active || generation !== bindGeneration) return;
        console.error("Failed to register global shortcut", accel, e);
        hasAttemptedBind = true;
        toast.error(
          `Couldn't bind ${formatCombo(combo)} — it may be reserved by macOS or another app.`,
          {
            id: BIND_TOAST_ID,
            action: {
              label: "Keyboard settings",
              onClick: () => void openUrl(KEYBOARD_SETTINGS_URL).catch(() => {}),
            },
          },
        );
      }
    });

    return () => {
      active = false;
    };
  }, [combo]);
}
