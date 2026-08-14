import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, ClipboardCheck } from "lucide-react";
import { useStore, type Room } from "@/lib/pms-store";
import { TASK_TYPE_LABEL } from "./TaskQueue";
import { InspectionResultDialog } from "./housekeeping-dialogs";

export default function InspectionsTab() {
  const tasks = useStore((s) => s.housekeepingTasks);
  const rooms = useStore((s) => s.rooms);
  const users = useStore((s) => s.users);
  const inspections = useStore((s) => s.roomInspections);
  const [inspecting, setInspecting] = useState<string | null>(null);

  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[u.id] = u.fullName;
    return m;
  }, [users]);
  const roomMap = useMemo(() => {
    const m: Record<string, Room> = {};
    for (const r of rooms) m[r.id] = r;
    return m;
  }, [rooms]);

  const pending = useMemo(() => tasks.filter((t) => t.status === "clean"), [tasks]);
  const recent = useMemo(
    () => [...inspections].sort((a, b) => b.inspectedAt.localeCompare(a.inspectedAt)).slice(0, 10),
    [inspections],
  );

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
                    <button
                      onClick={() => setInspecting(t.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" /> Inspect
                    </button>
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

      {recent.length > 0 && (
        <details className="rounded-xl border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground">
            Recent inspections ({recent.length})
          </summary>
          <div className="divide-y divide-border border-t border-border">
            {recent.map((i) => (
              <div key={i.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <div>
                  <span className="font-medium">Room {i.roomId}</span>
                  <span className="ml-2 text-muted-foreground">
                    by {userMap[i.inspectorId] ?? i.inspectorId} ·{" "}
                    {new Date(i.inspectedAt).toLocaleString()}
                  </span>
                  {i.defectNotes && (
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{i.defectNotes}</div>
                  )}
                </div>
                <span className={i.result === "pass" ? "text-success" : "text-destructive"}>
                  {i.result === "pass" ? "Passed" : "Failed"}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {inspecting && (
        <InspectionResultDialog
          taskId={inspecting}
          onClose={(t) => {
            setInspecting(null);
            if (t) (t.tone === "ok" ? toast.success : toast.error)(t.msg);
          }}
        />
      )}
    </div>
  );
}
