import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, ArrowLeft, Filter, ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/hr/schedule")({
  head: () => ({ meta: [{ title: "Employee Schedule — Jambo ERP" }] }),
  component: SchedulePage,
});

type ShiftType = "Morning" | "Afternoon" | "Night" | "Off";

type Shift = {
  employee: string;
  department: string;
  shifts: Record<string, ShiftType>;
};

const DEPARTMENTS = ["All", "Front Office", "Housekeeping", "Kitchen", "F&B", "Maintenance", "Security", "Admin"];

const EMPLOYEES = [
  "Amani Kato", "Grace Achieng", "David Ochieng", "Sarah Nakato",
  "John Mukasa", "Mary Nakibuuka", "Peter Ssempijja", "Esther Nambi",
  "Robert Kizza", "Samuel Wasswa", "Helen Nanteza",
];

const DEPT_MAP: Record<string, string> = {
  "Amani Kato": "Front Office",
  "Grace Achieng": "Housekeeping",
  "David Ochieng": "Kitchen",
  "Sarah Nakato": "Admin",
  "John Mukasa": "F&B",
  "Mary Nakibuuka": "Housekeeping",
  "Peter Ssempijja": "Maintenance",
  "Esther Nambi": "Front Office",
  "Robert Kizza": "Security",
  "Samuel Wasswa": "Kitchen",
  "Helen Nanteza": "Front Office",
};

const SHIFT_COLORS: Record<ShiftType, string> = {
  Morning: "bg-amber-500/20 text-amber-600 border-amber-500/30 dark:text-amber-400",
  Afternoon: "bg-sky-500/20 text-sky-600 border-sky-500/30 dark:text-sky-400",
  Night: "bg-indigo-500/20 text-indigo-600 border-indigo-500/30 dark:text-indigo-400",
  Off: "bg-muted/40 text-muted-foreground border-border/40",
};

function generateSchedule(date: Date): Shift[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return EMPLOYEES.map((name) => {
    const shifts: Record<string, ShiftType> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const day = d.getDay();
      const empIdx = EMPLOYEES.indexOf(name);
      if (day === 0 || day === 6) {
        shifts[key] = ((empIdx + day) % 3 === 0) ? "Morning" : "Off";
      } else {
        const rotation: ShiftType[] = ["Morning", "Afternoon", "Night"];
        shifts[key] = rotation[(empIdx + day) % 3];
      }
    }
    return { employee: name, department: DEPT_MAP[name] ?? "Admin", shifts };
  });
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SchedulePage() {
  const [today] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const schedule = useMemo(() => generateSchedule(weekStart), [weekStart]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const filtered = useMemo(
    () =>
      schedule.filter(
        (s) =>
          (deptFilter === "All" || s.department === deptFilter) &&
          (search === "" || s.employee.toLowerCase().includes(search.toLowerCase())),
      ),
    [schedule, deptFilter, search],
  );

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToCurrentWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(d);
  };

  const isCurrentWeek = weekStart.toISOString().slice(0, 10) ===
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).toISOString().slice(0, 10);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Link
          to="/hr"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Employee Schedule</h1>
          <p className="text-xs text-muted-foreground">Weekly shift planning</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full rounded-xl border border-border/60 bg-card/50 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-xl border border-border/60 bg-card/50 px-3 py-2 text-xs outline-none transition-colors focus:border-primary/50"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d} className="bg-card">{d === "All" ? "All departments" : d}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {weekDays[0].toLocaleDateString("en-UG", { month: "short", day: "numeric" })} —{" "}
            {weekDays[6].toLocaleDateString("en-UG", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          {!isCurrentWeek && (
            <button
              onClick={goToCurrentWeek}
              className="rounded-lg border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-500/40" /> Morning</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-sky-500/40" /> Afternoon</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-indigo-500/40" /> Night</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-muted/60" /> Off</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="sticky left-0 z-10 bg-muted/20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Employee
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                {weekDays.map((d, i) => {
                  const isToday = d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
                  return (
                    <th
                      key={i}
                      className={cn(
                        "px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider",
                        isToday ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <div>{DAY_LABELS[i]}</div>
                      <div className={cn("font-mono text-[10px]", isToday && "text-primary")}>{d.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.employee} className="border-b border-border/30 transition-colors last:border-b-0 hover:bg-muted/20">
                  <td className="sticky left-0 z-10 bg-card px-4 py-3 text-sm font-medium">{s.employee}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.department}</td>
                  {weekDays.map((d, i) => {
                    const key = d.toISOString().slice(0, 10);
                    const shift = s.shifts[key] ?? "Off";
                    const isToday = key === today.toISOString().slice(0, 10);
                    return (
                      <td key={i} className={cn("px-3 py-3 text-center", isToday && "ring-1 ring-primary/20 ring-inset")}>
                        <span className={cn(
                          "inline-block rounded-md border px-2.5 py-1 text-[11px] font-medium leading-none",
                          SHIFT_COLORS[shift],
                        )}>
                          {shift}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
          <Clock className="h-8 w-8 opacity-40" />
          <p>No employees match the current filters.</p>
        </div>
      )}
    </div>
  );
}
