import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useStore,
  getUserRoleNames,
  createHousekeepingTask,
  flagHkIssue,
  upsertRoomInspection,
  updateHkTaskStatus,
  nextRoomInspectionId,
  type HkTaskType,
  type HkPriority,
  type MaintSeverity,
  type InspectionResult,
} from "@/lib/pms-store";
import { TASK_TYPE_LABEL } from "./TaskQueue";

type ToastPayload = { tone: "ok" | "err"; msg: string };

export function CreateTaskDialog({
  onClose,
}: {
  onClose: (toast?: ToastPayload) => void;
}) {
  const rooms = useStore((s) => s.rooms);
  const users = useStore((s) => s.users);
  const hkUsers = users.filter((u) => getUserRoleNames(u.id).includes("Housekeeping"));

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
    onClose({ tone: "ok", msg: `Task created for Room ${roomId}.` });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">Create Housekeeping Task</h3>
          <button onClick={() => onClose()} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
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
                  Room {r.roomNumber} (F{r.floor})
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
              {hkUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName}
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
            onClick={() => onClose()}
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

export function FlagIssueDialog({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: (toast?: ToastPayload) => void;
}) {
  const tasks = useStore((s) => s.housekeepingTasks);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<MaintSeverity>("medium");

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const submit = () => {
    if (!description) return;
    flagHkIssue(taskId, description, severity);
    onClose({ tone: "ok", msg: `Issue flagged for Room ${task.roomId}.` });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">Flag Issue — Room {task.roomId}</h3>
          <button onClick={() => onClose()} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
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
            onClick={() => onClose()}
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

export function InspectionResultDialog({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: (toast?: ToastPayload) => void;
}) {
  const tasks = useStore((s) => s.housekeepingTasks);
  const users = useStore((s) => s.users);
  const hkUsers = users.filter((u) => getUserRoleNames(u.id).includes("Housekeeping"));

  const task = tasks.find((t) => t.id === taskId);
  const [inspectorId, setInspectorId] = useState("");
  const [result, setResult] = useState<InspectionResult>("pass");
  const [defectNotes, setDefectNotes] = useState("");

  if (!task) return null;

  const needsNotes = result === "fail";
  const canSubmit = !!inspectorId && (!needsNotes || defectNotes.trim().length > 0);

  const submit = () => {
    if (!canSubmit) return;
    const now = new Date().toISOString();
    upsertRoomInspection({
      id: nextRoomInspectionId(),
      propertyId: "JAMBO-UG-001",
      housekeepingTaskId: taskId,
      roomId: task.roomId,
      inspectorId,
      result,
      defectNotes: defectNotes.trim() || undefined,
      inspectedAt: now,
      createdAt: now,
    });
    updateHkTaskStatus(taskId, result === "pass" ? "inspected" : "queued");
    onClose({
      tone: "ok",
      msg:
        result === "pass"
          ? `Room ${task.roomId} passed inspection.`
          : `Room ${task.roomId} failed inspection — sent back to the queue.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">Inspect — Room {task.roomId}</h3>
          <button onClick={() => onClose()} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">Result</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setResult("pass")}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                result === "pass"
                  ? "border-success bg-success/10 text-success"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              Pass
            </button>
            <button
              onClick={() => setResult("fail")}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                result === "fail"
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              Fail
            </button>
          </div>

          <label className="block text-xs font-medium text-muted-foreground">Inspector *</label>
          <Select value={inspectorId} onValueChange={setInspectorId}>
            <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="Select inspector" />
            </SelectTrigger>
            <SelectContent>
              {hkUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="block text-xs font-medium text-muted-foreground">
            Defect notes {needsNotes ? "*" : "(optional)"}
          </label>
          <textarea
            value={defectNotes}
            onChange={(e) => setDefectNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            placeholder={needsNotes ? "Required — what needs correcting…" : "Optional notes…"}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => onClose()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Submit inspection
          </button>
        </div>
      </div>
    </div>
  );
}
