import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { db } from "@/db/client";
import { inboxItems } from "@/db/schema";
import { matchEvent } from "@/features/hotkeys/hotkeys";
import { useHotkeys } from "@/features/hotkeys/use-hotkeys";
import { BragDialog, type BragDefaults } from "@/features/brag/brag-dialog";
import { GoalDialog } from "@/features/career/goal-dialog";
import { enrichInbox } from "@/features/inbox/use-inbox";
import { MilestoneDialog } from "@/features/promotion/milestone-dialog";
import { EventDialog } from "@/features/timeline/event-dialog";
import { TaskDialog } from "@/features/tasks/task-dialog";
import { QuickCaptureDialog } from "./quick-capture";

type AppActions = {
  openTask: () => void;
  openBrag: (defaults?: BragDefaults) => void;
  openMilestone: () => void;
  openGoal: () => void;
  openEvent: () => void;
  openQuickCapture: () => void;
  captureToInbox: (text: string) => void;
};

const AppActionsContext = createContext<AppActions | null>(null);

export function useAppActions(): AppActions {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error("useAppActions must be used within AppActionsProvider");
  return ctx;
}

export function AppActionsProvider({ children }: { children: ReactNode }) {
  const [task, setTask] = useState(false);
  const [brag, setBrag] = useState(false);
  const [bragDefaults, setBragDefaults] = useState<BragDefaults | undefined>();
  const [milestone, setMilestone] = useState(false);
  const [goal, setGoal] = useState(false);
  const [event, setEvent] = useState(false);
  const [quick, setQuick] = useState(false);

  const qc = useQueryClient();
  // Lives on the always-mounted provider so AI enrichment finishes even after
  // the capture dialog closes.
  const capture = useMutation({
    mutationFn: async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      const id = crypto.randomUUID();
      await db
        .insert(inboxItems)
        .values({ id, text: clean, status: "pending", aiState: "loading" });
      qc.invalidateQueries({ queryKey: ["inbox", "pending"] });
      await enrichInbox(id, clean);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox", "pending"] }),
  });

  const value = useMemo<AppActions>(
    () => ({
      openTask: () => setTask(true),
      openBrag: (defaults) => {
        setBragDefaults(defaults);
        setBrag(true);
      },
      openMilestone: () => setMilestone(true),
      openGoal: () => setGoal(true),
      openEvent: () => setEvent(true),
      openQuickCapture: () => setQuick(true),
      captureToInbox: (text: string) => capture.mutate(text),
    }),
    [capture],
  );

  const captureCombo = useHotkeys().data.quickCapture;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (matchEvent(captureCombo, e)) {
        e.preventDefault();
        setQuick(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [captureCombo]);

  return (
    <AppActionsContext.Provider value={value}>
      {children}
      <TaskDialog open={task} onOpenChange={setTask} />
      <BragDialog
        open={brag}
        onOpenChange={(o) => {
          setBrag(o);
          if (!o) setBragDefaults(undefined);
        }}
        defaults={bragDefaults}
      />
      <MilestoneDialog open={milestone} onOpenChange={setMilestone} />
      <GoalDialog open={goal} onOpenChange={setGoal} />
      <EventDialog open={event} onOpenChange={setEvent} />
      <QuickCaptureDialog open={quick} onOpenChange={setQuick} />
    </AppActionsContext.Provider>
  );
}
