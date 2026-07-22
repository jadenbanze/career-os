import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, PlugZap, Sparkles, TrendingUp } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSetting, setSetting } from "@/features/settings/use-settings";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "onboarding_done";

function useOnboardingDone() {
  return useQuery({
    queryKey: ["settings", "onboarding"],
    queryFn: async () => (await getSetting(ONBOARDING_KEY)) === "true",
  });
}

function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await setSetting(ONBOARDING_KEY, "true");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "onboarding"] }),
  });
}

type Step = {
  icon: typeof Inbox;
  tone: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    tone: "bg-sky-500/15 text-sky-500",
    title: "Welcome to Career OS",
    body: "Your work and career in one fast, private place. Everything lives locally on your machine — no account, no cloud.",
  },
  {
    icon: Inbox,
    tone: "bg-amber-500/15 text-amber-500",
    title: "Capture now, organize later",
    body: "Press ⌘⇧N anywhere (even the global quick bar) to jot a win, task, or note. Local AI sorts it into your Inbox so you can file it when you have a moment.",
  },
  {
    icon: TrendingUp,
    tone: "bg-emerald-500/15 text-emerald-500",
    title: "Build your promotion case",
    body: "Log wins, track goals and milestones in Journey, then export a polished promo packet when review season comes.",
  },
  {
    icon: PlugZap,
    tone: "bg-violet-500/15 text-violet-500",
    title: "Connect what you use (optional)",
    body: "Link read-only JIRA and GitHub, or a local Ollama model for AI — all optional and configured in Settings. Career OS works great without any of them.",
  },
];

export function Onboarding() {
  const { data: done, isLoading } = useOnboardingDone();
  const complete = useCompleteOnboarding();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const open = !isLoading && done === false;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const finish = (goToSettings = false) => {
    complete.mutate();
    if (goToSettings) navigate("/settings");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? finish() : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <Logo className="size-9 rounded-lg" />
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg",
                current.tone,
              )}
            >
              <current.icon className="size-5" />
            </div>
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.body}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "bg-primary w-5" : "bg-muted w-1.5",
              )}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => finish()}>
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : null}
            {isLast ? (
              <>
                <Button variant="outline" onClick={() => finish()}>
                  Get started
                </Button>
                <Button onClick={() => finish(true)}>Open Settings</Button>
              </>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
