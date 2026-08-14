// Room status (RoomStatus, on the Room record in pms-store) can currently be written
// from three places with no shared transition rules between them: this board (via the
// housekeeping task lifecycle), Front Desk's room grid (src/features/rooms/RoomsPage.tsx,
// direct drag-drop writes), and Settings' room editor (direct status field on room
// master-data edit). All three read/write the same setRoomStatus()/s.rooms source of
// truth, so there's no data-duplication risk, but there's also nothing stopping one
// domain from writing a status the others don't expect. Needs a cross-domain decision
// on which writes are allowed from where before production — not resolved here.

import { useMemo, useState } from "react";
import { ChevronDown, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, getActiveDND, type RoomStatus } from "@/lib/pms-store";

const STATUS_META: Record<RoomStatus, { badge: string; card: string; label: string }> = {
  available: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    card: "border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/15",
    label: "Available",
  },
  occupied: {
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
    card: "border-blue-200/60 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/15",
    label: "Occupied",
  },
  dirty: {
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    card: "border-red-200/60 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/15",
    label: "Dirty",
  },
  in_progress: {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    card: "border-amber-200/60 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/15",
    label: "In Progress",
  },
  clean: {
    badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800",
    card: "border-sky-200/60 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/15",
    label: "Clean",
  },
  inspected: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700",
    card: "border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/15",
    label: "Inspected",
  },
  maintenance: {
    badge: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
    card: "border-slate-200/60 bg-slate-100/60 dark:border-slate-800/60 dark:bg-slate-900/30",
    label: "Maintenance",
  },
  blocked: {
    badge: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
    card: "border-slate-200/60 bg-slate-100/60 dark:border-slate-800/60 dark:bg-slate-900/30",
    label: "Blocked",
  },
};

const DOT_COLOR: Record<RoomStatus, string> = {
  available: "bg-emerald-500",
  occupied: "bg-blue-500",
  dirty: "bg-red-500",
  in_progress: "bg-amber-500",
  clean: "bg-sky-500",
  inspected: "bg-emerald-500",
  maintenance: "bg-slate-500",
  blocked: "bg-slate-500",
};

const COLUMNS: { key: string; label: string; statuses: RoomStatus[]; color: string }[] = [
  { key: "vacant_clean", label: "Vacant Clean", statuses: ["available", "clean", "inspected"], color: "bg-emerald-500" },
  { key: "vacant_dirty", label: "Vacant Dirty", statuses: ["dirty"], color: "bg-red-500" },
  { key: "in_progress", label: "In Progress", statuses: ["in_progress"], color: "bg-amber-500" },
  { key: "occupied", label: "Occupied", statuses: ["occupied"], color: "bg-blue-500" },
  { key: "out_of_order", label: "Out of Order", statuses: ["maintenance", "blocked"], color: "bg-slate-500" },
  { key: "reserved", label: "Reserved", statuses: [] as RoomStatus[], color: "bg-purple-500" },
];

export default function RoomStatusBoard() {
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const activeDnd = useStore(() => getActiveDND());
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [floorOpen, setFloorOpen] = useState(false);

  const floors = useMemo(() => [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b), [rooms]);
  const filtered =
    floorFilter === "all" ? rooms : rooms.filter((r) => r.floor === Number(floorFilter));

  const roomTypeMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const rt of roomTypes) m[rt.id] = rt.name;
    return m;
  }, [roomTypes]);

  const dndRooms = useMemo(() => new Set(activeDnd.map((d) => d.roomId)), [activeDnd]);

  const grouped = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      rooms: filtered.filter((r) => col.statuses.includes(r.status)),
    }));
  }, [filtered]);

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
              <span className={cn("h-2 w-2 rounded-full", DOT_COLOR[k as RoomStatus])} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-2 max-w-full">
        <div className="flex gap-3">
          {grouped.map((col) => (
            <div key={col.key} className="w-[280px] shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", col.color)} />
                <span className="text-xs font-semibold uppercase tracking-wider">{col.label}</span>
                <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {col.rooms.length}
                </span>
              </div>
              <div className="space-y-2">
                {col.rooms.map((room) => {
                  const meta = STATUS_META[room.status];
                  const isDnd = dndRooms.has(room.id);
                  return (
                    <div
                      key={room.id}
                      className={cn(
                        "rounded-xl border bg-card p-3 transition hover:shadow-md",
                        meta.card,
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-display text-lg font-bold">{room.roomNumber}</span>
                          <span className="ml-2 text-[10px] text-muted-foreground">
                            {roomTypeMap[room.roomTypeId] ?? room.roomTypeId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isDnd && <DoorOpen className="h-3.5 w-3.5 text-warning" aria-label="Do Not Disturb" />}
                        </div>
                      </div>
                      <div className="mt-1.5 text-[10px] text-muted-foreground">Floor {room.floor}</div>
                      <div className="mt-2">
                        <span
                          className={cn(
                            "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                            meta.badge,
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {col.rooms.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-[11px] text-muted-foreground">
                    No rooms
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
