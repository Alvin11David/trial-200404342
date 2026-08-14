import { Link } from "react-router-dom";
import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  User,
  CalendarDays,
  BedDouble,
  X,
  LogIn,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  Sparkles,
  UserX,
  DollarSign,
  CreditCard,
  Key,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { cn, effectiveDeposit } from "@/lib/utils";
import {
  fmtUGX,
  isWithinNoShowWindow,
  nightsBetween,
  roomTypeById,
  useStore,
  reservationById,
  addPayment,
  checkIn,
  roomById,
} from "@/lib/pms-store";
import { NoShowDialog } from "@/features/reservations/reservation-dialogs";

const statusBadge: Record<string, string> = {
  confirmed: "bg-info/10 text-info border-info/25",
  open: "bg-warning/10 text-warning border-warning/25",
};

export default function CheckInPage() {
  const reservations = useStore((s) => s.reservations);
  const [query, setQuery] = useState("");
  const [openNoShowId, setOpenNoShowId] = useState<string | null>(null);
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
                      onClick={() => setOpenNoShowId(res.id)}
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

      {openNoShowId && (
        <NoShowDialog
          reservationId={openNoShowId}
          onClose={(msg) => {
            setOpenNoShowId(null);
            if (msg) {
              if (msg.tone === "ok") toast.success(msg.msg);
              else toast.error(msg.msg);
            }
          }}
        />
      )}
    </div>
  );
}

