/**
 * Configurable hotkeys.
 *
 * Combos are stored in a canonical, layout-independent format built from
 * `KeyboardEvent.code`: modifiers ("Mod" = ⌘/Ctrl, "Alt", "Shift") followed by
 * a key, joined with "+". e.g. "Mod+Shift+N", "Mod+K", "Mod+Shift+Space".
 */

export type HotkeyAction = "commandPalette" | "quickCapture" | "quickBar";
export type HotkeyScope = "app" | "global";

export type HotkeyDef = {
  action: HotkeyAction;
  label: string;
  description: string;
  scope: HotkeyScope;
  settingKey: string;
  default: string;
};

export const HOTKEYS: HotkeyDef[] = [
  {
    action: "commandPalette",
    label: "Command palette",
    description: "Search and jump anywhere",
    scope: "app",
    settingKey: "hotkey_command_palette",
    default: "Mod+K",
  },
  {
    action: "quickCapture",
    label: "Quick capture",
    description: "Open the in-app capture dialog",
    scope: "app",
    settingKey: "hotkey_quick_capture",
    default: "Mod+Shift+N",
  },
  {
    action: "quickBar",
    label: "Global quick bar",
    description: "System-wide capture bar — works even when the app is in the background",
    scope: "global",
    settingKey: "hotkey_quick_bar",
    default: "Mod+Shift+Space",
  },
];

export const DEFAULT_HOTKEYS: Record<HotkeyAction, string> = Object.fromEntries(
  HOTKEYS.map((h) => [h.action, h.default]),
) as Record<HotkeyAction, string>;

const NAMED_CODES: Record<string, string> = {
  Space: "Space",
  Enter: "Enter",
  Backslash: "\\",
  Slash: "/",
  Period: ".",
  Comma: ",",
  Semicolon: ";",
  Quote: "'",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backquote: "`",
};

function codeToKey(code: string): string | null {
  if (code.startsWith("Key")) return code.slice(3); // KeyK -> K
  if (code.startsWith("Digit")) return code.slice(5); // Digit1 -> 1
  if (NAMED_CODES[code]) return NAMED_CODES[code];
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Home", "End", "PageUp", "PageDown"].includes(code)
  ) {
    return code;
  }
  return null; // lone modifier / unsupported
}

/** Canonical combo from a keyboard event, or null if it isn't a valid hotkey. */
export function eventToCombo(e: KeyboardEvent): string | null {
  const key = codeToKey(e.code);
  if (!key) return null;
  // Require at least one "hard" modifier so we never bind bare keys.
  if (!(e.metaKey || e.ctrlKey || e.altKey)) return null;
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push("Mod");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  parts.push(key);
  return parts.join("+");
}

/** True when the event matches the stored combo. */
export function matchEvent(combo: string, e: KeyboardEvent): boolean {
  const c = eventToCombo(e);
  return c !== null && c === combo;
}

/** Convert to the tauri global-shortcut accelerator format. */
export function toAccelerator(combo: string): string {
  return combo
    .split("+")
    .map((p) => (p === "Mod" ? "CmdOrCtrl" : p))
    .join("+");
}

const SYMBOL: Record<string, string> = { Mod: "⌘", Alt: "⌥", Shift: "⇧" };

/** Human-readable combo, e.g. "⌘⇧K". */
export function formatCombo(combo: string): string {
  return combo
    .split("+")
    .map((p) => SYMBOL[p] ?? p)
    .join("");
}
