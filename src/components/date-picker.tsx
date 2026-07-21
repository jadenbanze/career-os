import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onChange,
  withTime = false,
  placeholder = "Pick a date",
  id,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  withTime?: boolean;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(value ?? new Date()));

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [month]);

  const selectDay = (day: Date) => {
    const next = new Date(day);
    if (withTime) {
      const src = value ?? new Date(new Date().setHours(9, 0, 0, 0));
      next.setHours(src.getHours(), src.getMinutes(), 0, 0);
    }
    onChange(next);
    if (!withTime) setOpen(false);
  };

  const changeTime = (t: string) => {
    if (!t) return;
    const [h, m] = t.split(":").map(Number);
    const base = value ? new Date(value) : new Date();
    base.setHours(h || 0, m || 0, 0, 0);
    onChange(base);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="flex-1 truncate text-left">
            {value ? format(value, withTime ? "PP 'at' p" : "PP") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-sm font-medium">{format(month, "MMMM yyyy")}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-muted-foreground flex h-7 w-8 items-center justify-center text-[11px] font-medium"
            >
              {d}
            </div>
          ))}
          {days.map((day) => {
            const selected = value ? isSameDay(day, value) : false;
            const outside = !isSameMonth(day, month);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => selectDay(day)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors hover:bg-accent",
                  outside && "text-muted-foreground/40",
                  isToday(day) && !selected && "border-primary/50 border",
                  selected &&
                    "bg-primary text-primary-foreground hover:bg-primary font-medium",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {withTime ? (
            <Input
              type="time"
              value={value ? format(value, "HH:mm") : ""}
              onChange={(e) => changeTime(e.target.value)}
              className="h-8"
            />
          ) : null}
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-8"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          ) : null}
          {withTime ? (
            <Button
              type="button"
              size="sm"
              className="h-8"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
