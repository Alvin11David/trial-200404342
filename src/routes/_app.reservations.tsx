import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Filter, LogIn, LogOut, Plus, Search, X, Pencil, CalendarDays, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  cancelReservation,
  checkIn,
  checkOut,
  findAvailableRooms,
  fmtUGX,
  reservationById,
  roomById,
  roomTypeById,
  updateReservation,
  useStore,
  type ReservationStatus,
  type Reservation,
  findGuests,
} from "@/lib/pms-store";

export const Route = createFileRoute("/_app/reservations")({
  head: () => ({ meta: [{ title: "Reservations — Jambo PMS" }] }),
  component: ReservationsLayout,
});

function ReservationsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/reservations") return <Outlet />;
  return <ReservationsPage />;
}

const tabs: Array<{ key: "all" | ReservationStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Open" },
  { key: "checked_in", label: "Checked In" },
  { key: "checked_out", label: "Checked Out" },
  { key: "cancelled", label: "Cancelled" },
];

const statusStyles: Record<ReservationStatus, string> = {
  open: "bg-info/15 text-info border-info/30",
  confirmed: "bg-info/15 text-info border-info/30",
  checked_in: "bg-success/15 text-success border-success/30",
  checked_out: "bg-muted/40 text-muted-foreground border-border/40",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-success/20 text-success border-success/30",
  reserved: "bg-info/15 text-info border-info/30",
  checked_in: "bg-success/15 text-success border-success/30",
  checked_out: "bg-muted/40 text-muted-foreground border-border/40",
  blocked: "bg-destructive/15 text-destructive border-destructive/30",
};

const roomTypeOrder = ["std", "dlx", "ste"];

