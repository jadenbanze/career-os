import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSetting, setSetting } from "@/features/settings/use-settings";
import { DEFAULT_HOTKEYS, HOTKEYS, type HotkeyAction } from "./hotkeys";

const KEY = ["settings", "hotkeys"];

/** All configured hotkey combos (falling back to defaults). */
export function useHotkeys() {
  const query = useQuery<Record<HotkeyAction, string>>({
    queryKey: KEY,
    queryFn: async () => {
      const entries = await Promise.all(
        HOTKEYS.map(
          async (h) =>
            [h.action, (await getSetting(h.settingKey)) || h.default] as const,
        ),
      );
      return Object.fromEntries(entries) as Record<HotkeyAction, string>;
    },
    // Defaults are display-only placeholders while SQLite settings load. They
    // must not be treated as hydrated data or the global shortcut briefly binds
    // the default before rebinding the saved custom combo (two toasts/conflict).
    placeholderData: DEFAULT_HOTKEYS,
    staleTime: Infinity,
  });
  return { ...query, data: query.data ?? DEFAULT_HOTKEYS };
}

export function useSaveHotkey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, combo }: { action: HotkeyAction; combo: string }) => {
      const def = HOTKEYS.find((h) => h.action === action);
      if (def) await setSetting(def.settingKey, combo);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
