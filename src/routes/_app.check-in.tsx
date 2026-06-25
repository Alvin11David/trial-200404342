import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
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
  Clock,
  Sparkles,
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
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/check-in")({
  head: () => ({ meta: [{ title: "Check-In — Jambo PMS" }] }),
  component: CheckInPage,
});

const statusBadge: Record<string, string> = {
  confirmed: "bg-info/10 text-info border-info/25",
  open: "bg-warning/10 text-warning border-warning/25",
};

function CheckInPage() {
  const reservations = useStore((s) => s.reservations);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const arrivals = useMemo(
    () =>
      reservations
        .filter((r) => r.status === "confirmed" || r.status === "open")
        .filter((r) => !query || r.guestName.toLowerCase().includes(query.toLowerCase())),
    [reservations, query],
  );

  return (
    <div className="mx-auto max-w-5xl" role="main" aria-label="Check-In">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <span className="relative mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <LogIn className="h-6 w-6 text-primary" />
          </span>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">Check-In</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary animate-count-pop">
                <Clock className="h-3 w-3" />
                {arrivals.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {arrivals.length === 0
                ? "No guests arriving today"
                : `${arrivals.length} guest${arrivals.length !== 1 ? "s" : ""} arriving today`}
            </p>
          </div>
        </div>
        <Link
          to="/reservations/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          New Booking
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 group" role="search">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 transition-colors duration-200 group-focus-within:text-primary" />
        <input
          ref={searchRef}
          placeholder="Search by guest name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-glow w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition-all duration-200 focus:border-primary/50"
          aria-label="Search guests by name"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 sm:flex">
          <span className="text-[9px]">⌘</span>K
        </kbd>
      </div>

      {/* Arrivals list */}
      {arrivals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center transition-all">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border">
            <LogIn className="h-7 w-7 text-muted-foreground/40" />
          </span>
          <h3 className="text-lg font-semibold text-muted-foreground">No arrivals</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground/60">
            {query
              ? "No reservations match your search."
              : "All confirmed reservations have been checked in."}
          </p>
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-muted hover:shadow-sm"
            >
              <X className="h-4 w-4" /> Clear search
            </button>
          ) : (
            <Link
              to="/reservations/new"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 hover:scale-105 active:scale-95"
            >
              Create a new booking <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3" role="list" aria-label="Arrivals list">
          {arrivals.map((res, idx) => {
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
                  "group/card rounded-2xl border bg-card transition-all duration-200 hover:shadow-md",
                  isOpen
                    ? "border-primary/40 shadow-md"
                    : "border-border shadow-sm hover:border-primary/20",
                )}
                role="listitem"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <button
                  onClick={() => setSelected(isOpen ? null : res.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`checkin-form-${res.id}`}
                >
                  {/* Left accent bar */}
                  <span
                    className={cn(
                      "h-10 w-1 shrink-0 rounded-full transition-all duration-200",
                      res.status === "confirmed" ? "bg-info" : "bg-warning",
                      isOpen && "h-14",
                    )}
                  />

                  {/* Avatar */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20 transition-all duration-200 group-hover/card:ring-2">
                    <User className="h-5 w-5" />
                  </span>

                  {/* Guest info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{res.guestName}</span>
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                          statusBadge[res.status],
                        )}
                      >
                        {res.status === "confirmed" ? "Confirmed" : "Open"}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-medium text-muted-foreground/70">#{res.id}</span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3 w-3" />
                        {rt?.typeName ?? res.roomTypeId}
                      </span>
                      <span>{fmtUGX(res.ratePerNight)} / night</span>
                    </div>
                  </div>

                  {/* Desktop right column */}
                  <div className="hidden items-center gap-4 text-right sm:flex">
                    <div>
                      <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {res.checkIn}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground/50">
                        {nights} night{nights > 1 ? "s" : ""}
                      </div>
                    </div>
                    {res.roomId && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
                        <BedDouble className="h-3 w-3" />
                        {res.roomId}
                      </span>
                    )}
                  </div>

                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-hover/card:translate-y-0.5" />
                  )}
                </button>

                {isOpen && (
                  <div id={`checkin-form-${res.id}`} className="animate-expand-in">
                    <div className="border-t border-border px-5 py-4">
                      <CheckInForm
                        reservationId={res.id}
                        candidates={opts}
                        onDone={() => setSelected(null)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
  onDone: () => void;
}) {
  const [room, setRoom] = useState(candidates[0] ?? "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!room) return;
    setLoading(true);
    const r = checkIn(reservationId, { roomId: room });
    setLoading(false);
    if (r.ok) {
      toast.success(`${reservationById(reservationId)?.guestName} checked in successfully.`);
      onDone();
    } else {
      toast.error(r.error);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <BedDouble className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold text-foreground">Assign Room</span>
          <span className="text-[10px] text-muted-foreground/50">
            {candidates.length} available
          </span>
        </div>
        {candidates.length === 0 ? (
          <p
            className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs font-medium text-warning"
            role="alert"
          >
            No rooms of this type are available for the selected dates.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select a room">
            {candidates.map((id) => {
              const r = roomById(id);
              const active = room === id;
              return (
                <button
                  key={id}
                  onClick={() => setRoom(id)}
                  role="radio"
                  aria-checked={active}
                  className={cn(
                    "group/room relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                    active
                      ? "border-primary bg-primary/[0.06] shadow-sm"
                      : "border-border bg-background hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-sm",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "bg-muted text-muted-foreground group-hover/room:bg-primary/10 group-hover/room:text-primary",
                    )}
                  >
                    <BedDouble className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          active ? "text-primary" : "text-foreground",
                        )}
                      >
                        Room {id}
                      </span>
                      {active && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary animate-count-pop" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Floor {r?.floor} · {r?.status.replace("_", " ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={submit}
        disabled={!room || loading}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 disabled:opacity-40 disabled:shadow-none sm:self-end"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Checking in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Confirm Check-In
          </>
        )}
      </button>
    </div>
  );
}
