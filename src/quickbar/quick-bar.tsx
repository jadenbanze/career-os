import { useEffect, useRef, useState } from "react";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import { ArrowUpRight, Inbox, Loader2, Sparkles } from "lucide-react";

import { db } from "@/db/client";
import { inboxItems } from "@/db/schema";
import { enrichInbox } from "@/features/inbox/use-inbox";

/** Broadcast so the main window refreshes its Inbox when a capture lands. */
const CAPTURE_EVENT = "careeros://capture";

export function QuickBar() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const win = getCurrentWindow();

  const hide = async () => {
    setText("");
    setBusy(false);
    await win.hide();
  };

  useEffect(() => {
    inputRef.current?.focus();
    const unlisten = win.onFocusChanged(({ payload: focused }) => {
      if (focused) inputRef.current?.focus();
      else void hide(); // Raycast-style: dismiss when it loses focus
    });
    return () => {
      void unlisten.then((f) => f());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = async () => {
    const clean = text.trim();
    if (!clean || busy) return;
    setBusy(true);
    const id = crypto.randomUUID();
    try {
      await db
        .insert(inboxItems)
        .values({ id, text: clean, status: "pending", aiState: "loading" });
      await emit(CAPTURE_EVENT);
    } catch (e) {
      console.error("Quick capture failed", e);
    }
    await hide();
    // Enrich after the window closes; refresh the main window again when done.
    void enrichInbox(id, clean).then(() => emit(CAPTURE_EVENT));
  };

  const openApp = async () => {
    const main = await Window.getByLabel("main");
    await main?.show();
    await main?.unminimize();
    await main?.setFocus();
    await hide();
  };

  return (
    <div className="bg-popover/95 text-popover-foreground flex h-screen w-screen flex-col overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl">
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        data-tauri-drag-region
      >
        {busy ? (
          <Loader2 className="size-5 shrink-0 animate-spin text-amber-500" />
        ) : (
          <Sparkles className="size-5 shrink-0 text-amber-500" />
        )}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") capture();
            if (e.key === "Escape") void hide();
          }}
          placeholder="Capture a win, task, or note — AI will file it…"
          className="placeholder:text-muted-foreground flex-1 bg-transparent text-base outline-none"
        />
        <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-medium">
          ↵
        </kbd>
      </div>

      <div className="space-y-0.5 border-t p-1.5">
        <button
          type="button"
          onClick={capture}
          className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm"
        >
          <Inbox className="text-amber-500 size-4" />
          <span className="flex-1">Capture to Inbox</span>
          <span className="text-muted-foreground text-xs">Enter</span>
        </button>
        <button
          type="button"
          onClick={openApp}
          className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm"
        >
          <ArrowUpRight className="text-sky-500 size-4" />
          <span className="flex-1">Open Career OS</span>
        </button>
      </div>

      <div className="text-muted-foreground mt-auto flex items-center justify-between border-t px-4 py-2 text-[11px]">
        <span>Quick capture</span>
        <span>⌘⇧Space toggle · Esc to dismiss</span>
      </div>
    </div>
  );
}
