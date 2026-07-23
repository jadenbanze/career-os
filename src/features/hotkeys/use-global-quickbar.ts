import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";

import { formatCombo, toAccelerator } from "./hotkeys";

const KEYBOARD_SETTINGS_URL =
  "x-apple.systempreferences:com.apple.Keyboard-Settings.extension";
const BIND_TOAST_ID = "global-quickbar-binding";

// Serialize registrations so a stale async effect cannot overwrite a newer
// combo or show a second, contradictory toast.
let bindQueue = Promise.resolve();
let bindGeneration = 0;
let hasAttemptedBind = false;

/**
 * Sends the hydrated accelerator to Rust. Rust owns the global callback and
 * panel lifecycle so the shortcut remains available while webviews are hidden.
 */
export function useGlobalQuickBar(combo: string | undefined) {
  useEffect(() => {
    if (!combo) return;
    const accelerator = toAccelerator(combo);
    const generation = ++bindGeneration;
    let active = true;

    bindQueue = bindQueue.then(async () => {
      if (!active || generation !== bindGeneration) return;
      try {
        await invoke("set_quickbar_shortcut", { accelerator });
        if (!active || generation !== bindGeneration) return;
        if (hasAttemptedBind) {
          toast.success(`Global quick bar bound to ${formatCombo(combo)}`, {
            id: BIND_TOAST_ID,
          });
        }
        hasAttemptedBind = true;
      } catch (e) {
        if (!active || generation !== bindGeneration) return;
        console.error("Failed to register global shortcut", accelerator, e);
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
