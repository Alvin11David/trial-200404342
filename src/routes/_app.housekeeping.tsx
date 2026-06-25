import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  User,
  PlayCircle,
  Ban,
  Flag,
  ClipboardCheck,
  ClipboardList,
  Grid3X3,
  Plus,
  X,
  Wrench,
  Eye,
  ShieldCheck,
  DoorOpen,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  fmtUGX,
  assignHkTask,
  updateHkTaskStatus,
  flagHkIssue,
  resolveMaintenance,
  createHousekeepingTask,
  setDND,
  clearDND,
  getActiveDND,
  setRoomStatus,
  type Room,
  type HousekeepingTask,
  type MaintenanceRequest,
  type HkTaskType,
  type HkPriority,
  type HkTaskStatus,
  type MaintSeverity,
  type RoomStatus,
} from "@/lib/pms-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/housekeeping")({
  head: () => ({ meta: [{ title: "Housekeeping — Jambo PMS" }] }),
  component: HousekeepingPage,
});

/* ============================== Types ============================== */

type Tab = "board" | "tasks" | "inspections" | "schedule" | "issues";

/* ============================== Page ============================== */

function HousekeepingPage() {
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
        {[
          { id: "board" as Tab, label: "Room Status Board", icon: Grid3X3 },
          { id: "tasks" as Tab, label: "Task Queue", icon: ClipboardList },
          { id: "inspections" as Tab, label: "Inspections", icon: ShieldCheck },
          { id: "schedule" as Tab, label: "Schedule", icon: CalendarDays },
          { id: "issues" as Tab, label: "Issues & Maintenance", icon: Wrench },
        ].map((t) => (
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

/* ============================== Status Stats ============================== */

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

/* ============================== Room Status Board ============================== */

const STATUS_META: Record<RoomStatus, { bg: string; label: string; text: string }> = {
  available: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Available",
    text: "text-emerald-700",
  },
  occupied: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    label: "Occupied",
    text: "text-blue-700",
  },
  dirty: { bg: "bg-red-50 text-red-700 border-red-200", label: "Dirty", text: "text-red-700" },
  in_progress: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    label: "In Progress",
    text: "text-amber-700",
  },
  clean: { bg: "bg-sky-50 text-sky-700 border-sky-200", label: "Clean", text: "text-sky-700" },
  inspected: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-300",
    label: "Inspected",
    text: "text-emerald-700",
  },
  maintenance: {
    bg: "bg-slate-100 text-slate-600 border-slate-300",
    label: "Maintenance",
    text: "text-slate-600",
  },
  blocked: {
    bg: "bg-slate-100 text-slate-600 border-slate-300",
    label: "Blocked",
    text: "text-slate-600",
  },
};

