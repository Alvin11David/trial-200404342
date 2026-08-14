import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  Filter,
  LogIn,
  LogOut,
  Plus,
  Search,
  X,
  UserX,
  Pencil,
  CalendarDays,
  Table2,
  ChevronDown,
  Clock,
  User,
  BedDouble,
  Sparkles,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  checkOut,
  transferFolio,
  folioBalance,
  fmtUGX,
  isWithinNoShowWindow,
  nightsBetween,
  roomTypeById,
  useStore,
  type ReservationStatus,
  type Reservation,
  type Room,
} from "@/lib/pms-store";
import RecordPaymentDialog from "@/features/frontdesk/RecordPaymentDialog";
import CheckoutConfirmationDialog from "@/features/frontdesk/CheckoutConfirmationDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EditDialog,
  CancelDialog,
  NoShowDialog,
} from "@/features/reservations/reservation-dialogs";

type TabKey = "all" | ReservationStatus | "checkin";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "checkin", label: "Check In" },
  { key: "open", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "checked_in", label: "Checked In" },
  { key: "checked_out", label: "Checked Out" },
  { key: "no_show", label: "No-Show" },
  { key: "cancelled", label: "Cancelled" },
];

const statusStyles: Record<ReservationStatus, string> = {
  open: "bg-info/15 text-info border-info/30",
  confirmed: "bg-info/15 text-info border-info/30",
  checked_in: "bg-success/15 text-success border-success/30",
  checked_out: "bg-muted/40 text-muted-foreground border-border/40",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  no_show: "bg-warning/15 text-warning border-warning/30",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-success/20 text-success border-success/30",
  reserved: "bg-info/15 text-info border-info/30",
  checked_in: "bg-success/15 text-success border-success/30",
  checked_out: "bg-muted/40 text-muted-foreground border-border/40",
  blocked: "bg-destructive/15 text-destructive border-destructive/30",
};

const roomTypeOrder = ["std", "dlx", "ste"];

