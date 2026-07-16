import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { BragDialog, type BragDefaults } from "@/features/brag/brag-dialog";
import { GoalDialog } from "@/features/career/goal-dialog";
import { MilestoneDialog } from "@/features/promotion/milestone-dialog";
import { EventDialog } from "@/features/timeline/event-dialog";
import { TaskDialog } from "@/features/tasks/task-dialog";
import { VisionDialog } from "@/features/vision/vision-dialog";
import { QuickCaptureDialog } from "./quick-capture";

type AppActions = {
  openTask: () => void;
  openBrag: (defaults?: BragDefaults) => void;
  openMilestone: () => void;
  openGoal: () => void;
  openEvent: () => void;
  openVision: () => void;
  openQuickCapture: () => void;
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
  const [vision, setVision] = useState(false);
  const [quick, setQuick] = useState(false);

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
      openVision: () => setVision(true),
      openQuickCapture: () => setQuick(true),
    }),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "n" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setQuick(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
      <VisionDialog open={vision} onOpenChange={setVision} />
      <QuickCaptureDialog open={quick} onOpenChange={setQuick} />
    </AppActionsContext.Provider>
  );
}