function RoomStatusBoard() {
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const activeDnd = useStore(() => getActiveDND());
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [floorOpen, setFloorOpen] = useState(false);

  const floors = useMemo(() => [...new Set(rooms.map((r) => r.floor))].sort(), [rooms]);
  const filtered =
    floorFilter === "all" ? rooms : rooms.filter((r) => r.floor === Number(floorFilter));

  const roomTypeMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const rt of roomTypes) m[rt.id] = rt.typeName;
    return m;
  }, [roomTypes]);

  const dndRooms = useMemo(() => new Set(activeDnd.map((d) => d.roomId)), [activeDnd]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setFloorOpen(!floorOpen)}
            className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs shadow-sm outline-none focus:border-primary/60"
          >
            {floorFilter === "all" ? "All floors" : `Floor ${floorFilter}`}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {floorOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFloorOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
                <button
                  onClick={() => {
                    setFloorFilter("all");
                    setFloorOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-xs transition hover:bg-muted",
                    floorFilter === "all" && "bg-primary/10 font-medium text-primary",
                  )}
                >
                  All floors
                </button>
                {floors.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFloorFilter(String(f));
                      setFloorOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-1.5 text-left text-xs transition hover:bg-muted",
                      floorFilter === String(f) && "bg-primary/10 font-medium text-primary",
                    )}
                  >
                    Floor {f}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          {Object.entries(STATUS_META).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  k === "available" || k === "inspected"
                    ? "bg-emerald-500"
                    : k === "occupied"
                      ? "bg-blue-500"
                      : k === "dirty"
                        ? "bg-red-500"
                        : k === "in_progress"
                          ? "bg-amber-500"
                          : k === "clean"
                            ? "bg-sky-500"
                            : "bg-slate-500",
                )}
              />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((room) => {
          const meta = STATUS_META[room.status];
          const isDnd = dndRooms.has(room.id);
          return (
            <div
              key={room.id}
              className={cn(
                "rounded-xl border bg-card p-4 transition hover:shadow-md",
                meta.bg.split(" ").slice(0, 1).join(" "),
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-display text-xl font-bold">{room.id}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    Floor {room.floor} · {roomTypeMap[room.typeId] ?? room.typeId}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isDnd && <DoorOpen className="h-4 w-4 text-warning" title="Do Not Disturb" />}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                    meta.bg,
                  )}
                >
                  {meta.label}
                </span>
                {room.assignedTo && (
                  <span className="text-[10px] text-muted-foreground">
                    <User className="mr-0.5 inline h-3 w-3" />
                    {room.assignedTo}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== Task Queue ============================== */

const TASK_TYPE_LABEL: Record<HkTaskType, string> = {
  turnover: "Turnover",
  deep_clean: "Deep clean",
  room_service: "Room service",
  linen_change: "Linen change",
  inspection: "Inspection",
};

const PRIORITY_META: Record<HkPriority, { color: string; ring: string; bg: string }> = {
  standard: { color: "text-info", ring: "ring-info/30", bg: "bg-info/10" },
  high: { color: "text-warning", ring: "ring-warning/30", bg: "bg-warning/10" },
  vip: { color: "text-destructive", ring: "ring-destructive/30", bg: "bg-destructive/10" },
};

const TASK_STATUS_META: Record<HkTaskStatus, { label: string; color: string; bg: string }> = {
  queued: { label: "Queued", color: "text-muted-foreground", bg: "bg-muted/40" },
  in_progress: { label: "In Progress", color: "text-primary", bg: "bg-primary/15" },
  clean: { label: "Clean (pending)", color: "text-sky-600", bg: "bg-sky-50" },
  flagged: { label: "Flagged", color: "text-destructive", bg: "bg-destructive/15" },
  inspected: { label: "Inspected", color: "text-success", bg: "bg-success/15" },
};

function TaskQueue() {
  const tasks = useStore((s) => s.housekeepingTasks);
  const rooms = useStore((s) => s.rooms);
  const users = useStore((s) => s.users);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<HkTaskStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showFlag, setShowFlag] = useState<string | null>(null);

  const hkUsers = useMemo(() => users.filter((u) => u.role === "Housekeeping"), [users]);
  const roomMap = useMemo(() => {
    const m: Record<string, Room> = {};
    for (const r of rooms) m[r.id] = r;
    return m;
  }, [rooms]);
  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[u.id] = u.name;
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (q) {
        const room = roomMap[t.roomId];
        const hkName = t.assignedTo ? (userMap[t.assignedTo] ?? t.assignedTo) : "";
        const search =
          `${t.id} ${t.roomId} ${TASK_TYPE_LABEL[t.type]} ${hkName} ${t.notes}`.toLowerCase();
        if (!search.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, q, roomMap, userMap]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks…"
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-xs outline-none focus:border-primary/60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as HkTaskStatus | "all")}
          className="appearance-none rounded-xl border border-border bg-card px-2 py-1.5 text-xs shadow-sm outline-none focus:border-primary/60"
        >
          <option value="all">All statuses</option>
          <option value="queued">Queued</option>
          <option value="in_progress">In Progress</option>
          <option value="clean">Clean (pending)</option>
          <option value="flagged">Flagged</option>
          <option value="inspected">Inspected</option>
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> New Task
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold">Room</th>
              <th className="px-3 py-2.5 text-left font-semibold">Task</th>
              <th className="px-3 py-2.5 text-left font-semibold">Priority</th>
              <th className="px-3 py-2.5 text-left font-semibold">Assignee</th>
              <th className="px-3 py-2.5 text-left font-semibold">Status</th>
              <th className="px-3 py-2.5 text-left font-semibold">Due</th>
              <th className="px-3 py-2.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((t) => {
              const p = PRIORITY_META[t.priority];
              const s = TASK_STATUS_META[t.status];
              const room = roomMap[t.roomId];
              return (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <span className="font-semibold">{t.roomId}</span>
                    <span className="ml-1.5 text-[10px] text-muted-foreground">
                      {room ? `F${room.floor}` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-sm">{TASK_TYPE_LABEL[t.type]}</div>
                    {t.taskDescription && (
                      <div className="text-[10px] text-muted-foreground">{t.taskDescription}</div>
                    )}
                    {t.notes && (
                      <div className="text-[10px] text-muted-foreground line-clamp-1">
                        {t.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                        p.color,
                        p.ring,
                        p.bg,
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          t.priority === "vip"
                            ? "bg-destructive"
                            : t.priority === "high"
                              ? "bg-warning"
                              : "bg-info",
                        )}
                      />
                      {t.priority === "vip"
                        ? "VIP"
                        : t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <AssigneeSelect task={t} hkUsers={hkUsers} userMap={userMap} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium",
                        s.color,
                        s.bg,
                      )}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
                    {t.due}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <TaskActions task={t} onFlag={() => setShowFlag(t.id)} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No tasks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateTaskDialog onClose={() => setShowCreate(false)} />}
      {showFlag && <FlagIssueDialog taskId={showFlag} onClose={() => setShowFlag(null)} />}
    </div>
  );
}

function AssigneeSelect({
  task,
  hkUsers,
  userMap,
}: {
  task: HousekeepingTask;
  hkUsers: { id: string; name: string }[];
  userMap: Record<string, string>;
}) {
  return (
    <select
      value={task.assignedTo ?? ""}
      onChange={(e) => assignHkTask(task.id, e.target.value || null)}
      className="max-w-[130px] rounded-xl border border-border bg-card px-2 py-1 text-[11px] shadow-sm outline-none focus:border-primary/60"
    >
      <option value="">Unassigned</option>
      {hkUsers.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  );
}

function TaskActions({ task, onFlag }: { task: HousekeepingTask; onFlag: () => void }) {
  if (task.status === "inspected") {
    return <span className="text-[11px] text-success">Completed</span>;
  }

  if (task.status === "flagged") {
    return (
      <button
        onClick={onFlag}
        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] text-destructive hover:bg-destructive/20"
      >
        <Flag className="h-3 w-3" /> Flagged
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {task.status === "queued" && (
        <button
          onClick={() => updateHkTaskStatus(task.id, "in_progress")}
          className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] text-primary hover:bg-primary/20"
        >
          <PlayCircle className="h-3 w-3" /> Start
        </button>
      )}
      {task.status === "in_progress" && (
        <button
          onClick={() => updateHkTaskStatus(task.id, "clean")}
          className="inline-flex items-center gap-1 rounded-lg border border-success/30 bg-success/10 px-2 py-1 text-[10px] text-success hover:bg-success/20"
        >
          <CheckCircle2 className="h-3 w-3" /> Mark Clean
        </button>
      )}
      {task.status === "clean" && (
        <span className="text-[10px] text-muted-foreground">Awaiting inspection</span>
      )}
      <button
        onClick={onFlag}
        className="rounded-lg border border-border bg-background p-1 text-muted-foreground hover:text-destructive"
        title="Flag issue"
      >
        <Flag className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ============================== Create Task Dialog ============================== */

function CreateTaskDialog({ onClose }: { onClose: () => void }) {
  const rooms = useStore((s) => s.rooms);
  const users = useStore((s) => s.users);
  const hkUsers = users.filter((u) => u.role === "Housekeeping");

  const [roomId, setRoomId] = useState("");
  const [type, setType] = useState<HkTaskType>("turnover");
  const [priority, setPriority] = useState<HkPriority>("standard");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("12:00");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!roomId) return;
    createHousekeepingTask({
      roomId,
      type,
      priority,
      assignedTo: assignee || null,
      due,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">Create Housekeeping Task</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">Room *</label>
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  Room {r.id} (F{r.floor})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="block text-xs font-medium text-muted-foreground">Task type</label>
          <Select value={type} onValueChange={(v) => setType(v as HkTaskType)}>
            <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {(
                [
                  "turnover",
                  "deep_clean",
                  "room_service",
                  "linen_change",
                  "inspection",
                ] as HkTaskType[]
              ).map((t) => (
                <SelectItem key={t} value={t}>
                  {TASK_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="block text-xs font-medium text-muted-foreground">Priority</label>
          <Select value={priority} onValueChange={(v) => setPriority(v as HkPriority)}>
            <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>

          <label className="block text-xs font-medium text-muted-foreground">Assign to</label>
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus:border-primary/60 focus:ring-0">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {hkUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="block text-xs font-medium text-muted-foreground">Due time</label>
          <input
            type="time"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />

          <label className="block text-xs font-medium text-muted-foreground">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            placeholder="Optional notes…"
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!roomId}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Create task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== Flag Issue Dialog ============================== */

function FlagIssueDialog({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const tasks = useStore((s) => s.housekeepingTasks);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<MaintSeverity>("medium");

  const task = tasks.find((t) => t.id === taskId);

  if (!task) return null;

  const submit = () => {
    if (!description) return;
    flagHkIssue(taskId, description, severity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">Flag Issue — Room {task.roomId}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            placeholder="Broken fixture, damage, missing item…"
          />

          <label className="block text-xs font-medium text-muted-foreground">Severity</label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as MaintSeverity)}>
            <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!description}
            className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            Flag issue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== Inspections Tab ============================== */

function InspectionsTab() {
  const tasks = useStore((s) => s.housekeepingTasks);
  const rooms = useStore((s) => s.rooms);
  const users = useStore((s) => s.users);
  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[u.id] = u.name;
    return m;
  }, [users]);
  const roomMap = useMemo(() => {
    const m: Record<string, Room> = {};
    for (const r of rooms) m[r.id] = r;
    return m;
  }, [rooms]);

  const pending = useMemo(() => tasks.filter((t) => t.status === "clean"), [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {pending.length} room{pending.length !== 1 ? "s" : ""} waiting for inspection
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Room</th>
              <th className="px-4 py-2.5 text-left font-semibold">Floor</th>
              <th className="px-4 py-2.5 text-left font-semibold">Cleaned by</th>
              <th className="px-4 py-2.5 text-left font-semibold">Task type</th>
              <th className="px-4 py-2.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pending.map((t) => {
              const room = roomMap[t.roomId];
              return (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">{t.roomId}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {room ? `Floor ${room.floor}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {t.assignedTo ? (userMap[t.assignedTo] ?? t.assignedTo) : "Unassigned"}
                  </td>
                  <td className="px-4 py-3">{TASK_TYPE_LABEL[t.type]}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => updateHkTaskStatus(t.id, "inspected")}
                        className="inline-flex items-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-[11px] font-semibold text-success-foreground hover:bg-success/90"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => updateHkTaskStatus(t.id, "queued")}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-[11px] text-destructive hover:bg-destructive/10"
                        title="Send back to dirty"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pending.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  All rooms inspected and ready.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================== Schedule Tab ============================== */

function ScheduleTab() {
  const tasks = useStore((s) => s.housekeepingTasks);
  const users = useStore((s) => s.users);

  const hkUsers = useMemo(() => users.filter((u) => u.role === "Housekeeping"), [users]);

  const schedule = useMemo(() => {
    return hkUsers.map((u) => {
      const assigned = tasks.filter((t) => t.assignedTo === u.id);
      return {
        user: u,
        total: assigned.length,
        queued: assigned.filter((t) => t.status === "queued").length,
        inProgress: assigned.filter((t) => t.status === "in_progress").length,
        clean: assigned.filter((t) => t.status === "clean").length,
        done: assigned.filter((t) => t.status === "inspected").length,
      };
    });
  }, [tasks, hkUsers]);

  const unassigned = tasks.filter((t) => !t.assignedTo);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schedule.map((s) => (
          <div key={s.user.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-success/40 text-sm font-bold text-foreground">
                {s.user.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <div className="font-semibold">{s.user.name}</div>
                <div className="text-xs text-muted-foreground">{s.total} tasks today</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px]">
              <div>
                <div className="text-lg font-bold text-muted-foreground">{s.queued}</div>
                <div className="text-muted-foreground">Queued</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">{s.inProgress}</div>
                <div className="text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-lg font-bold text-sky-600">{s.clean}</div>
                <div className="text-muted-foreground">Clean</div>
              </div>
              <div>
                <div className="text-lg font-bold text-success">{s.done}</div>
                <div className="text-muted-foreground">Done</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {unassigned.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold">
            Unassigned Tasks ({unassigned.length})
          </h3>
          <ul className="mt-3 space-y-1">
            {unassigned.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span>
                  Room {t.roomId} — {TASK_TYPE_LABEL[t.type]}
                </span>
                <span className="text-[11px] text-muted-foreground">Due {t.due}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ============================== Issues & Maintenance Tab ============================== */

const SEV_META: Record<MaintSeverity, { bg: string; color: string; label: string }> = {
  low: { bg: "bg-info/10", color: "text-info", label: "Low" },
  medium: { bg: "bg-warning/10", color: "text-warning", label: "Medium" },
  high: { bg: "bg-destructive/10", color: "text-destructive", label: "High" },
  critical: { bg: "bg-destructive/20", color: "text-destructive font-bold", label: "Critical" },
};

function IssuesTab() {
  const requests = useStore((s) => s.maintenanceRequests);
  const tasks = useStore((s) => s.housekeepingTasks);
  const rooms = useStore((s) => s.rooms);
  const users = useStore((s) => s.users);

  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[u.id] = u.name;
    return m;
  }, [users]);

  const enriched = useMemo(() => {
    return requests.map((r) => {
      const task = tasks.find((t) => t.id === r.taskId);
      const room = rooms.find((rm) => rm.id === r.roomId);
      return { ...r, task, room, reportedByName: userMap[r.reportedBy] ?? r.reportedBy };
    });
  }, [requests, tasks, rooms, userMap]);

  const open = enriched.filter((r) => r.status === "open");
  const resolved = enriched.filter((r) => r.status !== "open");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {open.length} open issue{open.length !== 1 ? "s" : ""}
        </span>
      </div>

      {open.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Room</th>
                <th className="px-4 py-2.5 text-left font-semibold">Issue</th>
                <th className="px-4 py-2.5 text-left font-semibold">Severity</th>
                <th className="px-4 py-2.5 text-left font-semibold">Reported by</th>
                <th className="px-4 py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {open.map((r) => {
                const sm = SEV_META[r.severity];
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold">{r.roomId}</td>
                    <td className="px-4 py-3">
                      <div>{r.description}</div>
                      {r.task && (
                        <div className="text-[10px] text-muted-foreground">
                          Task: {TASK_TYPE_LABEL[r.task.type]}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium",
                          sm.bg,
                          sm.color,
                        )}
                      >
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.reportedByName}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => resolveMaintenance(r.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-[11px] font-semibold text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No open maintenance issues.
        </p>
      )}

      {resolved.length > 0 && (
        <details className="rounded-xl border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground">
            Resolved issues ({resolved.length})
          </summary>
          <div className="border-t border-border px-4 py-2">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 text-xs">
                <span>
                  Room {r.roomId} — {r.description}
                </span>
                <span className="text-success">Resolved</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
