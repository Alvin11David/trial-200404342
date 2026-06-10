import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  User,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/housekeeping")({
  head: () => ({ meta: [{ title: "Housekeeping — Jambo ERP" }] }),
  component: HousekeepingPage,
});

type Priority = "High" | "Medium" | "Low";
type Status = "Queued" | "In Progress" | "Done";
type Task = {
  id: string;
  room: string;
  type: string;
  floor: number;
  priority: Priority;
  status: Status;
  assignee: string | null;
  due: string;
  notes?: string;
};

const housekeepers = ["Unassigned", "Joan Nansubuga", "Mukasa Peter", "Grace Atim", "Robert Onen", "Patience Ayo"];

const initialTasks: Task[] = [
  { id: "T-1041", room: "204", floor: 2, type: "Turnover after checkout", priority: "High",   status: "Queued",      assignee: "Joan Nansubuga", due: "11:30", notes: "Guest reported a stain on bedding" },
  { id: "T-1042", room: "308", floor: 3, type: "Deep clean",               priority: "Medium", status: "Queued",      assignee: null,             due: "12:00" },
  { id: "T-1043", room: "412", floor: 4, type: "Restock minibar",          priority: "Low",    status: "Queued",      assignee: null,             due: "13:15" },
  { id: "T-1044", room: "117", floor: 1, type: "Turnover",                 priority: "Medium", status: "In Progress", assignee: "Grace Atim",     due: "11:00" },
  { id: "T-1045", room: "502", floor: 5, type: "Suite refresh",            priority: "High",   status: "In Progress", assignee: "Mukasa Peter",   due: "12:30", notes: "VIP guest arriving 14:00" },
  { id: "T-1046", room: "203", floor: 2, type: "Turnover",                 priority: "Medium", status: "Done",        assignee: "Joan Nansubuga", due: "10:00" },
  { id: "T-1047", room: "305", floor: 3, type: "Deep clean",               priority: "Low",    status: "Done",        assignee: "Mukasa Peter",   due: "09:30" },
  { id: "T-1048", room: "410", floor: 4, type: "Turnover",                 priority: "Medium", status: "Done",        assignee: "Grace Atim",     due: "09:00" },
  { id: "T-1049", room: "501", floor: 5, type: "Suite refresh",            priority: "High",   status: "Done",        assignee: "Joan Nansubuga", due: "08:45" },
];

const priMeta: Record<Priority, { color: string; ring: string; bg: string }> = {
  High:   { color: "text-destructive", ring: "ring-destructive/30", bg: "bg-destructive/10" },
  Medium: { color: "text-warning",     ring: "ring-warning/30",     bg: "bg-warning/10" },
  Low:    { color: "text-info",        ring: "ring-info/30",        bg: "bg-info/10" },
};

const statusMeta: Record<Status, { color: string; bg: string }> = {
  Queued:        { color: "text-muted-foreground", bg: "bg-muted/40 border-border/40" },
  "In Progress": { color: "text-primary",          bg: "bg-primary/15 border-primary/30" },
  Done:          { color: "text-success",          bg: "bg-success/15 border-success/30" },
};

function HousekeepingPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [query, setQuery] = useState("");
  const [floor, setFloor] = useState<string>("All");
  const [priority, setPriority] = useState<string>("All");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (query && !`${t.room} ${t.type} ${t.assignee ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (floor !== "All" && t.floor !== Number(floor)) return false;
      if (priority !== "All" && t.priority !== priority) return false;
      return true;
    });
  }, [tasks, query, floor, priority]);

  const stats = useMemo(() => ({
    queued: tasks.filter((t) => t.status === "Queued").length,
    progress: tasks.filter((t) => t.status === "In Progress").length,
    done: tasks.filter((t) => t.status === "Done").length,
    high: tasks.filter((t) => t.priority === "High" && t.status !== "Done").length,
  }), [tasks]);

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const advance = (t: Task) => {
    if (t.status === "Queued")      updateTask(t.id, { status: "In Progress" });
    else if (t.status === "In Progress") updateTask(t.id, { status: "Done" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Housekeeping</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live operations board for the housekeeping team.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Queued" value={stats.queued} icon={Clock} tone="warning" />
        <StatTile label="In Progress" value={stats.progress} icon={Sparkles} tone="primary" />
        <StatTile label="Completed Today" value={stats.done} icon={CheckCircle2} tone="success" />
        <StatTile label="High Priority Open" value={stats.high} icon={AlertTriangle} tone="destructive" />
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search room, task, housekeeper…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60"
            />
          </div>
          <select
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            {["All", 1, 2, 3, 4, 5].map((f) => (
              <option key={f} value={f} className="bg-card">{f === "All" ? "All floors" : `Floor ${f}`}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            {["All", "High", "Medium", "Low"].map((p) => (
              <option key={p} value={p} className="bg-card">{p === "All" ? "All priorities" : p}</option>
            ))}
          </select>
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> More
          </button>
        </div>
      </div>

      {/* Task rows */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="hidden grid-cols-12 gap-3 border-b border-border/40 px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground sm:grid">
          <div className="col-span-2">Room</div>
          <div className="col-span-3">Task</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-3">Assignee</div>
          <div className="col-span-1">Due</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <ul className="divide-y divide-border/30">
          {filtered.map((t) => {
            const p = priMeta[t.priority];
            const s = statusMeta[t.status];
            return (
              <li
                key={t.id}
                className="grid grid-cols-1 gap-3 px-4 py-4 transition hover:bg-card/40 sm:grid-cols-12 sm:items-center"
              >
                {/* Room */}
                <div className="col-span-2 flex items-center gap-3">
                  <div
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-xl ring-1",
                      p.ring, p.bg,
                    )}
                  >
                    <span className={cn("font-display text-sm font-bold", p.color)}>{t.room}</span>
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Floor {t.floor}
                  </div>
                </div>

                {/* Task */}
                <div className="col-span-3">
                  <div className="font-medium">{t.type}</div>
                  {t.notes && (
                    <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {t.notes}
                    </div>
                  )}
                  <span className={cn("mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium", s.bg, s.color)}>
                    {t.status}
                  </span>
                </div>

                {/* Priority */}
                <div className="col-span-2">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1", p.color, p.ring, p.bg)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", t.priority === "High" ? "bg-destructive" : t.priority === "Medium" ? "bg-warning" : "bg-info", "animate-pulse-glow")} />
                    {t.priority}
                  </span>
                </div>

                {/* Assignee */}
                <div className="col-span-3">
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-success/40 text-[10px] font-semibold">
                      {t.assignee ? t.assignee.split(" ").map((p) => p[0]).join("").slice(0, 2) : <User className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <select
                      value={t.assignee ?? "Unassigned"}
                      onChange={(e) =>
                        updateTask(t.id, { assignee: e.target.value === "Unassigned" ? null : e.target.value })
                      }
                      className="w-full appearance-none rounded-xl border border-border/70 bg-card/40 py-2 pl-12 pr-3 text-sm outline-none transition focus:border-primary/60"
                    >
                      {housekeepers.map((h) => (
                        <option key={h} value={h} className="bg-card">{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due */}
                <div className="col-span-1 text-sm font-medium tabular-nums">{t.due}</div>

                {/* Action */}
                <div className="col-span-1 flex justify-end">
                  {t.status !== "Done" ? (
                    <button
                      onClick={() => advance(t)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                        t.status === "Queued"
                          ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                          : "border-success/40 bg-success/10 text-success hover:bg-success/20",
                      )}
                    >
                      {t.status === "Queued" ? <PlayCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      {t.status === "Queued" ? "Start" : "Done"}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-2.5 py-1.5 text-xs text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  )}
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-16 text-center text-sm text-muted-foreground">
              No housekeeping tasks match your filters.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function StatTile({
  label, value, icon: Icon, tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "warning" | "primary" | "success" | "destructive";
}) {
  const grad: Record<typeof tone, string> = {
    warning: "from-[oklch(0.78_0.16_75)] to-[oklch(0.7_0.18_50)]",
    primary: "from-[oklch(0.74_0.21_71)] to-[oklch(0.60_0.18_55)]",
    success: "from-[oklch(0.72_0.16_162)] to-[oklch(0.6_0.18_180)]",
    destructive: "from-[oklch(0.7_0.22_25)] to-[oklch(0.6_0.24_15)]",
  };
  return (
    <div className="glass card-hover relative overflow-hidden rounded-2xl p-5">
      <div className={cn("absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl bg-gradient-to-br", grad[tone])} />
      <div className="relative flex items-center gap-4">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-primary-foreground", grad[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        </div>
      </div>
    </div>
  );
}
