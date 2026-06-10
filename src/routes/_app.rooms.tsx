import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BedDouble,
  CheckCircle2,
  Filter,
  LogIn,
  Sparkles,
  Wrench,
  Ban,
  GripVertical,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/rooms")({
  head: () => ({ meta: [{ title: "Room Status Board — Jambo ERP" }] }),
  component: RoomsBoard,
});

type Status = "Available" | "Occupied" | "Dirty" | "Maintenance" | "Blocked";
type Room = {
  id: string;
  floor: number;
  type: "Standard" | "Deluxe" | "Suite";
  status: Status;
  guest?: string;
  note?: string;
};

const initial: Room[] = (() => {
  const types: Room["type"][] = ["Standard", "Deluxe", "Suite", "Standard", "Deluxe"];
  const statuses: Status[] = ["Available", "Occupied", "Occupied", "Dirty", "Available", "Maintenance", "Occupied", "Blocked"];
  const guests = ["S. Nakato", "J. Okello", "P. Sharma", "D. Mensah", "A. Wanjiku", "M. Lopez", "K. Boateng", "L. Asiimwe"];
  const notes: Partial<Record<Status, string>> = {
    Maintenance: "AC repair",
    Blocked: "Owner stay",
    Dirty: "Awaiting turnover",
  };
  const list: Room[] = [];
  for (let f = 1; f <= 5; f++) {
    for (let i = 1; i <= 8; i++) {
      const id = `${f}${String(i).padStart(2, "0")}`;
      const status = statuses[(f * 3 + i) % statuses.length];
      list.push({
        id,
        floor: f,
        type: types[i % types.length],
        status,
        guest: status === "Occupied" ? guests[(f + i) % guests.length] : undefined,
        note: notes[status],
      });
    }
  }
  return list;
})();

const columns: { id: Status; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: "Available",   icon: CheckCircle2, color: "oklch(0.72 0.16 162)" },
  { id: "Occupied",    icon: BedDouble,    color: "oklch(0.68 0.18 258)" },
  { id: "Dirty",       icon: Sparkles,     color: "oklch(0.78 0.16 75)"  },
  { id: "Maintenance", icon: Wrench,       color: "oklch(0.65 0.22 25)"  },
  { id: "Blocked",     icon: Ban,          color: "oklch(0.6 0.04 280)"  },
];

function RoomsBoard() {
  const [rooms, setRooms] = useState<Room[]>(initial);
  const [floor, setFloor] = useState<string>("All");
  const [type, setType] = useState<string>("All");
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<Status | null>(null);

  const filtered = useMemo(
    () => rooms.filter((r) =>
      (floor === "All" || r.floor === Number(floor)) &&
      (type === "All" || r.type === type)
    ),
    [rooms, floor, type],
  );

  const counts = useMemo(() => {
    const c: Record<Status, number> = { Available: 0, Occupied: 0, Dirty: 0, Maintenance: 0, Blocked: 0 };
    filtered.forEach((r) => c[r.status]++);
    return c;
  }, [filtered]);

  const onDrop = (status: Status) => {
    if (!dragId) return;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === dragId ? { ...r, status, guest: status === "Occupied" ? r.guest : undefined } : r,
      ),
    );
    setDragId(null);
    setHoverCol(null);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Room Status Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">Drag rooms between columns to update their status.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Filter</div>
        <select
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
        >
          {["All", 1, 2, 3, 4, 5].map((f) => (
            <option key={f} value={f} className="bg-card">
              {f === "All" ? "All floors" : `Floor ${f}`}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
        >
          {["All", "Standard", "Deluxe", "Suite"].map((t) => (
            <option key={t} value={t} className="bg-card">
              {t === "All" ? "All room types" : t}
            </option>
          ))}
        </select>
        <button className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          <Filter className="h-3.5 w-3.5" /> More
        </button>
      </div>

      {/* Board */}
      <div className="grid gap-4 xl:grid-cols-5">
        {columns.map((col) => {
          const Icon = col.icon;
          const list = filtered.filter((r) => r.status === col.id);
          const active = hoverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setHoverCol(col.id); }}
              onDragLeave={() => setHoverCol((h) => (h === col.id ? null : h))}
              onDrop={() => onDrop(col.id)}
              className={cn(
                "glass flex h-full flex-col rounded-2xl p-4 transition-all",
                active && "ring-2 ring-offset-2 ring-offset-background",
              )}
              style={active ? { boxShadow: `0 0 0 2px ${col.color}, 0 0 40px ${col.color}` } : undefined}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${col.color}, color-mix(in oklab, ${col.color} 55%, black))`,
                      boxShadow: `0 4px 14px -4px ${col.color}`,
                    }}
                  >
                    <Icon className="h-4 w-4 text-white/95" />
                  </span>
                  <div>
                    <div className="font-display text-sm font-semibold">{col.id}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {counts[col.id]} room{counts[col.id] !== 1 && "s"}
                    </div>
                  </div>
                </div>
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
                  style={{ background: col.color, boxShadow: `0 0 8px ${col.color}` }}
                />
              </div>

              <div className="flex-1 space-y-2.5">
                {list.map((r) => (
                  <RoomCard key={r.id} room={r} accent={col.color} onDragStart={() => setDragId(r.id)} />
                ))}
                {list.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoomCard({
  room, accent, onDragStart,
}: {
  room: Room;
  accent: string;
  onDragStart: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group relative cursor-grab overflow-hidden rounded-xl border border-border/60 bg-card/50 p-3 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg active:cursor-grabbing"
    >
      <div
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
      />
      <div className="flex items-start justify-between pl-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-tight">{room.id}</span>
            <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {room.type}
            </span>
          </div>
          {room.guest ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground/85">
              <User className="h-3 w-3 text-muted-foreground" />
              {room.guest}
            </div>
          ) : room.note ? (
            <div className="mt-1 text-xs italic text-muted-foreground">{room.note}</div>
          ) : (
            <div className="mt-1 text-xs text-muted-foreground">Floor {room.floor}</div>
          )}
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {room.status === "Available" && <TinyBtn icon={LogIn} label="Check in" tone="success" />}
        {room.status === "Dirty" && <TinyBtn icon={Sparkles} label="Mark clean" tone="primary" />}
        {room.status === "Occupied" && <TinyBtn icon={LogIn} label="View folio" tone="primary" />}
      </div>
    </div>
  );
}

function TinyBtn({
  icon: Icon, label, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "primary" | "success";
}) {
  return (
    <button
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition",
        tone === "primary" && "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
        tone === "success" && "border-success/40 bg-success/10 text-success hover:bg-success/20",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
