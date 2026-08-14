import { useMemo, useState } from "react";
import {
  Grid3X3,
  ClipboardList,
  ShieldCheck,
  CalendarDays,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/pms-store";
import RoomStatusBoard from "./RoomStatusBoard";
import TaskQueue from "./TaskQueue";
import InspectionsTab from "./InspectionsTab";
import ScheduleTab from "./ScheduleTab";
import IssuesTab from "./IssuesTab";

type Tab = "board" | "tasks" | "inspections" | "schedule" | "issues";

const TABS: { id: Tab; label: string; icon: typeof Grid3X3 }[] = [
  { id: "board", label: "Room Status Board", icon: Grid3X3 },
  { id: "tasks", label: "Task Queue", icon: ClipboardList },
  { id: "inspections", label: "Inspections", icon: ShieldCheck },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "issues", label: "Issues & Maintenance", icon: Wrench },
];

export default function HousekeepingPage() {
  const [tab, setTab] = useState<Tab>("board");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            Guest Experience
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Housekeeping</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live room status board, task queue, and inspection workflow.
          </p>
        </div>
      </header>

      <RoomStatusStats />

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "board" && <RoomStatusBoard />}
      {tab === "tasks" && <TaskQueue />}
      {tab === "inspections" && <InspectionsTab />}
      {tab === "schedule" && <ScheduleTab />}
      {tab === "issues" && <IssuesTab />}
    </div>
  );
}

function RoomStatusStats() {
  const rooms = useStore((s) => s.rooms);
  const tasks = useStore((s) => s.housekeepingTasks);

  const stats = useMemo(() => {
    const statuses: Record<string, number> = {};
    for (const r of rooms) {
      statuses[r.status] = (statuses[r.status] ?? 0) + 1;
    }
    return {
      dirty: statuses.dirty ?? 0,
      inProgress: statuses.in_progress ?? 0,
      clean: statuses.clean ?? 0,
      inspected: statuses.inspected ?? 0,
      blocked: (statuses.blocked ?? 0) + (statuses.maintenance ?? 0),
      queued: tasks.filter((t) => t.status === "queued").length,
    };
  }, [rooms, tasks]);

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Stat color="bg-red-500" label="Dirty" value={stats.dirty} />
      <Stat color="bg-amber-500" label="In Progress" value={stats.inProgress} />
      <Stat color="bg-sky-500" label="Clean (pending inspect)" value={stats.clean} />
      <Stat color="bg-emerald-500" label="Inspected / Available" value={stats.inspected} />
      <Stat color="bg-slate-500" label="Blocked / Maint" value={stats.blocked} />
      <Stat color="bg-violet-500" label="Queued Tasks" value={stats.queued} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
      <span className={cn("absolute left-0 top-0 h-full w-[3px]", color)} />
      <div className="flex items-center gap-3 pl-1">
        <span className={cn("h-3 w-3 rounded-full", color)} />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        </div>
      </div>
    </div>
  );
}
