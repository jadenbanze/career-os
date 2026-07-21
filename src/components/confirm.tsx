import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based confirmation. Usage:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Delete?", destructive: true }))) return;
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options = {}) =>
      new Promise<boolean>((resolve) => {
        // Defer a tick so a triggering dropdown-menu item fully closes first
        // (avoids a Radix focus-trap flash when opening from a menu).
        setTimeout(() => setState({ options, resolve }), 0);
      }),
    [],
  );

  const settle = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  const opts = state?.options ?? {};

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!state} onOpenChange={(open) => (!open ? settle(false) : null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{opts.title ?? "Are you sure?"}</DialogTitle>
            {opts.description ? (
              <DialogDescription>{opts.description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {opts.cancelText ?? "Cancel"}
            </Button>
            <Button
              variant={opts.destructive ? "destructive" : "default"}
              onClick={() => settle(true)}
            >
              {opts.confirmText ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
