import { useEffect, useState } from "react";
import { Keyboard, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { eventToCombo, formatCombo, HOTKEYS } from "./hotkeys";
import { useHotkeys, useSaveHotkey } from "./use-hotkeys";

function HotkeyRecorder({
  value,
  onChange,
}: {
  value: string;
  onChange: (combo: string) => void;
}) {
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!recording) return;
    const onKey = (e: KeyboardEvent) => {
      // Wait while only modifier keys are held down — don't capture yet.
      if (["Shift", "Control", "Alt", "Meta", "OS"].includes(e.key)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      // Any real key press ends recording, so we can never get stuck
      // swallowing keystrokes: a valid chord is saved, anything else cancels.
      if (e.key !== "Escape") {
        const combo = eventToCombo(e);
        if (combo) onChange(combo);
      }
      setRecording(false);
    };
    const stop = () => setRecording(false);
    // Capture phase so we intercept before the app's own hotkey listeners.
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", stop);
    };
  }, [recording, onChange]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "ring-primary min-w-[92px] font-mono",
        recording && "ring-2",
      )}
      onClick={() => setRecording((r) => !r)}
    >
      {recording ? "Press keys…" : formatCombo(value)}
    </Button>
  );
}

export function HotkeysCard() {
  const combos = useHotkeys().data;
  const save = useSaveHotkey();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="size-4" />
          Keyboard shortcuts
        </CardTitle>
        <CardDescription>
          Click a shortcut and press the keys you want (needs a modifier like ⌘).
          The global quick bar works even when Career OS is in the background.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {HOTKEYS.map((h) => (
          <div key={h.action} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                {h.label}
                {h.scope === "global" ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Global
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">{h.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <HotkeyRecorder
                value={combos[h.action]}
                onChange={(combo) => save.mutate({ action: h.action, combo })}
              />
              {combos[h.action] !== h.default ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title="Reset to default"
                  onClick={() => save.mutate({ action: h.action, combo: h.default })}
                >
                  <RotateCcw className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
