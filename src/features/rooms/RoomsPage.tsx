import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  BedDouble,
  CheckCircle2,
  CalendarDays,
  LogIn,
  Sparkles,
  Wrench,
  GripVertical,
  User,
  Eye,
  Search,
  ChevronDown,
  X,
  ClipboardCheck,
  MoreVertical,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, setRoomStatus, todayISO, type RoomStatus, type Room, createRoom, currentProperty } from "@/lib/pms-store";
import RoomDialog from "./RoomDialog";
import { toast } from "sonner";

type ColumnId = "vacant_clean" | "vacant_dirty" | "in_progress" | "occupied" | "out_of_order" | "reserved";

const COLUMNS: {
  id: ColumnId;
  label: string;
  statuses: RoomStatus[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  dropTarget: RoomStatus | null;
}[] = [
  { id: "vacant_clean", label: "Vacant Clean", statuses: ["available", "clean", "inspected"], icon: CheckCircle2, color: "oklch(0.72 0.16 162)", dropTarget: "available" },
  { id: "vacant_dirty", label: "Vacant Dirty", statuses: ["dirty"], icon: Sparkles, color: "oklch(0.78 0.16 75)", dropTarget: "dirty" },
  { id: "in_progress", label: "In Progress", statuses: ["in_progress"], icon: Sparkles, color: "oklch(0.7 0.14 220)", dropTarget: "in_progress" },
  { id: "occupied", label: "Occupied", statuses: ["occupied"], icon: BedDouble, color: "oklch(0.74 0.21 71)", dropTarget: null },
  { id: "out_of_order", label: "Out of Order", statuses: ["maintenance", "blocked"], icon: Wrench, color: "oklch(0.65 0.22 25)", dropTarget: "maintenance" },
  { id: "reserved", label: "Reserved", statuses: [], icon: CalendarDays, color: "oklch(0.7 0.18 270)", dropTarget: null },
];

export default function RoomsPage() {
  const rooms = useStore((s) => s.rooms);
  const reservations = useStore((s) => s.reservations);
  const roomTypes = useStore((s) => s.roomTypes);
  const currentProp = currentProperty();
  const roomTypeFilters = useStore((s) => s.roomTypeFilterConfig.types);
  const [floor, setFloor] = useState<string>("All");
  const [type, setType] = useState<string>("All");
  const [floorOpen, setFloorOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<ColumnId | null>(null);
  const [showRoomDialog, setShowRoomDialog] = useState(false);

  const today = todayISO();

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

  const reservedRoomIds = useMemo(() => {
    return new Set(
      reservations
        .filter((r) => (r.status === "confirmed" || r.status === "open") && r.checkIn > today)
        .map((r) => r.roomId)
        .filter((id): id is string => id !== null),
    );
  }, [reservations, today]);

  const propertyRooms = useMemo(
    () => rooms.filter((r) => r.propertyId === currentProp.id),
    [rooms, currentProp.id],
  );

  const filtered = useMemo(
    () =>
      propertyRooms.filter((r) => {
        if (floor !== "All" && r.floor !== Number(floor)) return false;
        if (type !== "All" && roomTypeMap[r.roomTypeId] !== type) return false;
        if (search && !r.roomNumber.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [propertyRooms, floor, type, roomTypeMap, search],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    COLUMNS.forEach((col) => { c[col.id] = 0; });
    filtered.forEach((r) => {
      if (reservedRoomIds.has(r.id)) {
        c.reserved = (c.reserved ?? 0) + 1;
      }
      for (const col of COLUMNS) {
        if (col.statuses.includes(r.status)) {
          c[col.id] = (c[col.id] ?? 0) + 1;
          break;
        }
      }
    });
    return c;
  }, [filtered, reservedRoomIds]);

  const reservedCount = useMemo(
    () => propertyRooms.filter((r) => reservedRoomIds.has(r.id)).length,
    [propertyRooms, reservedRoomIds],
  );

  const onDrop = (columnId: ColumnId) => {
    if (!dragId) return;
    const col = COLUMNS.find((c) => c.id === columnId);
    if (!col?.dropTarget) return;
    setRoomStatus(dragId, col.dropTarget);
    setDragId(null);
    setHoverCol(null);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Room Status Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentProp.name} — Drag rooms between columns to update their status.
          </p>
        </div>
        <button
          onClick={() => setShowRoomDialog(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Create Room
        </button>
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
                {roomTypeFilters.map((t) => (
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

      <div className="overflow-x-auto pb-2 max-w-full">
        <div className="flex gap-4">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const list = col.id === "reserved"
            ? filtered.filter((r) => reservedRoomIds.has(r.id))
            : filtered.filter((r) => col.statuses.includes(r.status));
          const active = hoverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                if (!col.dropTarget) return;
                e.preventDefault();
                setHoverCol(col.id);
              }}
              onDragLeave={() => setHoverCol((h) => (h === col.id ? null : h))}
              onDrop={() => onDrop(col.id)}
              className={cn(
                "w-[280px] shrink-0 glass flex h-full flex-col rounded-2xl p-4 transition-all",
                col.dropTarget && active && "ring-2 ring-offset-2 ring-offset-background",
                !col.dropTarget && "opacity-90",
              )}
              style={col.dropTarget && active ? { boxShadow: `0 0 0 2px ${col.color}, 0 0 40px ${col.color}` } : undefined}
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
                      {col.id === "reserved" ? reservedCount : (counts[col.id] ?? 0)} room{((col.id === "reserved" ? reservedCount : counts[col.id] ?? 0) !== 1) && "s"}
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
                  const res = reservations.find(
                    (rv) => rv.roomId === r.id && (rv.status === "checked_in" || rv.status === "confirmed" || rv.status === "open"),
                  );
                  return (
                    <RoomCard
                      key={r.id}
                      room={r}
                      roomType={roomTypeMap[r.roomTypeId] ?? r.roomTypeId}
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
                    {col.dropTarget ? "Drop here" : "\u2014"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {showRoomDialog && (
        <RoomDialog
          onSave={(data) => {
            createRoom(data);
            toast.success(`Created room ${data.roomNumber}`);
            setShowRoomDialog(false);
          }}
          onClose={() => setShowRoomDialog(false)}
        />
      )}
    </div>
  );
}

const STATUS_OPTIONS: { label: string; value: RoomStatus; color: string }[] = [
  { label: "Available", value: "available", color: "oklch(0.72 0.16 162)" },
  { label: "Clean", value: "clean", color: "oklch(0.72 0.16 162)" },
  { label: "Inspected", value: "inspected", color: "oklch(0.72 0.16 162)" },
  { label: "Dirty", value: "dirty", color: "oklch(0.78 0.16 75)" },
  { label: "In Progress", value: "in_progress", color: "oklch(0.7 0.14 220)" },
  { label: "Occupied", value: "occupied", color: "oklch(0.74 0.21 71)" },
  { label: "Maintenance", value: "maintenance", color: "oklch(0.65 0.22 25)" },
];

function StatusMenu({ room }: { room: Room; accent: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, left: Math.min(r.right - 140, window.innerWidth - 150) });
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="grid h-6 w-6 place-items-center rounded-md border border-border/50 bg-card/60 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="min-w-[140px] rounded-xl border border-border bg-card py-1 shadow-xl"
        >
          {STATUS_OPTIONS.map((opt) => {
            const isCurrent = opt.value === room.status;
            return (
              <button
                key={opt.value}
                disabled={isCurrent}
                onClick={() => {
                  setRoomStatus(room.id, opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1 text-left text-xs transition",
                  isCurrent ? "cursor-default opacity-40" : "hover:bg-muted",
                )}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: opt.color }} />
                {opt.label}
              </button>
            );
          })}
          <div className="mx-2 my-0.5 border-t border-border/40" />
          {room.status === "dirty" && (
            <button
              onClick={() => { setRoomStatus(room.id, "clean"); setOpen(false); }}
              className="flex w-full items-center gap-2 px-2.5 py-1 text-left text-xs transition hover:bg-muted"
            >
              <Sparkles className="h-3 w-3" />
              Mark clean
            </button>
          )}
          {room.status === "available" && (
            <button
              onClick={() => { navigate(`/check-in?room=${room.id}`); setOpen(false); }}
              className="flex w-full items-center gap-2 px-2.5 py-1 text-left text-xs transition hover:bg-muted"
            >
              <LogIn className="h-3 w-3" />
              Check in
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
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
  room: Room;
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
      draggable={room.status !== "occupied"}
      onDragStart={onDragStart}
      className={cn(
        "group relative rounded-xl border border-border/60 bg-card/50 p-3 backdrop-blur transition-all",
        room.status !== "occupied" && "cursor-grab hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg active:cursor-grabbing",
      )}
    >
      <div
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
      />
      <div className="flex items-start justify-between pl-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-tight">{room.roomNumber}</span>
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
        <div className="flex items-center gap-1">
          {room.status !== "occupied" && <StatusMenu room={room} accent={accent} />}
          {room.status !== "occupied" && (
            <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {room.status === "available" && (
          <TinyBtn
            icon={LogIn}
            label="Check in"
            tone="success"
            onClick={() => navigate(`/check-in?room=${room.id}`)}
          />
        )}
        {room.status === "dirty" && (
          <TinyBtn
            icon={Sparkles}
            label="Mark clean"
            tone="primary"
            onClick={() => setRoomStatus(room.id, "clean")}
          />
        )}
        {room.status === "clean" && (
          <TinyBtn
            icon={ClipboardCheck}
            label="Mark inspected"
            tone="primary"
            onClick={() => setRoomStatus(room.id, "inspected")}
          />
        )}
        {room.status === "occupied" && reservationId && (
          <Link
            to={`/reservations/${reservationId}`}
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
            to={`/billing?folio=${folioId}`}
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
