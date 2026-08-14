import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, UserCheck, CheckCircle2, Ban, Flag, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  getUserRoleNames,
  assignHkTask,
  updateHkTaskStatus,
  markHkTaskDirty,
  permissionsForRole,
  type Room,
  type HousekeepingTask,
  type HkTaskType,
  type HkPriority,
  type HkTaskStatus,
} from "@/lib/pms-store";
import { useRole } from "@/lib/role";
import { CreateTaskDialog, FlagIssueDialog } from "./housekeeping-dialogs";

export const TASK_TYPE_LABEL: Record<HkTaskType, string> = {
  turnover: "Turnover",
  deep_clean: "Deep clean",
  room_service: "Room service",
  linen_change: "Linen change",
  inspection: "Inspection",
  cleaning: "Cleaning",
};

const PRIORITY_META: Record<HkPriority, { color: string; ring: string; bg: string }> = {
  standard: { color: "text-info", ring: "ring-info/30", bg: "bg-info/10" },
  high: { color: "text-warning", ring: "ring-warning/30", bg: "bg-warning/10" },
  vip: { color: "text-destructive", ring: "ring-destructive/30", bg: "bg-destructive/10" },
};

const TASK_STATUS_META: Record<HkTaskStatus, { label: string; color: string; bg: string }> = {
  queued: { label: "Queued", color: "text-muted-foreground", bg: "bg-muted/60" },
  pending: { label: "Pending — awaiting cleaner", color: "text-info", bg: "bg-info/10" },
  in_progress: { label: "In progress", color: "text-primary", bg: "bg-primary/10" },
  clean: { label: "Ready for inspection", color: "text-success", bg: "bg-success/10" },
  flagged: { label: "Flagged", color: "text-destructive", bg: "bg-destructive/10" },
  inspected: { label: "Inspected", color: "text-muted-foreground", bg: "bg-muted/60" },
};

export default function TaskQueue() {
  const { role } = useRole();
  const canAssign = permissionsForRole(role).includes("housekeeping.assign");
  const tasks = useStore((s) => s.housekeepingTasks);
  const rooms = useStore((s) => s.rooms);
  const users = useStore((s) => s.users);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<HkTaskStatus | "all">("all");
  const [draftAssign, setDraftAssign] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showFlag, setShowFlag] = useState<string | null>(null);

  const hkUsers = useMemo(() => users.filter((u) => getUserRoleNames(u.id).includes("Housekeeping")), [users]);
  const roomMap = useMemo(() => {
    const m: Record<string, Room> = {};
    for (const r of rooms) m[r.id] = r;
    return m;
  }, [rooms]);
  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[u.id] = u.fullName;
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (q) {
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
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="clean">Clean (ready)</option>
          <option value="flagged">Flagged</option>
          <option value="inspected">Inspected</option>
        </select>
        {canAssign && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> New Task
          </button>
        )}
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
              const draft = draftAssign[t.id] ?? t.assignedTo ?? "";
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
                    <AssigneeSelect
                      task={t}
                      hkUsers={hkUsers}
                      canAssign={canAssign}
                      userMap={userMap}
                      draft={draft}
                      editing={editingId === t.id}
                      onDraft={(v) => setDraftAssign((d) => ({ ...d, [t.id]: v }))}
                    />
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
                    <TaskActions
                      task={t}
                      canAssign={canAssign}
                      editing={editingId === t.id}
                      onAssign={() => {
                        if (!draft) {
                          toast.error("Select a cleaner first.");
                          return;
                        }
                        assignHkTask(t.id, draft);
                        setDraftAssign((d) => ({ ...d, [t.id]: "" }));
                        setEditingId(null);
                        toast.success("Task assigned");
                      }}
                      onChange={() => setEditingId(t.id)}
                      onFlag={() => setShowFlag(t.id)}
                    />
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

      {showCreate && (
        <CreateTaskDialog
          onClose={(t) => {
            setShowCreate(false);
            if (t) (t.tone === "ok" ? toast.success : toast.error)(t.msg);
          }}
        />
      )}
      {showFlag && (
        <FlagIssueDialog
          taskId={showFlag}
          onClose={(t) => {
            setShowFlag(null);
            if (t) (t.tone === "ok" ? toast.success : toast.error)(t.msg);
          }}
        />
      )}
    </div>
  );
}

function AssigneeSelect({
  task,
  hkUsers,
  canAssign,
  userMap,
  draft,
  editing,
  onDraft,
}: {
  task: HousekeepingTask;
  hkUsers: { id: string; fullName: string }[];
  canAssign: boolean;
  userMap: Record<string, string>;
  draft: string;
  editing: boolean;
  onDraft: (v: string) => void;
}) {
  if (canAssign && (editing || !task.assignedTo)) {
    return (
      <select
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        className="max-w-[130px] rounded-xl border border-border bg-card px-2 py-1 text-[11px] shadow-sm outline-none focus:border-primary/60"
      >
        <option value="">Select cleaner…</option>
        {hkUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.fullName}
          </option>
        ))}
      </select>
    );
  }

  return task.assignedTo ? (
    <span className="text-[11px] font-medium text-success">
      {userMap[task.assignedTo] ?? task.assignedTo}
    </span>
  ) : (
    <span className="text-[11px] text-muted-foreground">Unassigned</span>
  );
}

function TaskActions({
  task,
  canAssign,
  editing,
  onAssign,
  onChange,
  onFlag,
}: {
  task: HousekeepingTask;
  canAssign: boolean;
  editing: boolean;
  onAssign: () => void;
  onChange: () => void;
  onFlag: () => void;
}) {
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
      {(task.status === "queued" || task.status === "pending") && canAssign && (
        task.assignedTo && !editing ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-lg border border-success/30 bg-success/10 px-2 py-1 text-[10px] text-success">
              <UserCheck className="h-3 w-3" /> Assigned
            </span>
            <button
              onClick={onChange}
              title="Change cleaner"
              className="rounded-lg border border-border bg-background p-1 text-muted-foreground hover:text-primary"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </>
        ) : (
          <button
            onClick={onAssign}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] text-primary hover:bg-primary/20"
          >
            <UserCheck className="h-3 w-3" /> Assign
          </button>
        )
      )}
      {task.status === "pending" && !canAssign && (
        <span className="text-[10px] text-muted-foreground">Awaiting cleaner</span>
      )}
      {task.status === "in_progress" && canAssign && (
        <>
          <button
            onClick={() => updateHkTaskStatus(task.id, "clean")}
            className="inline-flex items-center gap-1 rounded-lg border border-success/30 bg-success/10 px-2 py-1 text-[10px] text-success hover:bg-success/20"
          >
            <CheckCircle2 className="h-3 w-3" /> Mark Clean
          </button>
          <button
            onClick={() => markHkTaskDirty(task.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-warning/30 bg-warning/10 px-2 py-1 text-[10px] text-warning hover:bg-warning/20"
          >
            <Ban className="h-3 w-3" /> Mark Dirty
          </button>
        </>
      )}
      {task.status === "in_progress" && !canAssign && (
        <span className="text-[10px] text-muted-foreground">Cleaning in progress</span>
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
