import { useEffect } from "react";
import { Window } from "@tauri-apps/api/window";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { toast } from "sonner";

import { formatCombo, toAccelerator } from "./hotkeys";

async function toggleQuickBar() {
  try {
    const win = await Window.getByLabel("quickbar");
    if (!win) {
      console.error("quickbar window not found");
      return;
    }
    if (await win.isVisible()) {
      await win.hide();
    } else {
      await win.center();
      await win.show();
      await win.setFocus();
    }
  } catch (e) {
    console.error("toggleQuickBar failed", e);
  }
}

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
        // Clear our own previous binding, then claim the combo. This is a
        // system-wide registration, so it intercepts the keystroke globally —
        // taking over the combo even if another app also uses it.
        await unregisterAll();
        await register(accel, (event) => {
          if (active && event.state === "Pressed") void toggleQuickBar();
        });
      } catch (e) {
        console.error("Failed to register global shortcut", accel, e);
        toast.error(
          `Couldn't bind ${formatCombo(combo)}. It may be reserved by macOS — try another combo in Settings.`,
        );
      }
    })();

    return () => {
      active = false;
      void unregisterAll().catch(() => {});
    };
  }, [combo]);
}
