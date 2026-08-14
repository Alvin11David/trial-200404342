import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function to24h(h: number, m: number, pm: boolean): string {
  const hh = pm ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function to12h(time24: string): { h: number; m: number; pm: boolean } | null {
  const m = time24.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (hh > 23 || mm > 59) return null;
  return {
    h: hh === 0 ? 12 : hh > 12 ? hh - 12 : hh,
    m: mm,
    pm: hh >= 12,
  };
}

function display12(value: string): string {
  const t = to12h(value);
  if (!t) return "";
  const ampm = t.pm ? "PM" : "AM";
  return `${String(t.h).padStart(2, "0")}:${String(t.m).padStart(2, "0")} ${ampm}`;
}

function parseInput(v: string): string {
  const cleaned = v.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  let m = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const isPm = m[3]?.toLowerCase() === "pm";
    if (h > 23 || min > 59) return cleaned;
    if (m[3]) {
      if (h > 12 || h < 1) return cleaned;
      h = isPm ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    }
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  m = cleaned.match(/^(\d{1,2})(\d{2})\s*(am|pm)?$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const isPm = m[3]?.toLowerCase() === "pm";
    if (h > 23 || min > 59) return cleaned;
    if (m[3]) {
      if (h > 12 || h < 1) return cleaned;
      h = isPm ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    }
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  m = cleaned.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const isPm = m[2].toLowerCase() === "pm";
    if (h > 12 || h < 1) return cleaned;
    h = isPm ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    return `${String(h).padStart(2, "0")}:00`;
  }

  return cleaned;
}

function parseHour(v: string): number | null {
  const m = v.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

const TIMES: { label: string; value: string }[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const v = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    TIMES.push({ label: display12(v), value: v });
  }
}

const AM_TIMES = TIMES.filter((t) => !t.label.includes("PM"));
const PM_TIMES = TIMES.filter((t) => t.label.includes("PM"));

export function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value ? display12(value) : "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      setInput(display12(value));
    }
  }, [value]);

  function handleBlur() {
    const parsed = parseInput(input);
    if (parsed && /^\d{2}:\d{2}$/.test(parsed)) {
      onChange(parsed);
      setInput(display12(parsed));
    } else if (!parsed) {
      onChange("");
      setInput("");
    } else {
      setInput(value ? display12(value) : "");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsed = parseInput(input);
      if (parsed && /^\d{2}:\d{2}$/.test(parsed)) {
        onChange(parsed);
        setInput(display12(parsed));
        setOpen(false);
      }
    }
  }

  function selectTime(v: string) {
    onChange(v);
    setInput(display12(v));
    setOpen(false);
    ref.current?.focus();
  }

  function togglePeriod() {
    const t = value ? to12h(value) : null;
    if (!t) return;
    const v = to24h(t.h, t.m, !t.pm);
    onChange(v);
    setInput(display12(v));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "mt-1 flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus-within:border-primary/60 cursor-text",
            !value && "text-muted-foreground",
          )}
          onClick={() => ref.current?.focus()}
        >
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={ref}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Select time"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[220px] p-2"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
          {value && to12h(value) && (
            <button
              onClick={togglePeriod}
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-medium transition",
                to12h(value)?.pm
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              PM
            </button>
          )}
          {value && to12h(value) && (
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {display12(value)}
            </span>
          )}
          {value && to12h(value) && (
            <button
              onClick={togglePeriod}
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-medium transition",
                !to12h(value)?.pm
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              AM
            </button>
          )}
          {!value && (
            <span className="text-sm text-muted-foreground">Select a time</span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 space-y-0.5">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              AM
            </p>
            <div className="max-h-[200px] overflow-y-auto">
              {AM_TIMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => selectTime(t.value)}
                  className={cn(
                    "flex w-full items-center justify-center rounded-md px-2 py-1.5 text-sm transition",
                    value === t.value
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {t.label.replace(" AM", "")}
                </button>
              ))}
            </div>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 space-y-0.5">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              PM
            </p>
            <div className="max-h-[200px] overflow-y-auto">
              {PM_TIMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => selectTime(t.value)}
                  className={cn(
                    "flex w-full items-center justify-center rounded-md px-2 py-1.5 text-sm transition",
                    value === t.value
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {t.label.replace(" PM", "")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
