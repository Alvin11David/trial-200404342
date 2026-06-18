import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  User,
  CalendarDays,
  BedDouble,
  CheckCircle2,
  X,
  LogIn,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  checkIn,
  findAvailableRooms,
  fmtUGX,
  nightsBetween,
  reservationById,
  roomById,
  roomTypeById,
  useStore,
} from "@/lib/pms-store";

export const Route = createFileRoute("/_app/check-in")({
  head: () => ({ meta: [{ title: "Check-In — Jambo PMS" }] }),
  component: CheckInPage,
});

const statusBadge: Record<string, string> = {
  confirmed: "bg-info/15 text-info border-info/30",
  open: "bg-warning/10 text-warning border-warning/30",
};

function CheckInPage() {
  const reservations = useStore((s) => s.reservations);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const arrivals = useMemo(
    () =>
      reservations
        .filter((r) => r.status === "confirmed" || r.status === "open")
        .filter((r) => !query || r.guestName.toLowerCase().includes(query.toLowerCase())),
    [reservations, query],
  );

  const showToast = (t: { tone: "ok" | "err"; msg: string } | null) => {
    setToast(t);
    if (t) setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Check-In</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {arrivals.length} guest{arrivals.length !== 1 ? "s" : ""} arriving today
          </p>
        </div>
        <Link
          to="/reservations/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          New Booking <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search by guest name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {arrivals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <LogIn className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-muted-foreground">No arrivals</h3>
          <p className="mt-1 text-sm text-muted-foreground/60">All confirmed reservations have been checked in.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {arrivals.map((res) => {
            const rt = roomTypeById(res.roomTypeId);
            const nights = nightsBetween(res.checkIn, res.checkOut);
            const isOpen = selected === res.id;
            const candidates = findAvailableRooms(res.roomTypeId, res.checkIn, res.checkOut);
            const opts = res.roomId
              ? [res.roomId, ...candidates.filter((a) => a.id !== res.roomId).map((a) => a.id)]
              : candidates.map((a) => a.id);

            return (
              <div
                key={res.id}
                className={cn(
                  "rounded-xl border bg-card transition-all",
                  isOpen ? "border-primary/40 shadow-md" : "border-border shadow-sm hover:border-primary/20 hover:shadow-md",
                )}
              >
                <button
                  onClick={() => setSelected(isOpen ? null : res.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{res.guestName}</span>
                      <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium", statusBadge[res.status])}>
                        {res.status === "confirmed" ? "Confirmed" : "Open"}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>#{res.id}</span>
                      <span>{rt?.name ?? res.roomTypeId}</span>
                      <span>{fmtUGX(res.ratePerNight)} / night</span>
                    </div>
                  </div>
                  <div className="hidden items-center gap-3 text-right sm:flex">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {res.checkIn}
                      </div>
                      <div className="text-[11px] text-muted-foreground/60">{nights} night{nights > 1 ? "s" : ""}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {res.roomId && (
                        <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                          <BedDouble className="h-3 w-3" />
                          {res.roomId}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <CheckInForm
                    reservationId={res.id}
                    candidates={opts}
                    onDone={(t) => {
                      showToast(t);
                      setSelected(null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-5 py-3 shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-2",
            toast.tone === "ok"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {toast.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function CheckInForm({
  reservationId,
  candidates,
  onDone,
}: {
  reservationId: string;
  candidates: string[];
  onDone: (toast: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const [room, setRoom] = useState(candidates[0] ?? "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!room) return;
    setLoading(true);
    const r = checkIn(reservationId, { roomId: room });
    setLoading(false);
    onDone(r.ok ? { tone: "ok", msg: `${reservationById(reservationId)?.guestName} checked in successfully.` } : { tone: "err", msg: r.error });
  };

  return (
    <div className="border-t border-border px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Assign room</label>
          {candidates.length === 0 ? (
            <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">
              No rooms of this type are available for the selected dates.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidates.map((id) => {
                const r = roomById(id);
                const active = room === id;
                return (
                  <button
                    key={id}
                    onClick={() => setRoom(id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-medium transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <BedDouble className={cn("h-3.5 w-3.5", active && "text-primary")} />
                    Room {id}
                    <span className="text-[10px] text-muted-foreground">Floor {r?.floor}</span>
                    {active && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={submit}
          disabled={!room || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Confirm Check-In
        </button>
      </div>
    </div>
  );
}