export default function ReservationsPage() {
  const navigate = useNavigate();
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const guests = useStore((s) => s.guests);
  const folios = useStore((s) => s.folios);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [roomType, setRoomType] = useState<string>("All");
  const [roomTypeOpen, setRoomTypeOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openEdit, setOpenEdit] = useState<string | null>(null);
  const [openCancel, setOpenCancel] = useState<string | null>(null);
  const [openNoShow, setOpenNoShow] = useState<string | null>(null);
  const [recordPayment, setRecordPayment] = useState<{
    reservationId: string;
    folioId: string;
  } | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<Reservation | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 7);
  });
  const [cellWidth, setCellWidth] = useState(52);
  const [selectedDetail, setSelectedDetail] = useState<{
    room: Room;
    cell: { day: string; status: string; reservation: Reservation | null };
  } | null>(null);

  const showToast = (t: { tone: "ok" | "err"; msg: string }) => {
    if (t.tone === "ok") toast.success(t.msg);
    else toast.error(t.msg);
  };

  const handleCheckOut = (r: Reservation) => {
    setCheckoutTarget(r);
  };

  const handleConfirmCheckout = (transferToDebtors: boolean) => {
    const target = checkoutTarget;
    setCheckoutTarget(null);
    if (!target) return;
    if (transferToDebtors) {
      const sourceFolio = folios.find((f) => f.reservationId === target.id);
      if (sourceFolio?.corporateAccountId) {
        const targetFolio = folios.find(
          (f) =>
            f.id !== sourceFolio.id &&
            f.corporateAccountId === sourceFolio.corporateAccountId &&
            f.status === "open",
        );
        if (targetFolio) transferFolio(sourceFolio.id, targetFolio.id, "Front Desk", "Front Desk");
      }
    }
    const result = checkOut(target.id);
    if (!result.ok) {
      showToast({ tone: "err", msg: result.error });
      return;
    }
    if (result.postStay) {
      toast.warning(
        transferToDebtors
          ? "Guest checked out. Balance transferred to Debtors Account — Finance to follow up."
          : `Guest checked out. Outstanding balance of ${fmtUGX(result.balance ?? 0)} remains. Collect payment from guest.`,
      );
    } else {
      showToast({ tone: "ok", msg: "Guest checked out." });
    }
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
            (g.fullName.toLowerCase().includes(q) ||
              g.email.toLowerCase().includes(q) ||
              g.phone.includes(q)) &&
            g.email === r.guestEmail,
        );
        if (
          !matchGuest &&
          !`${r.guestName} ${r.id} ${r.confirmationNumber} ${r.guestEmail} ${r.roomId ?? ""} ${r.guestPhone}`
            .toLowerCase()
            .includes(q)
        )
          return false;
      }
      return true;
    });
  }, [reservations, tab, roomType, from, to, query, guests]);

  const arrivalsCount = useMemo(
    () => reservations.filter((r) => r.status === "confirmed" || r.status === "open").length,
    [reservations],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length };
    tabs.forEach((t) => {
      if (t.key === "checkin") c[t.key] = arrivalsCount;
      else if (t.key !== "all") c[t.key] = reservations.filter((r) => r.status === t.key).length;
    });
    return c;
  }, [reservations, arrivalsCount]);

  const arrivals = useMemo(
    () =>
      reservations
        .filter((r) => r.status === "confirmed" || r.status === "open")
        .filter((r) => !query || r.guestName.toLowerCase().includes(query.toLowerCase())),
    [reservations, query],
  );

  // Calendar view data: days in month × rooms grid
  const calendarCells = useMemo(() => {
    const [yr, mo] = calendarDate.split("-").map(Number);
    const daysInMonth = new Date(yr, mo, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = `${calendarDate}-${String(i + 1).padStart(2, "0")}`;
      return d;
    });
    const sortedRooms = [...rooms].sort((a, b) => {
      const ta = roomTypeOrder.indexOf(a.roomTypeId);
      const tb = roomTypeOrder.indexOf(b.roomTypeId);
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
          <p className="mt-1 text-sm text-muted-foreground">
            Manage bookings, check-ins and check-outs.
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Open", value: counts.confirmed ?? 0, bar: "var(--color-primary)" },
          { label: "In-house", value: counts.checked_in ?? 0, bar: "var(--color-success)" },
          { label: "Checked Out", value: counts.checked_out ?? 0, bar: "var(--color-info)" },
          { label: "Cancelled", value: counts.cancelled ?? 0, bar: "var(--color-destructive)" },
        ].map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-4"
          >
            <div
              className="absolute left-0 top-0 h-full w-[3px]"
              style={{ background: s.bar, boxShadow: `0 0 10px ${s.bar}` }}
            />
            <div className="pl-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
              <div className="mt-1 text-2xl font-bold">{s.value}</div>
            </div>
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
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
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
              viewMode === "table"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Table view"
          >
            <Table2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "rounded-md p-1.5 text-xs transition",
              viewMode === "calendar"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
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
          <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by guest, reservation ID, room, email…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <DatePicker value={from} onChange={setFrom} />
          <span className="text-xs text-muted-foreground">→</span>
          <DatePicker value={to} onChange={setTo} />
          <div className="relative">
            <button
              onClick={() => setRoomTypeOpen(!roomTypeOpen)}
              className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            >
              {roomType === "All"
                ? "All room types"
                : (roomTypes.find((t) => t.id === roomType)?.name ?? roomType)}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {roomTypeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRoomTypeOpen(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
                  <button
                    onClick={() => {
                      setRoomType("All");
                      setRoomTypeOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition hover:bg-muted",
                      roomType === "All" && "bg-primary/10 font-medium text-primary",
                    )}
                  >
                    All room types
                  </button>
                  {roomTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setRoomType(t.id);
                        setRoomTypeOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition hover:bg-muted",
                        roomType === t.id && "bg-primary/10 font-medium text-primary",
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/40"
          >
            <Filter className="h-3.5 w-3.5" /> {showMoreFilters ? "Less" : "More"} filters
          </button>
        </div>
      </div>

      {/* Check-In Arrivals View */}
      {tab === "checkin" ? (
        <div className="mx-auto max-w-5xl">
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

                return (
                  <div
                    key={res.id}
                    className={cn(
                      "group/card rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/30",
                    )}
                    role="listitem"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <Link
                      to={`/check-in/${res.id}`}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left"
                    >
                      <span
                        className={cn(
                          "h-10 w-1 shrink-0 rounded-full transition-all duration-200",
                          res.status === "confirmed" ? "bg-info" : "bg-warning",
                        )}
                      />

                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20 transition-all duration-200 group-hover/card:ring-2">
                        <User className="h-5 w-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{res.guestName}</span>
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                              res.status === "confirmed"
                                ? "bg-info/10 text-info border-info/25"
                                : "bg-warning/10 text-warning border-warning/25",
                            )}
                          >
                            {res.status === "confirmed" ? "Confirmed" : "Open"}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="font-medium text-muted-foreground/70">#{res.id}</span>
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3 w-3" />
                            {rt?.name ?? res.roomTypeId}
                          </span>
                          <span>{fmtUGX(res.ratePerNight)} / night</span>
                        </div>
                      </div>

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

                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform duration-200 group-hover/card:translate-x-1 group-hover/card:text-primary" />
                    </Link>
                    {isWithinNoShowWindow(res.checkIn, res.checkOut) && res.status === "confirmed" && (
                      <div className="border-t border-border/50 px-3 py-1.5 flex items-center justify-end gap-1">
                        <button
                          onClick={() => setOpenNoShow(res.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-warning hover:bg-warning/10 transition-colors"
                        >
                          <UserX className="h-3 w-3" />
                          Mark no-show
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : /* Calendar View */
      viewMode === "calendar" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="cursor-pointer rounded-xl border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none hover:bg-muted">
                      {new Date(calendarDate + "-01").toLocaleString("en", {
                        month: "long",
                        year: "numeric",
                      })}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={6}
                    className="w-auto rounded-xl p-2 shadow-lg"
                  >
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        "Jan","Feb","Mar","Apr","May","Jun",
                        "Jul","Aug","Sep","Oct","Nov","Dec",
                      ].map((m, i) => {
                        const val = String(i + 1).padStart(2, "0");
                        const sel = calendarDate.split("-")[1] === val;
                        return (
                          <button
                            key={m}
                            onClick={() =>
                              setCalendarDate(`${calendarDate.split("-")[0]}-${val}`)
                            }
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-muted",
                              sel && "bg-primary text-primary-foreground hover:bg-primary",
                            )}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1 border-t border-border pt-2">
                      {Array.from({ length: 5 }, (_, i) => {
                        const y = new Date().getFullYear() - 2 + i;
                        const sel = calendarDate.split("-")[0] === String(y);
                        return (
                          <button
                            key={y}
                            onClick={() =>
                              setCalendarDate(`${y}-${calendarDate.split("-")[1]}`)
                            }
                            className={cn(
                              "rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-muted",
                              sel && "bg-primary text-primary-foreground hover:bg-primary",
                            )}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </h3>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-success/30" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-info/30" />
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-success/40" />
                <span>Checked in</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-destructive/20" />
                <span>Blocked</span>
              </div>
              <span className="text-muted-foreground/30">|</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">Width</span>
                <input
                  type="range"
                  min={36}
                  max={120}
                  value={cellWidth}
                  onChange={(e) => setCellWidth(Number(e.target.value))}
                  className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-border accent-primary"
                  title="Adjust day cell width"
                />
                <span className="w-6 text-right tabular-nums text-[10px]">{cellWidth}px</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `120px repeat(${calendarCells.days.length}, minmax(${cellWidth}px,1fr))`,
              }}
            >
              {/* Header row */}
              <div className="sticky left-0 z-10 border-r border-border bg-card px-3 py-2 text-[10px] font-semibold uppercase text-muted-foreground">
                Room
              </div>
              {calendarCells.days.map((day) => {
                const dt = new Date(day + "T00:00:00");
                return (
                  <div
                    key={day}
                    className={cn(
                      "border-r border-border px-1 py-2 text-center text-[10px] font-medium",
                      dt.getDay() === 0 || dt.getDay() === 6
                        ? "text-destructive/60"
                        : "text-muted-foreground",
                    )}
                  >
                    <div>{dt.getDate()}</div>
                    <div className="text-[8px] uppercase">
                      {dt.toLocaleDateString("en", { weekday: "short" })}
                    </div>
                  </div>
                );
              })}
              {/* Room rows */}
              {calendarCells.rows.map(({ room, cells }) => {
                const rt = roomTypeById(room.roomTypeId);
                return (
                  <>
                    <div
                      key={room.id}
                      className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-border bg-card px-3 py-2"
                    >
                      <span className="text-xs font-medium">{room.roomNumber}</span>
                       <span className="text-[9px] text-muted-foreground">{rt?.name}</span>
                     </div>
                    {cells.map((cell, cellIdx) => {
                      if (!cell.reservation) {
                        return (
                          <div
                            key={cell.day}
                            className={cn(
                              "border-b border-r border-border px-1 py-2 text-center text-[9px] transition",
                              cell.status === "available" && "bg-success/[0.03]",
                              cell.status === "blocked" && "bg-destructive/8",
                            )}
                            title={
                              cell.status === "blocked"
                                ? "Out of order"
                                : "Available"
                            }
                          />
                        );
                      }

                      const isStart = cell.day === cell.reservation.checkIn;
                      const isEnd =
                        cellIdx === cells.length - 1 ||
                        cells[cellIdx + 1]?.reservation?.id !== cell.reservation.id;

                      const nights = Math.max(
                        1,
                        Math.round(
                          (new Date(cell.reservation.checkOut).getTime() -
                            new Date(cell.reservation.checkIn).getTime()) /
                            86_400_000,
                        ),
                      );
                      const guestInitial = cell.reservation.guestName.charAt(0).toUpperCase();
                      const firstName = cell.reservation.guestName.split(" ")[0];

                      const barBg =
                        cell.status === "checked_in"
                          ? "bg-success/30 group-hover:bg-success/40"
                          : "bg-info/25 group-hover:bg-info/35";

                      return (
                        <HoverCard key={cell.day} openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div
                              onClick={() => setSelectedDetail({ room, cell })}
                              className={cn(
                                "group relative cursor-pointer border-b px-1 py-1.5 text-center text-[9px] transition",
                                !isEnd && "border-r-0",
                                isEnd && "border-r border-border",
                              )}
                            >
                              {/* Gantt bar */}
                              <div
                                className={cn(
                                  "absolute inset-0 transition",
                                  barBg,
                                  isStart && "rounded-l-sm",
                                  isEnd && "rounded-r-sm",
                                  isStart && isEnd && "rounded-sm",
                                )}
                              />
                              {/* Left accent stripe at check-in */}
                              {isStart && (
                                <div
                                  className={cn(
                                    "absolute left-0 top-0 bottom-0 w-0.5 rounded-l-sm",
                                    cell.status === "checked_in"
                                      ? "bg-success"
                                      : "bg-info",
                                  )}
                                />
                              )}
                              {/* Guest name at start */}
                              {isStart && (
                                <span className="relative z-10 flex items-center gap-1 px-1">
                                  <span
                                    className={cn(
                                      "grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[6px] font-bold text-white",
                                      cell.status === "checked_in"
                                        ? "bg-success"
                                        : "bg-info",
                                    )}
                                  >
                                    {guestInitial}
                                  </span>
                                  <span className="truncate text-[7px] font-semibold leading-none text-foreground/80">
                                    {firstName}
                                  </span>
                                </span>
                              )}
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="bottom"
                            align="start"
                            sideOffset={6}
                            className="w-72 p-0 shadow-xl"
                          >
                            {/* Header with initials */}
                            <div
                              className={cn(
                                "flex items-center gap-3 rounded-t-xl px-4 py-3",
                                cell.status === "checked_in"
                                  ? "bg-success/10"
                                  : "bg-info/10",
                              )}
                            >
                              <span
                                className={cn(
                                  "grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white",
                                  cell.status === "checked_in"
                                    ? "bg-success"
                                    : "bg-info",
                                )}
                              >
                                {guestInitial}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold leading-tight">
                                  {cell.reservation.guestName}
                                </p>
                                <p className="truncate text-[10px] text-muted-foreground">
                                  {cell.reservation.id} · {cell.reservation.confirmationNumber}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                  cell.status === "reserved"
                                    ? "border-info/30 bg-info/15 text-info"
                                    : "border-success/30 bg-success/15 text-success",
                                )}
                              >
                                {cell.status === "reserved" ? "Reserved" : "Checked in"}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-2.5 px-4 py-3">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Room</span>
                                <span className="font-medium">{room.roomNumber}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">
                                  {rt?.name ?? cell.reservation.roomTypeId}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Stay</span>
                                <span className="font-medium">
                                  {cell.reservation.checkIn} → {cell.reservation.checkOut}
                                </span>
                                <span className="text-muted-foreground">
                                  ({nights} night{nights !== 1 && "s"})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Rate</span>
                                <span className="font-medium">
                                  {fmtUGX(cell.reservation.ratePerNight)} / night
                                </span>
                              </div>
                              {cell.reservation.mealPlan && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Meal plan</span>
                                  <span className="font-medium">{({ RO: "Room Only", BB: "Bed & Breakfast", HB: "Half Board", FB: "Full Board" } as Record<string, string>)[cell.reservation.mealPlan] ?? cell.reservation.mealPlan}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 border-t border-border px-4 py-3">
                              <Link
                                to={`/reservations/${cell.reservation.id}`}
                                className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-[11px] font-medium hover:bg-muted"
                              >
                                View details
                              </Link>
                              {cell.status === "reserved" && (
                                <Link
                                  to={`/check-in/${cell.reservation.id}`}
                                  className="flex-1 rounded-lg bg-success px-3 py-2 text-center text-[11px] font-semibold text-white hover:bg-success/90"
                                >
                                  Check In
                                </Link>
                              )}
                              {cell.status === "checked_in" && (
                                <>
                                  {folioBalance(cell.reservation!.folioId ?? "") > 0 && (
                                    <button
                                      onClick={() =>
                                        setRecordPayment({
                                          reservationId: cell.reservation!.id,
                                          folioId: cell.reservation!.folioId ?? "",
                                        })
                                      }
                                      className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2 text-[11px] font-semibold text-white hover:from-emerald-500/90 hover:to-green-600/90"
                                    >
                                      Record Payment
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCheckOut(cell.reservation!)}
                                    className="flex-1 rounded-lg bg-warning px-3 py-2 text-[11px] font-semibold text-white hover:bg-warning/90"
                                  >
                                    Check Out
                                  </button>
                                </>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      );
                    })}
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
                            to={`/guests/${r.guestEmail}`}
                            className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary hover:bg-primary/20"
                            title="View guest profile"
                          >
                            {r.guestName
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)}
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
                        <div className="font-medium">
                          {r.checkIn} → {r.checkOut}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {nights} night{nights !== 1 && "s"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.bookingSource}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            statusStyles[r.status],
                          )}
                        >
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold">{fmtUGX(total)}</div>
                        {r.deposit ? (
                          <div className="text-[10px] text-green-500">Dep: {fmtUGX(r.deposit)}</div>
                        ) : null}
                        {r.discount ? (
                          <div className="text-[10px] text-red-500">
                            Disc: -{fmtUGX(r.discount)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                          <Link
                            to={`/reservations/${r.id}`}
                            title="View details"
                            className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          {(r.status === "confirmed" || r.status === "open") && (
                            <>
                              <button
                                onClick={() => setOpenEdit(r.id)}
                                title="Edit"
                                className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <Link
                                to={`/check-in/${r.id}`}
                                title="Check in"
                                className="rounded-md border border-border bg-card p-1.5 text-success hover:bg-success/10 inline-flex"
                              >
                                <LogIn className="h-3.5 w-3.5" />
                              </Link>
                              {r.status === "confirmed" &&
                                isWithinNoShowWindow(r.checkIn, r.checkOut) && (
                                <button
                                  onClick={() => setOpenNoShow(r.id)}
                                  title="No-show"
                                  className="rounded-md border border-border bg-card p-1.5 text-warning hover:bg-warning/10"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                </button>
                              )}
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
                            <>
                              {folioBalance(r.folioId ?? "") > 0 && (
                                <button
                                  onClick={() =>
                                    setRecordPayment({ reservationId: r.id, folioId: r.folioId ?? "" })
                                  }
                                  title="Record payment"
                                  className="rounded-md border border-border bg-card p-1.5 text-success hover:bg-success/10"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleCheckOut(r)}
                                title="Check out"
                                className="rounded-md border border-border bg-card p-1.5 text-warning hover:bg-warning/10"
                              >
                                <LogOut className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-16 text-center text-sm text-muted-foreground"
                    >
                      No reservations match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="fixed bottom-8 right-8 z-30 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50 hover:scale-105 active:scale-95">
            <Plus className="h-5 w-5" />
            New Reservation/Check In
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-2">
          <DropdownMenuItem asChild>
            <Link
              to="/reservations/new"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium">New Reservation</p>
                <p className="text-[10px] text-muted-foreground">Create a new booking</p>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/check-in/new"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-success/20 to-success/5 text-success ring-1 ring-success/20">
                <LogIn className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium">New Check In</p>
                <p className="text-[10px] text-muted-foreground">Walk-in check-in for guests without a reservation</p>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {openEdit && (
        <EditDialog
          reservationId={openEdit}
          onClose={(msg) => {
            setOpenEdit(null);
            if (msg) showToast(msg);
          }}
        />
      )}

      {openNoShow && (
        <NoShowDialog
          reservationId={openNoShow}
          onClose={(msg) => {
            setOpenNoShow(null);
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

      {selectedDetail && (
        <Dialog
          open={!!selectedDetail}
          onOpenChange={(open) => {
            if (!open) setSelectedDetail(null);
          }}
        >
          <DialogContent className="w-72 p-0 shadow-xl">
            {(() => {
              const { room, cell } = selectedDetail;
              if (!cell.reservation) return null;
              const rt = roomTypeById(room.roomTypeId);
              const nights = Math.max(
                1,
                Math.round(
                  (new Date(cell.reservation.checkOut).getTime() -
                    new Date(cell.reservation.checkIn).getTime()) /
                    86_400_000,
                ),
              );
              const guestInitial = cell.reservation.guestName.charAt(0).toUpperCase();
              const firstName = cell.reservation.guestName.split(" ")[0];

              return (
                <>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-t-xl px-4 py-3",
                      cell.status === "checked_in"
                        ? "bg-success/10"
                        : "bg-info/10",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white",
                        cell.status === "checked_in"
                          ? "bg-success"
                          : "bg-info",
                      )}
                    >
                      {guestInitial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight">
                        {cell.reservation.guestName}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {cell.reservation.id} · {cell.reservation.confirmationNumber}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        cell.status === "reserved"
                          ? "border-info/30 bg-info/15 text-info"
                          : "border-success/30 bg-success/15 text-success",
                      )}
                    >
                      {cell.status === "reserved" ? "Reserved" : "Checked in"}
                    </span>
                  </div>

                  <div className="space-y-2.5 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Room</span>
                      <span className="font-medium">{room.roomNumber}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        {rt?.name ?? cell.reservation.roomTypeId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Stay</span>
                      <span className="font-medium">
                        {cell.reservation.checkIn} → {cell.reservation.checkOut}
                      </span>
                      <span className="text-muted-foreground">
                        ({nights} night{nights !== 1 && "s"})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-medium">
                        {fmtUGX(cell.reservation.ratePerNight)} / night
                      </span>
                    </div>
                    {cell.reservation.mealPlan && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Meal plan</span>
                        <span className="font-medium">{({ RO: "Room Only", BB: "Bed & Breakfast", HB: "Half Board", FB: "Full Board" } as Record<string, string>)[cell.reservation.mealPlan] ?? cell.reservation.mealPlan}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 border-t border-border px-4 py-3">
                    <Link
                      to={`/reservations/${cell.reservation.id}`}
                      onClick={() => setSelectedDetail(null)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-[11px] font-medium hover:bg-muted"
                    >
                      View details
                    </Link>
                    {cell.status === "reserved" && (
                      <Link
                        to={`/check-in/${cell.reservation.id}`}
                        onClick={() => setSelectedDetail(null)}
                        className="flex-1 rounded-lg bg-success px-3 py-2 text-center text-[11px] font-semibold text-white hover:bg-success/90"
                      >
                        Check In
                      </Link>
                    )}
                    {cell.status === "checked_in" && (
                      <>
                        {folioBalance(cell.reservation!.folioId ?? "") > 0 && (
                          <button
                            onClick={() =>
                              setRecordPayment({
                                reservationId: cell.reservation!.id,
                                folioId: cell.reservation!.folioId ?? "",
                              })
                            }
                            className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2 text-[11px] font-semibold text-white hover:from-emerald-500/90 hover:to-green-600/90"
                          >
                            Record Payment
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedDetail(null);
                            handleCheckOut(cell.reservation!);
                          }}
                          className="flex-1 rounded-lg bg-warning px-3 py-2 text-[11px] font-semibold text-white hover:bg-warning/90"
                        >
                          Check Out
                        </button>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {recordPayment && (
        <RecordPaymentDialog
          reservationId={recordPayment.reservationId}
          folioId={recordPayment.folioId}
          onClose={() => setRecordPayment(null)}
        />
      )}

      {checkoutTarget && (
        <CheckoutConfirmationDialog
          reservation={checkoutTarget}
          onConfirm={handleConfirmCheckout}
          onClose={() => setCheckoutTarget(null)}
        />
      )}
    </div>
  );
}


