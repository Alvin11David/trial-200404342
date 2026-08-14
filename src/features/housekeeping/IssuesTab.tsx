import { useMemo } from "react";
import { Wrench, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, resolveMaintenance, type MaintSeverity } from "@/lib/pms-store";
import { TASK_TYPE_LABEL } from "./TaskQueue";

const SEV_META: Record<MaintSeverity, { bg: string; color: string; label: string }> = {
  low: { bg: "bg-info/10", color: "text-info", label: "Low" },
  medium: { bg: "bg-warning/10", color: "text-warning", label: "Medium" },
  high: { bg: "bg-destructive/10", color: "text-destructive", label: "High" },
  critical: { bg: "bg-destructive/20", color: "text-destructive font-bold", label: "Critical" },
};

export default function IssuesTab() {
  const requests = useStore((s) => s.maintenanceRequests);
  const tasks = useStore((s) => s.housekeepingTasks);
  const rooms = useStore((s) => s.rooms);
  const users = useStore((s) => s.users);

  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[u.id] = u.fullName;
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