function ReservationsPage() {
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const guests = useStore((s) => s.guests);

  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const [roomType, setRoomType] = useState<string>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openCheckIn, setOpenCheckIn] = useState<string | null>(null);
  const [openEdit, setOpenEdit] = useState<string | null>(null);
  const [openCancel, setOpenCancel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 7);
  });
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const showToast = (t: { tone: "ok" | "err"; msg: string } | null) => {
    setToast(t);
    if (t) setTimeout(() => setToast(null), 3500);
  };

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (roomType !== "All" && r.roomTypeId !== roomType) return false;
      if (from && r.checkOut < from) return false;
      if (to && r.checkIn > to) return false;
      if (query) {
        const q = query.toLowerCase();
        const matchGuest = guests.some(
          (g) =>
            (g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.phone.includes(q)) &&
            g.email === r.guestEmail,
        );
        if (
          !matchGuest &&
          !`${r.guestName} ${r.id} ${r.guestEmail} ${r.roomId ?? ""} ${r.guestPhone}`
            .toLowerCase()
            .includes(q)
        )
          return false;
      }
      return true;
    });
  }, [reservations, tab, roomType, from, to, query, guests]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length };
    tabs.forEach((t) => {
      if (t.key !== "all") c[t.key] = reservations.filter((r) => r.status === t.key).length;
    });
    return c;
  }, [reservations]);

  // Calendar view data: days in month × rooms grid
  const calendarCells = useMemo(() => {
    const [yr, mo] = calendarDate.split("-").map(Number);
    const daysInMonth = new Date(yr, mo, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = `${calendarDate}-${String(i + 1).padStart(2, "0")}`;
      return d;
    });
    const sortedRooms = [...rooms].sort((a, b) => {
      const ta = roomTypeOrder.indexOf(a.typeId);
      const tb = roomTypeOrder.indexOf(b.typeId);
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
    const rows = sortedRooms.map((room) => {
      const cells = days.map((day) => {
        const resOnDay = reservations.find(
          (r) =>
            r.roomId === room.id &&
            (r.status === "confirmed" || r.status === "checked_in") &&
            r.checkIn <= day &&
            r.checkOut > day,
        );
        const status =
          room.status === "maintenance" || room.status === "blocked"
            ? "blocked"
            : resOnDay
              ? resOnDay.status === "checked_in"
                ? "checked_in"
                : "reserved"
              : "available";
        return { day, status, reservation: resOnDay ?? null };
      });
      return { room, cells };
    });
    return { days, rows };
  }, [calendarDate, rooms, reservations]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Reservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage bookings, check-ins and check-outs.</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Open", value: counts.confirmed ?? 0 },
          { label: "In-house", value: counts.checked_in ?? 0 },
          { label: "Checked Out", value: counts.checked_out ?? 0 },
          { label: "Cancelled", value: counts.cancelled ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs + View toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span className="ml-2 text-[10px] opacity-80">{counts[t.key] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "rounded-md p-1.5 text-xs transition",
              viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            title="Table view"
          >
            <Table2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "rounded-md p-1.5 text-xs transition",
              viewMode === "calendar" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            title="Calendar view"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by guest, reservation ID, room, email…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            <option value="All">All room types</option>
            {roomTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/40">
            <Filter className="h-3.5 w-3.5" /> More filters
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">
              <input
                type="month"
                value={calendarDate}
                onChange={(e) => setCalendarDate(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none"
              />
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success/30" /> Available</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-info/30" /> Reserved</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success/40" /> Checked in</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-destructive/20" /> Blocked</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid" style={{ gridTemplateColumns: `120px repeat(${calendarCells.days.length}, minmax(32px,1fr))` }}>
              {/* Header row */}
              <div className="sticky left-0 z-10 border-r border-border bg-card px-3 py-2 text-[10px] font-semibold uppercase text-muted-foreground">Room</div>
              {calendarCells.days.map((day) => {
                const dt = new Date(day + "T00:00:00");
                return (
                  <div
                    key={day}
                    className={cn(
                      "border-r border-border px-1 py-2 text-center text-[10px] font-medium",
                      dt.getDay() === 0 || dt.getDay() === 6 ? "text-destructive/60" : "text-muted-foreground",
                    )}
                  >
                    <div>{dt.getDate()}</div>
                    <div className="text-[8px] uppercase">{dt.toLocaleDateString("en", { weekday: "short" })}</div>
                  </div>
                );
              })}
              {/* Room rows */}
              {calendarCells.rows.map(({ room, cells }) => {
                const rt = roomTypeById(room.typeId);
                return (
                  <>
                    <div
                      key={room.id}
                      className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-border bg-card px-3 py-2"
                    >
                      <span className="text-xs font-medium">{room.id}</span>
                      <span className="text-[9px] text-muted-foreground">{rt?.name}</span>
                    </div>
                    {cells.map((cell) => (
                      <div
                        key={cell.day}
                        className={cn(
                          "border-b border-r border-border px-1 py-2 text-center text-[9px] transition",
                          cell.status === "available" && "bg-success/5",
                          cell.status === "reserved" && "bg-info/10",
                          cell.status === "checked_in" && "bg-success/15",
                          cell.status === "blocked" && "bg-destructive/8",
                        )}
                        title={
                          cell.reservation
                            ? `${cell.reservation.guestName} (${cell.reservation.id})`
                            : room.status === "maintenance" || room.status === "blocked"
                              ? "Out of order"
                              : "Available"
                        }
                      >
                        {cell.reservation && (
                          <span className="inline-block h-1.5 w-full max-w-[12px] rounded-full bg-primary/40" />
                        )}
                      </div>
                    ))}
                  </>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">ID</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Guest</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Room</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Dates</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Source</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => {
                  const rt = roomTypeById(r.roomTypeId);
                  const nights = Math.max(
                    1,
                    Math.round(
                      (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86_400_000,
                    ),
                  );
                  const total = nights * r.ratePerNight;
                  return (
                    <tr key={r.id} className="group hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            to="/guests"
                            className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary hover:bg-primary/20"
                            title="View guest profile"
                          >
                            {r.guestName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                          </Link>
                          <div>
                            <div className="font-medium">{r.guestName}</div>
                            <div className="text-[11px] text-muted-foreground">{r.guestEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.roomId ? `Room ${r.roomId}` : "—"}</div>
                        <div className="text-[11px] text-muted-foreground">{rt?.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.checkIn} → {r.checkOut}</div>
                        <div className="text-[11px] text-muted-foreground">{nights} night{nights !== 1 && "s"}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.source}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium", statusStyles[r.status])}>
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{fmtUGX(total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                          {r.folioId && (
                            <Link
                              to="/billing"
                              search={{ folio: r.folioId } as never}
                              title="View folio"
                              className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          )}
                          {(r.status === "confirmed" || r.status === "open") && (
                            <>
                              <button
                                onClick={() => setOpenEdit(r.id)}
                                title="Edit"
                                className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setOpenCheckIn(r.id)}
                                title="Check in"
                                className="rounded-md border border-border bg-card p-1.5 text-success hover:bg-success/10"
                              >
                                <LogIn className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setOpenCancel(r.id)}
                                title="Cancel"
                                className="rounded-md border border-border bg-card p-1.5 text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {r.status === "checked_in" && (
                            <button
                              onClick={() => {
                                const res = checkOut(r.id);
                                showToast(res.ok ? { tone: "ok", msg: "Guest checked out. Room sent to housekeeping." } : { tone: "err", msg: res.error });
                              }}
                              title="Check out"
                              className="rounded-md border border-border bg-card p-1.5 text-warning hover:bg-warning/10"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">
                      No reservations match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Link
        to="/reservations/new"
        className="fixed bottom-8 right-8 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50"
      >
        <Plus className="h-5 w-5" />
        New Reservation
      </Link>

      {openCheckIn && (
        <CheckInDialog
          reservationId={openCheckIn}
          onClose={(msg) => {
            setOpenCheckIn(null);
            if (msg) showToast(msg);
          }}
        />
      )}

      {openEdit && (
        <EditDialog
          reservationId={openEdit}
          onClose={(msg) => {
            setOpenEdit(null);
            if (msg) showToast(msg);
          }}
        />
      )}

      {openCancel && (
        <CancelDialog
          reservationId={openCancel}
          onClose={(msg) => {
            setOpenCancel(null);
            if (msg) showToast(msg);
          }}
        />
      )}

      {toast && (
        <div
          className={cn(
            "fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-2.5 text-sm shadow-lg",
            toast.tone === "ok"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ==================== Dialogs ==================== */

function CheckInDialog({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: (toast?: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const res = reservationById(reservationId);
  if (!res) return null;
  const available = findAvailableRooms(res.roomTypeId, res.checkIn, res.checkOut);
  const candidates = res.roomId
    ? [res.roomId, ...available.filter((a) => a.id !== res.roomId).map((a) => a.id)]
    : available.map((a) => a.id);
  const [room, setRoom] = useState<string>(candidates[0] ?? "");

  const submit = () => {
    const r = checkIn(reservationId, { roomId: room });
    onClose(r.ok ? { tone: "ok", msg: "Guest checked in. Folio opened." } : { tone: "err", msg: r.error });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Check in {res.guestName}</h3>
            <p className="text-xs text-muted-foreground">{res.id} · {res.checkIn} → {res.checkOut}</p>
          </div>
          <button onClick={() => onClose()} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-medium text-muted-foreground">Assign room</label>
          {candidates.length === 0 ? (
            <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              No rooms of this type are available for the selected dates.
            </p>
          ) : (
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            >
              {candidates.map((id) => {
                const r = roomById(id);
                return (
                  <option key={id} value={id}>
                    Room {id} · Floor {r?.floor}
                  </option>
                );
              })}
            </select>
          )}
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={() => onClose()} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted">Cancel</button>
          <button onClick={submit} disabled={!room} className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            Confirm check-in
          </button>
        </div>
      </div>
    </div>
  );
}

function EditDialog({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: (toast?: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const res = reservationById(reservationId);
  const roomTypes = useStore((s) => s.roomTypes);
  if (!res) return null;

  const [guestName, setGuestName] = useState(res.guestName);
  const [guestEmail, setGuestEmail] = useState(res.guestEmail);
  const [guestPhone, setGuestPhone] = useState(res.guestPhone);
  const [roomTypeId, setRoomTypeId] = useState(res.roomTypeId);
  const [checkIn, setCheckIn] = useState(res.checkIn);
  const [checkOut, setCheckOut] = useState(res.checkOut);
  const [adults, setAdults] = useState(res.adults);
  const [children, setChildren] = useState(res.children);
  const [ratePerNight, setRatePerNight] = useState(res.ratePerNight);
  const [mealPlan, setMealPlan] = useState(res.mealPlan);
  const [notes, setNotes] = useState(res.notes ?? "");

  const submit = () => {
    const patch = {
      guestName,
      guestEmail,
      guestPhone,
      roomTypeId,
      checkIn,
      checkOut,
      adults,
      children,
      ratePerNight,
      mealPlan,
      notes: notes || undefined,
    };
    const r = updateReservation(reservationId, patch);
    onClose(r.ok ? { tone: "ok", msg: "Reservation updated successfully." } : { tone: "err", msg: r.error });
  };

  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000));
  const total = nights * ratePerNight;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Edit Reservation</h3>
            <p className="text-xs text-muted-foreground">{res.id}</p>
          </div>
          <button onClick={() => onClose()} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Guest name</label>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Email</label>
            <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Phone</label>
            <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Room type</label>
            <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60">
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Meal plan</label>
            <select value={mealPlan} onChange={(e) => setMealPlan(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60">
              {["RO", "BB", "HB", "FB"].map((mp) => (
                <option key={mp} value={mp}>{mp}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Check-in</label>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Check-out</label>
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Adults</label>
            <input type="number" min={1} max={10} value={adults} onChange={(e) => setAdults(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Children</label>
            <input type="number" min={0} max={10} value={children} onChange={(e) => setChildren(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Rate per night (UGX)</label>
            <input type="number" min={0} step={1000} value={ratePerNight} onChange={(e) => setRatePerNight(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div className="col-span-2 rounded-lg bg-muted/30 p-3 text-center text-sm">
            <span className="text-muted-foreground">{nights} night{nights !== 1 && "s"} × {fmtUGX(ratePerNight)} = </span>
            <span className="font-bold text-foreground">{fmtUGX(total)}</span>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={() => onClose()} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted">Cancel</button>
          <button onClick={submit} className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelDialog({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: (toast?: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const res = reservationById(reservationId);
  const [reason, setReason] = useState("");

  if (!res) return null;

  const submit = () => {
    cancelReservation(reservationId, reason || undefined);
    onClose({ tone: "ok", msg: "Reservation cancelled." });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-destructive">Cancel Reservation</h3>
            <p className="text-xs text-muted-foreground">{res.id} · {res.guestName}</p>
          </div>
          <button onClick={() => onClose()} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to cancel this reservation? This action cannot be undone.
          </p>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Cancellation reason <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            >
              <option value="">Select a reason…</option>
              <option value="Guest request">Guest request</option>
              <option value="No-show">No-show</option>
              <option value="Duplicate booking">Duplicate booking</option>
              <option value="Payment declined">Payment declined</option>
              <option value="Change of plans">Change of plans</option>
              <option value="Rate too high">Rate too high</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {reason === "Other" && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason…"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          )}
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={() => onClose()} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted">Keep reservation</button>
          <button onClick={submit} className="rounded-md bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90">
            Cancel reservation
          </button>
        </div>
      </div>
    </div>
  );
}
