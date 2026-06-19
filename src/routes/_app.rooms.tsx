import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  Eye,
  Search,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, setRoomStatus, type RoomStatus } from "@/lib/pms-store";

export const Route = createFileRoute("/_app/rooms")({
  head: () => ({ meta: [{ title: "Room Status Board — Jambo ERP" }] }),
  component: RoomsBoard,
});

const STATUS_CONFIG: { id: RoomStatus; icon: React.ComponentType<{ className?: string }>; color: string; label: string }[] = [
  { id: "available", icon: CheckCircle2, color: "oklch(0.72 0.16 162)", label: "Available" },
  { id: "occupied", icon: BedDouble, color: "oklch(0.74 0.21 71)", label: "Occupied" },
  { id: "dirty", icon: Sparkles, color: "oklch(0.78 0.16 75)", label: "Dirty" },
  { id: "maintenance", icon: Wrench, color: "oklch(0.65 0.22 25)", label: "Maintenance" },
  { id: "blocked", icon: Ban, color: "oklch(0.6 0.04 280)", label: "Blocked" },
];

function RoomsBoard() {
  const rooms = useStore((s) => s.rooms);
  const reservations = useStore((s) => s.reservations);
  const roomTypes = useStore((s) => s.roomTypes);
  const [floor, setFloor] = useState<string>("All");
  const [type, setType] = useState<string>("All");
  const [floorOpen, setFloorOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<RoomStatus | null>(null);

  const roomTypeMap = useMemo(() => {
    const m: Record<string, string> = {};
    roomTypes.forEach((rt) => { m[rt.id] = rt.name; });
    return m;
  }, [roomTypes]);

  const guestMap = useMemo(() => {
    const m: Record<string, string> = {};
    reservations.filter((r) => r.status === "checked_in").forEach((r) => {
      if (r.roomId) m[r.roomId] = r.guestName;
    });
    return m;
  }, [reservations]);

  const filtered = useMemo(
    () =>
      rooms.filter((r) => {
        if (floor !== "All" && r.floor !== Number(floor)) return false;
        if (type !== "All" && roomTypeMap[r.typeId] !== type) return false;
        if (search && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [rooms, floor, type, roomTypeMap, search],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    STATUS_CONFIG.forEach((s) => { c[s.id] = 0; });
    filtered.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [filtered]);

  const onDrop = (status: RoomStatus) => {
    if (!dragId) return;
    setRoomStatus(dragId, status);
    setDragId(null);
    setHoverCol(null);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Room Status Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag rooms between columns to update their status.
          </p>
        </div>
      </div>

      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Filter</div>
        <div className="relative">
          <button
            onClick={() => setFloorOpen(!floorOpen)}
            className="flex items-center gap-1 rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            {floor === "All" ? "All floors" : `Floor ${floor}`}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {floorOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFloorOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
                {["All", 1, 2, 3, 4, 5].map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFloor(String(f)); setFloorOpen(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition hover:bg-muted",
                      floor === String(f) && "bg-primary/10 font-medium text-primary",
                    )}
                  >
                    {f === "All" ? "All floors" : `Floor ${f}`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setTypeOpen(!typeOpen)}
            className="flex items-center gap-1 rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            {type === "All" ? "All room types" : type}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {typeOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTypeOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
                {["All", "Standard", "Deluxe", "Suite"].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setType(t); setTypeOpen(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition hover:bg-muted",
                      type === t && "bg-primary/10 font-medium text-primary",
                    )}
                  >
                    {t === "All" ? "All room types" : t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="w-44 rounded-xl border border-border/70 bg-card/40 px-3 py-2 pl-9 text-sm outline-none transition focus:w-56 focus:border-primary/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {STATUS_CONFIG.map((col) => {
          const Icon = col.icon;
          const list = filtered.filter((r) => r.status === col.id);
          const active = hoverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setHoverCol(col.id);
              }}
              onDragLeave={() => setHoverCol((h) => (h === col.id ? null : h))}
              onDrop={() => onDrop(col.id)}
              className={cn(
                "glass flex h-full flex-col rounded-2xl p-4 transition-all",
                active && "ring-2 ring-offset-2 ring-offset-background",
              )}
              style={
                active ? { boxShadow: `0 0 0 2px ${col.color}, 0 0 40px ${col.color}` } : undefined
              }
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
                    <div className="font-display text-sm font-semibold">{col.label}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {counts[col.id] ?? 0} room{(counts[col.id] ?? 0) !== 1 && "s"}
                    </div>
                  </div>
                </div>
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
                  style={{ background: col.color, boxShadow: `0 0 8px ${col.color}` }}
                />
              </div>

              <div className="flex-1 space-y-2.5">
                {list.map((r) => {
                  const guest = guestMap[r.id];
                  const res = reservations.find((rv) => rv.roomId === r.id && rv.status === "checked_in");
                  return (
                    <RoomCard
                      key={r.id}
                      room={r}
                      roomType={roomTypeMap[r.typeId] ?? r.typeId}
                      guest={guest}
                      accent={col.color}
                      onDragStart={() => setDragId(r.id)}
                      folioId={res?.folioId}
                      reservationId={res?.id}
                    />
                  );
                })}
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
  room,
  roomType,
  guest,
  accent,
  onDragStart,
  folioId,
  reservationId,
}: {
  room: { id: string; floor: number; status: string; notes?: string | null };
  roomType: string;
  guest?: string;
  accent: string;
  onDragStart: () => void;
  folioId?: string;
  reservationId?: string;
}) {
  const navigate = useNavigate();
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
              {roomType}
            </span>
          </div>
          {guest ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground/85">
              <User className="h-3 w-3 text-muted-foreground" />
              {guest}
            </div>
          ) : room.notes ? (
            <div className="mt-1 text-xs italic text-muted-foreground">{room.notes}</div>
          ) : (
            <div className="mt-1 text-xs text-muted-foreground">Floor {room.floor}</div>
          )}
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {room.status === "available" && <TinyBtn icon={LogIn} label="Check in" tone="success" onClick={() => navigate({ to: "/check-in", search: { room: room.id } as never })} />}
        {room.status === "dirty" && <TinyBtn icon={Sparkles} label="Mark clean" tone="primary" onClick={() => { setRoomStatus(room.id, "available"); }} />}
        {room.status === "occupied" && reservationId && (
          <Link
            to="/reservations"
            search={{ q: reservationId } as never}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition",
              "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
            )}
          >
            <Eye className="h-3 w-3" />
            View reservation
          </Link>
        )}
        {folioId && (
          <Link
            to="/billing"
            search={{ folio: folioId, invoice: undefined }}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition",
              "border-success/40 bg-success/10 text-success hover:bg-success/20",
            )}
          >
            <Eye className="h-3 w-3" />
            View folio
          </Link>
        )}
      </div>
    </div>
  );
}

function TinyBtn({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "primary" | "success";
  onClick?: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
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
