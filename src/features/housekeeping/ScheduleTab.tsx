import { useMemo } from "react";
import { useStore, getUserRoleNames } from "@/lib/pms-store";
import { TASK_TYPE_LABEL } from "./TaskQueue";

export default function ScheduleTab() {
  const tasks = useStore((s) => s.housekeepingTasks);
  const users = useStore((s) => s.users);

  const hkUsers = useMemo(() => users.filter((u) => getUserRoleNames(u.id).includes("Housekeeping")), [users]);

  const schedule = useMemo(() => {
    return hkUsers.map((u) => {
      const assigned = tasks.filter((t) => t.assignedTo === u.id);
      return {
        user: u,
        total: assigned.length,
        queued: assigned.filter((t) => t.status === "queued").length,
        pending: assigned.filter((t) => t.status === "pending").length,
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
                {s.user.fullName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <div className="font-semibold">{s.user.fullName}</div>
                <div className="text-xs text-muted-foreground">{s.total} tasks today</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[11px]">
              <div>
                <div className="text-lg font-bold text-muted-foreground">{s.queued}</div>
                <div className="text-muted-foreground">Queued</div>
              </div>
              <div>
                <div className="text-lg font-bold text-info">{s.pending}</div>
                <div className="text-muted-foreground">Pending</div>
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
        {schedule.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No housekeeping staff assigned to this property yet.
          </p>
        )}
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
