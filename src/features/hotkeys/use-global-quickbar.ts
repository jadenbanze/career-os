import { useEffect } from "react";
import { Window } from "@tauri-apps/api/window";
import {
  isRegistered,
  register,
  unregister,
} from "@tauri-apps/plugin-global-shortcut";
import { toast } from "sonner";

import { toAccelerator } from "./hotkeys";

async function toggleQuickBar() {
  const win = await Window.getByLabel("quickbar");
  if (!win) return;
  if (await win.isVisible()) {
    await win.hide();
  } else {
    await win.center();
    await win.show();
    await win.setFocus();
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
        if (await isRegistered(accel)) await unregister(accel);
        await register(accel, (event) => {
          if (active && event.state === "Pressed") void toggleQuickBar();
        });
      } catch (e) {
        console.error("Failed to register global shortcut", accel, e);
        toast.error(`Couldn't register global shortcut ${accel}. It may be in use by another app.`);
      }
    })();

    return () => {
      active = false;
      void unregister(accel).catch(() => {});
    };
  }, [combo]);
}
