import { useEffect } from "react";
import { Window } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { toast } from "sonner";

import { formatCombo, toAccelerator } from "./hotkeys";

// macOS System Settings → Keyboard shortcuts (harmless no-op on other OSes).
const KEYBOARD_SETTINGS_URL =
  "x-apple.systempreferences:com.apple.Keyboard-Settings.extension";

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