export function CheckInForm({
  reservationId,
  candidates,
  reservation,
  onDone,
}: {
  reservationId: string;
  candidates: string[];
  reservation: ReturnType<typeof reservationById>;
  onDone: () => void;
}) {
  const [room, setRoom] = useState(candidates[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("guest");

  const [editPhone, setEditPhone] = useState(reservation?.guestPhone ?? "");
  const [editEmail, setEditEmail] = useState(reservation?.guestEmail ?? "");
  const [editNationality, setEditNationality] = useState(reservation?.nationality ?? "");

  const [rateOverride, setRateOverride] = useState(false);
  const [overrideRate, setOverrideRate] = useState(reservation?.ratePerNight ?? 0);
  const [authCode, setAuthCode] = useState("");

  const [collectPayment, setCollectPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<"mtn_momo" | "airtel_money" | "card" | "cash" | "">("");
  const [payPhone, setPayPhone] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payRef, setPayRef] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [keyIssued, setKeyIssued] = useState(false);
  const [keyRef, setKeyRef] = useState("");

  const [specialRequests, setSpecialRequests] = useState(reservation?.specialRequests ?? "");

  const canSubmit = !!room;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    if (collectPayment && payMethod && reservation?.folioId) {
      const amount = effectiveDeposit(overrideRate * nights, payMethod, payAmount);
      addPayment(reservation.folioId, {
        method: payMethod,
        amount,
        date: new Date().toISOString().slice(0, 10),
        phone: (payMethod === "mtn_momo" || payMethod === "airtel_money") ? payPhone : undefined,
        reference: payRef || undefined,
        status: "confirmed",
      });
    }

    const r = checkIn(reservationId, { roomId: room });
    setLoading(false);
    if (r.ok) {
      toast.success(`${reservationById(reservationId)?.guestName} checked in successfully.`);
      onDone();
    } else {
      toast.error(r.error);
    }
  };

  const nights = reservation ? nightsBetween(reservation.checkIn, reservation.checkOut) : 1;
  const total = overrideRate * nights;

  const sections = [
    { id: "guest", label: "Guest Details", icon: User },
    { id: "room", label: "Room", icon: BedDouble },
    { id: "rate", label: "Rate", icon: DollarSign },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "keycard", label: "Key Card", icon: Key },
    { id: "notes", label: "Requests", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-1.5">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const active = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Guest Details */}
      {activeSection === "guest" && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Guest Verification</h4>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Full name</label>
              <p className="text-sm font-medium">{reservation?.guestName}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</label>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-sm outline-none focus:border-primary/60"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</label>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-sm outline-none focus:border-primary/60"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nationality</label>
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <input
                  value={editNationality}
                  onChange={(e) => setEditNationality(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-sm outline-none focus:border-primary/60"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">ID Type</label>
              <p className="text-sm">{reservation?.idType ?? "\u2014"}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">ID Number</label>
              <p className="text-sm font-mono">{reservation?.idNumber ?? "\u2014"}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Client Type</label>
              <p className="text-sm">{reservation?.clientType ?? "\u2014"}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Guests</label>
              <p className="text-sm">
                {reservation?.adults != null
                  ? `${reservation.adults} Adult${reservation.adults !== 1 ? "s" : ""}${reservation.children ? `, ${reservation.children} Child${reservation.children !== 1 ? "ren" : ""}` : ""}`
                  : "\u2014"}
              </p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Booking Source</label>
              <p className="text-sm">{reservation?.bookingSource ? reservation.bookingSource.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "\u2014"}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Arrival Time</label>
              <p className="text-sm">{reservation?.arrivalTime ?? "\u2014"}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Purpose</label>
              <p className="text-sm">{reservation?.purpose ?? "\u2014"}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Car Reg</label>
              <p className="text-sm font-mono">{reservation?.carReg ?? "\u2014"}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Extra Beds</label>
              <p className="text-sm">{reservation?.extraBeds ?? "\u2014"}</p>
            </div>
            {reservation?.vipFlag && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">VIP</label>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-xs font-semibold text-amber">VIP</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Room Assignment */}
      {activeSection === "room" && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Assign Room</h4>
            <span className="text-[10px] text-muted-foreground">{candidates.length} available</span>
          </div>
          {candidates.length === 0 ? (
            <p className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs font-medium text-warning" role="alert">
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
                        <span className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>
                          Room {id}
                        </span>
                        {active && <CheckCircle2 className="h-3.5 w-3.5 text-primary animate-count-pop" />}
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
      )}

      {/* Rate Confirmation */}
      {activeSection === "rate" && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Rate Confirmation</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card/50 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Standard Rate</div>
              <div className="text-lg font-bold">{fmtUGX(reservation?.ratePerNight ?? 0)} / night</div>
            </div>
            <div className="rounded-lg border border-border bg-card/50 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Nights</div>
              <div className="text-lg font-bold">{nights}</div>
            </div>
          </div>

          <div className="mt-3">
            <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 transition hover:border-primary/40 cursor-pointer">
              <input
                type="checkbox"
                checked={rateOverride}
                onChange={(e) => setRateOverride(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary"
              />
              <span className="text-sm font-medium">Override rate (requires authorization)</span>
            </label>
          </div>

          {rateOverride && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">New rate per night</label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">UGX</span>
                  <input
                    type="number"
                    value={overrideRate}
                    onChange={(e) => setOverrideRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm outline-none focus:border-primary/60"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Authorization code</label>
                <div className="relative mt-1">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="e.g. MGR-042"
                    className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-info/10 px-3 py-2 text-[11px] text-info sm:col-span-2">
                Rate override requires manager authorization code. Enter a valid manager ID to proceed.
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">Total stay</span>
            <span className="text-lg font-bold tabular-nums">{fmtUGX(total)}</span>
          </div>
        </div>
      )}

      {/* Payment */}
      {activeSection === "payment" && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Payment / Pre-Authorization</h4>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 transition hover:border-primary/40 cursor-pointer">
            <input
              type="checkbox"
              checked={collectPayment}
              onChange={(e) => setCollectPayment(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <div>
              <span className="text-sm font-medium">Collect payment or pre-authorize</span>
              <p className="text-[11px] text-muted-foreground">Set a deposit amount via mobile money, card, or cash</p>
            </div>
          </label>

          {collectPayment && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "mtn_momo" as const, label: "MTN MoMo" },
                  { id: "airtel_money" as const, label: "Airtel Money" },
                  { id: "card" as const, label: "Card" },
                  { id: "cash" as const, label: "Cash" },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => {
                      setPayMethod(pm.id);
                      if (payAmount === 0) setPayAmount(effectiveDeposit(total, pm.id, 0));
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition",
                      payMethod === pm.id
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {(payMethod === "mtn_momo" || payMethod === "airtel_money") && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone number</label>
                  <input
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    placeholder="+256 700 000 000"
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                </div>
              )}

              {payMethod === "card" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cardholder name</label>
                    <input
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Card number</label>
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Expiry date</label>
                      <input
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">CVV</label>
                      <input
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Card reference (last 4 digits)</label>
                    <input
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="4242"
                      maxLength={4}
                      className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Amount to collect</label>
                  <span className="text-sm font-bold">
                    {fmtUGX(effectiveDeposit(total, payMethod, payAmount))}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPayAmount(Math.round(total))}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition",
                      payAmount >= total
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    Full (100%)
                  </button>
                  <button
                    onClick={() => setPayAmount(Math.round(total * 0.5))}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition",
                      payAmount > 0 && payAmount < total
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    Half (50%)
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  max={Math.round(total)}
                  value={payAmount || ""}
                  onChange={(e) => setPayAmount(Math.max(0, Math.min(Math.round(total), Number(e.target.value) || 0)))}
                  placeholder="Custom amount"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-primary/60"
                />
                  <p className="text-[10px] text-muted-foreground">
                    Amount to pay today — the balance is due at check-out. 0 uses the suggested amount for the method.
                  </p>
                  <div className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Balance due at check-out</span>
                    <span className={cn("font-semibold tabular-nums", effectiveDeposit(total, payMethod, payAmount) >= total ? "text-success" : "text-warning")}>
                      {fmtUGX(Math.max(0, total - effectiveDeposit(total, payMethod, payAmount)))}
                    </span>
                  </div>
                </div>
            </div>
          )}
        </div>
      )}

      {/* Key Card */}
      {activeSection === "keycard" && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Key Card Issuance</h4>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-center">
            {keyIssued ? (
              <div>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </span>
                <p className="mt-2 text-sm font-semibold text-success">Key Card Issued</p>
                <p className="text-xs text-muted-foreground">Reference: {keyRef}</p>
                <p className="text-[10px] text-muted-foreground/60">Type: RFID · Expires: {reservation?.checkOut}</p>
              </div>
            ) : (
              <div>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                  <Lock className="h-6 w-6 text-muted-foreground/40" />
                </span>
                <p className="mt-2 text-sm text-muted-foreground">No key card issued yet</p>
                <button
                  onClick={() => {
                    setKeyIssued(true);
                    setKeyRef(`KC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
                    toast.success("Key card encoded for Room " + room);
                  }}
                  disabled={!room}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
                >
                  <Key className="h-3.5 w-3.5" /> Encode Key Card
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Special Requests */}
      {activeSection === "notes" && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Special Requests & Notes</h4>
          </div>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={4}
            placeholder="Late checkout, allergies, room preferences, extra amenities…"
            className="w-full resize-none rounded-xl border border-border/70 bg-card/40 p-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
          />
        </div>
      )}

      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={!canSubmit || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 disabled:opacity-40 disabled:shadow-none"
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
      </div>
    </div>
  );
}
