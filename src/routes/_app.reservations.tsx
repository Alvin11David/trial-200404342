import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Filter, LogIn, LogOut, Plus, Search, X } from "lucide-react";
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
  useStore,
  type ReservationStatus,
} from "@/lib/pms-store";

export const Route = createFileRoute("/_app/reservations")({
  head: () => ({ meta: [{ title: "Reservations — Jambo PMS" }] }),
  component: ReservationsLayout,
});

function ReservationsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/reservations") {
    // child route (e.g. /reservations/new) handles its own UI
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Outlet } = require("@tanstack/react-router");
    return <Outlet />;
  }
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

function ReservationsPage() {
  const reservations = useStore((s) => s.reservations);
  const roomTypes = useStore((s) => s.roomTypes);

  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const [roomType, setRoomType] = useState<string>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openCheckIn, setOpenCheckIn] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (roomType !== "All" && r.roomTypeId !== roomType) return false;
      if (from && r.checkOut < from) return false;
      if (to && r.checkIn > to) return false;
      if (
        query &&
        !`${r.guestName} ${r.id} ${r.guestEmail} ${r.roomId ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [reservations, tab, roomType, from, to, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length };
    tabs.forEach((t) => {
      if (t.key !== "all") c[t.key] = reservations.filter((r) => r.status === t.key).length;
    });
    return c;
  }, [reservations]);

  const handleCheckOut = (id: string) => {
    const r = checkOut(id);
    setToast(r.ok ? { tone: "ok", msg: "Guest checked out. Room sent to housekeeping." } : { tone: "err", msg: r.error });
    setTimeout(() => setToast(null), 3500);
  };

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

      {/* Tabs */}
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
              <span className={cn("ml-2 text-[10px] opacity-80", active ? "" : "")}>{counts[t.key] ?? 0}</span>
            </button>
          );
        })}
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

      {/* Table */}
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
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {r.guestName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </div>
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
                          <button
                            onClick={() => setOpenCheckIn(r.id)}
                            title="Check in"
                            className="rounded-md border border-border bg-card p-1.5 text-success hover:bg-success/10"
                          >
                            <LogIn className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {r.status === "checked_in" && (
                          <button
                            onClick={() => handleCheckOut(r.id)}
                            title="Check out"
                            className="rounded-md border border-border bg-card p-1.5 text-warning hover:bg-warning/10"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(r.status === "confirmed" || r.status === "open") && (
                          <button
                            onClick={() => {
                              if (confirm("Cancel this reservation?")) cancelReservation(r.id);
                            }}
                            title="Cancel"
                            className="rounded-md border border-border bg-card p-1.5 text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-3.5 w-3.5" />
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
            if (msg) setToast(msg);
            if (msg) setTimeout(() => setToast(null), 3500);
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
            <p className="text-xs text-muted-foreground">
              {res.id} · {res.checkIn} → {res.checkOut}
            </p>
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
          <button onClick={() => onClose()} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!room}
            className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Confirm check-in
          </button>
        </div>
      </div>
    </div>
  );
}
