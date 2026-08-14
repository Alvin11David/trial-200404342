import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  CalendarCheck2,
  Phone,
  Mail,
  MapPin,
  Award,
  TrendingUp,
  X,
  ArrowLeft,
  Receipt,
  User,
  CalendarDays,
  BedDouble,
  Star,
  Key,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  LogOut,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fmtUGX,
  useStore,
  type Guest,
  checkOut,
  transferFolio,
  CHARGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  folioBalance,
  folioById,
  nightsBetween,
  reservationById,
  roomById,
  roomTypeById,
  activeKeyCardsByReservation,
  type GroupBlock,
  type Reservation,
  groupBlockById,
  effectiveStatus,
} from "@/lib/pms-store";
import RecordPaymentDialog from "@/features/frontdesk/RecordPaymentDialog";
import CheckoutConfirmationDialog from "@/features/frontdesk/CheckoutConfirmationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tierStyles: Record<Guest["tier"], string> = {
  Platinum:
    "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400",
  Gold: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
  Silver: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/30 dark:text-slate-400",
  Bronze:
    "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400",
};

const guestAccents = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-rose-500 to-rose-600",
  "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-indigo-500 to-indigo-600",
  "from-orange-500 to-orange-600",
];

type TabKey = "profiles" | "in-house" | "checked-out" | "no-show" | "group-blocks";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "in-house", label: "In House" },
  { key: "group-blocks", label: "Groups" },
  { key: "checked-out", label: "Checked Out" },
  { key: "no-show", label: "No-Show" },
  { key: "profiles", label: "Profiles" },
];

export default function GuestsPage() {
  const guests = useStore((s) => s.guests);
  const reservations = useStore((s) => s.reservations);
  const allCharges = useStore((s) => s.charges);
  const allPayments = useStore((s) => s.payments);
  const groupBlocks = useStore((s) => s.groupBlocks);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const guestId = searchParams.get("guest") || undefined;
  const tabParam = searchParams.get("tab") as TabKey | null;

  const [tab, setTab] = useState<TabKey>(tabParam && tabs.some((t) => t.key === tabParam) ? tabParam : "in-house");
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("All");

  const handleTabChange = (t: TabKey) => {
    setTab(t);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", t);
      return next;
    });
  };

  const selectedGuest = guestId ? guests.find((g) => g.id === guestId) : null;

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (tierFilter !== "All" && g.tier !== tierFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        g.fullName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.includes(q) ||
        g.idNumber.toLowerCase().includes(q)
      );
    });
  }, [guests, query, tierFilter]);

  const getGuestReservations = (guest: Guest) =>
    reservations.filter((r) => r.guestEmail === guest.email && r.guestPhone === guest.phone);

  const getLastStay = (guest: Guest) => {
    const res = getGuestReservations(guest);
    if (res.length === 0) return null;
    return res.sort((a, b) => b.checkIn.localeCompare(a.checkIn))[0];
  };

  if (selectedGuest) {
    return (
      <GuestDetail
        guest={selectedGuest}
        onBack={() => navigate("/guests")}
      />
    );
  }
  if (guestId === "new") {
    return (
      <NewGuestForm onBack={() => navigate("/guests")} />
    );
  }

  const counts = {
    "in-house": reservations.filter((r) => r.status === "checked_in").length,
    "checked-out": reservations.filter((r) => r.status === "checked_out").length,
    "no-show": reservations.filter((r) => r.status === "no_show").length,
    "group-blocks": groupBlocks.length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Guests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "profiles"
              ? `${guests.length} guest profiles on record.`
              : `${counts[tab]} guest${counts[tab] !== 1 ? "s" : ""} currently`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition",
              tab === t.key
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.key !== "profiles" && (
              <span className="inline-flex items-center justify-center rounded-full bg-muted-foreground/10 px-1.5 py-0 text-[10px] font-semibold">
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "profiles" && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, phone, or ID&#8230;"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <SelectValue placeholder="All tiers" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All" className="rounded-lg">All tiers</SelectItem>
                <SelectItem value="Platinum" className="rounded-lg">Platinum</SelectItem>
                <SelectItem value="Gold" className="rounded-lg">Gold</SelectItem>
                <SelectItem value="Silver" className="rounded-lg">Silver</SelectItem>
                <SelectItem value="Bronze" className="rounded-lg">Bronze</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((guest, idx) => {
              const guestReservations = getGuestReservations(guest);
              const lastStay = getLastStay(guest);
              const activeRes = guestReservations.find(
                (r) => r.status === "checked_in" || r.status === "confirmed",
              );

              return (
                <div
                  key={guest.id}
                  className="group rounded-xl border border-border bg-card transition hover:shadow-md hover:border-primary/20"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white",
                            guestAccents[idx % guestAccents.length],
                          )}
                        >
                          {guest.fullName
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                          <div>
                          <h3 className="font-semibold text-foreground">{guest.fullName}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground/60 font-mono">{guest.id}</span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                tierStyles[guest.tier],
                              )}
                            >
                              <Award className="h-3 w-3" />
                              {guest.tier}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{guest.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{guest.phone}</span>
                      </div>
                      {guest.nationality && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{guest.nationality}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                      <div className="text-center">
                        <div className="font-bold text-foreground">{guest.totalVisits}</div>
                        <div className="text-muted-foreground">Visits</div>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="text-center">
                        <div className="font-bold text-foreground">{fmtUGX(guest.totalRevenue)}</div>
                        <div className="text-muted-foreground">Revenue</div>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="text-center">
                        <div className="font-bold text-foreground">{guestReservations.length}</div>
                        <div className="text-muted-foreground">Bookings</div>
                      </div>
                    </div>

                    {lastStay && (
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Last stay: {lastStay.checkIn} &rarr; {lastStay.checkOut}
                      </p>
                    )}

                    {(() => {
                      const groupRes = guestReservations.find((r) => r.groupBlockId);
                      if (!groupRes) return null;
                      const block = groupBlockById(groupRes.groupBlockId!);
                      if (!block) return null;
                      return (
                        <Link
                          to={`/groups/${block.id}`}
                          className="mt-2 inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
                        >
                          <Users className="h-3 w-3" />
                          {block.groupName}
                        </Link>
                      );
                    })()}

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/guests?guest=${guest.id}`)}
                        className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition"
                      >
                        View Profile
                      </button>
                      <Link
                        to="/reservations/new"
                        className={cn(
                          "flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition",
                          activeRes
                            ? "border border-success/30 text-success bg-success/10 hover:bg-success/20"
                            : "bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                      >
                        {activeRes ? (
                          <>
                            <CalendarCheck2 className="h-3.5 w-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            New Booking
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                No guests match your search.
              </div>
            )}
          </div>
        </>
      )}

      {tab === "group-blocks" && (
        <GroupBlocksView
          groupBlocks={groupBlocks}
          reservations={reservations}
          guests={guests}
          navigate={navigate}
        />
      )}

      {(tab === "in-house" || tab === "checked-out" || tab === "no-show") && (
        <ReservationStatusList
          status={tab === "in-house" ? "checked_in" : tab === "checked-out" ? "checked_out" : "no_show"}
          showCheckOut={tab === "in-house"}
        />
      )}
    </div>
  );
}

function ReservationStatusList({
  status,
  showCheckOut,
}: {
  status: "checked_in" | "checked_out" | "no_show";
  showCheckOut: boolean;
}) {
  const reservations = useStore((s) => s.reservations);
  const allCharges = useStore((s) => s.charges);
  const allPayments = useStore((s) => s.payments);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [recordPayment, setRecordPayment] = useState<{
    reservationId: string;
    folioId: string;
  } | null>(null);

  const filtered = useMemo(
    () =>
      reservations
        .filter((r) => r.status === status)
        .filter((r) => !query || r.guestName.toLowerCase().includes(query.toLowerCase())),
    [reservations, status, query],
  );

  const statusLabel =
    status === "checked_in" ? "In House" : status === "checked_out" ? "Checked Out" : "No-Show";

  return (
    <>
      <div className="relative mb-6" role="search">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder={`Search ${statusLabel.toLowerCase()} guests by name\u2026`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          aria-label={`Search ${statusLabel} guests by name`}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-muted-foreground">No {statusLabel.toLowerCase()} guests</h3>
          <p className="mt-1 text-sm text-muted-foreground/60">
            {query ? "No guests match your search." : `There are no ${statusLabel.toLowerCase()} guests at the moment.`}
          </p>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <X className="h-4 w-4" /> Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3" role="list" aria-label={`${statusLabel} guests list`}>
          {filtered.map((res) => {
            const rt = roomTypeById(res.roomTypeId);
            const room = roomById(res.roomId);
            const nights = nightsBetween(res.checkIn, res.checkOut);
            const isOpen = selected === res.id;
            const folio = res.folioId ? folioById(res.folioId) : null;
            const balance = res.folioId ? folioBalance(res.folioId) : 0;
            const folioCharges = folio ? allCharges.filter((c) => c.folioId === folio.id && !c.voided) : [];
            const folioPayments = folio ? allPayments.filter((p) => p.folioId === folio.id) : [];
            const totalCharges = folioCharges.reduce((s, c) => s + c.amount, 0);
            const totalPayments = folioPayments.filter((p) => p.status === "confirmed").reduce((s, p) => s + p.amount, 0);
            const activeCards = res.id ? activeKeyCardsByReservation(res.id) : [];

            return (
              <div
                key={res.id}
                className={cn(
                  "rounded-xl border bg-card transition-all",
                  isOpen ? "border-primary/40 shadow-md" : "border-border shadow-sm hover:border-primary/20 hover:shadow-md",
                )}
                role="listitem"
              >
                <button
                  onClick={() => setSelected(isOpen ? null : res.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`details-${res.id}`}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      status === "checked_in"
                        ? "bg-success/10 text-success"
                        : status === "checked_out"
                          ? "bg-muted/50 text-muted-foreground"
                          : "bg-warning/10 text-warning",
                    )}
                  >
                    <User className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{res.guestName}</span>
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                          status === "checked_in"
                            ? "border-success/30 bg-success/10 text-success"
                            : status === "checked_out"
                              ? "border-muted-foreground/30 bg-muted/20 text-muted-foreground"
                              : "border-warning/30 bg-warning/10 text-warning",
                        )}
                      >
                        {statusLabel}
                      </span>
                      {status === "checked_in" && balance > 0 && (
                        <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium", res.corporateAccountId || res.billingArrangement === "city_ledger" ? "border-info/30 bg-info/10 text-info" : "border-destructive/30 bg-destructive/10 text-destructive")}>
                          {res.corporateAccountId || res.billingArrangement === "city_ledger" ? "Company bill" : `${fmtUGX(balance)} due`}
                        </span>
                      )}
                      {status === "checked_in" && balance === 0 && (
                        <span className="rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                          Paid
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>#{res.id}</span>
                      <span>{rt?.name ?? res.roomTypeId}</span>
                      {room && <span>Room {room.id} &middot; Floor {room.floor}</span>}
                      {res.groupBlockId && (() => {
                        const block = groupBlockById(res.groupBlockId!);
                        return block ? (
                          <Link to={`/groups/${block.id}`} className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10">
                            <Users className="h-2.5 w-2.5" />
                            {block.groupName}
                          </Link>
                        ) : null;
                      })()}
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
                    {status === "checked_in" && (
                      <div className={cn("text-sm font-semibold tabular-nums", balance > 0 ? "text-destructive" : "text-success")}>
                        {fmtUGX(balance)}
                      </div>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div id={`details-${res.id}`} className="border-t border-border">
                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-background">
                        <div className="border-b border-border px-4 py-2.5">
                          <h4 className="text-xs font-semibold text-muted-foreground">Charges</h4>
                        </div>
                        {folioCharges.length === 0 ? (
                          <p className="px-4 py-6 text-center text-xs text-muted-foreground">No charges.</p>
                        ) : (
                          <ul className="divide-y divide-border">
                            {folioCharges.map((c) => (
                              <li key={c.id} className="flex items-center justify-between px-4 py-2">
                                <div>
                                  <p className="text-xs font-medium">{c.description}</p>
                                  <p className="text-[10px] text-muted-foreground">{CHARGE_TYPE_LABEL[c.type]} &middot; {c.date}</p>
                                </div>
                                <span className="text-xs font-semibold tabular-nums">{fmtUGX(c.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex justify-between border-t border-border px-4 py-2.5 text-xs font-semibold">
                          <span className="text-muted-foreground">Total</span>
                          <span>{fmtUGX(totalCharges)}</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-background">
                        <div className="border-b border-border px-4 py-2.5">
                          <h4 className="text-xs font-semibold text-muted-foreground">Payments</h4>
                        </div>
                        {folioPayments.length === 0 ? (
                          <p className="px-4 py-6 text-center text-xs text-muted-foreground">No payments.</p>
                        ) : (
                          <ul className="divide-y divide-border">
                            {folioPayments.map((p) => (
                              <li key={p.id} className="flex items-center justify-between px-4 py-2">
                                <div>
                                  <p className="text-xs font-medium">{PAYMENT_METHOD_LABEL[p.method]}</p>
                                  <p className="text-[10px] text-muted-foreground">{p.reference ?? "\u2014"}</p>
                                </div>
                                <span className="text-xs font-semibold tabular-nums text-success">&minus;{fmtUGX(p.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex justify-between border-t border-border px-4 py-2.5 text-xs font-semibold">
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-success">{fmtUGX(totalPayments)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border px-5 py-4">
                      <div className="flex items-center gap-2">
                        {status === "checked_in" && (
                          <>
                            <span className={cn("text-lg font-bold", balance > 0 ? "text-destructive" : "text-success")}>
                              {fmtUGX(balance)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {balance > 0 ? "outstanding" : "balance cleared"}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {res.folioId && (
                          <Link
                            to={"/billing?folio=" + res.folioId}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                          >
                            Full folio
                          </Link>
                        )}
                        {showCheckOut && balance > 0 && (
                          <button
                            onClick={() =>
                              setRecordPayment({
                                reservationId: res.id,
                                folioId: res.folioId ?? "",
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                          >
                            <CreditCard className="h-4 w-4" /> Record payment
                          </button>
                        )}
                        {showCheckOut && (
                          <CheckOutButton
                            reservation={res}
                            onCheckedOut={() => setSelected(null)}
                          />
                        )}
                      </div>
                    </div>

                    {status === "checked_in" && activeCards.length > 0 && (
                      <div className="border-t border-border px-5 py-3">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Key className="h-3.5 w-3.5" />
                          <span>
                            {activeCards.length} active key card{activeCards.length > 1 ? "s" : ""} &mdash;
                            will be deactivated on check-out
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {recordPayment && (
        <RecordPaymentDialog
          reservationId={recordPayment.reservationId}
          folioId={recordPayment.folioId}
          onClose={() => setRecordPayment(null)}
        />
      )}
    </>
  );
}

function CheckOutButton({
  reservation,
  onCheckedOut,
}: {
  reservation: Reservation;
  onCheckedOut: () => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState(false);
  const [checkedOutRes, setCheckedOutRes] = useState<{ id: string; name: string; folioId?: string } | null>(null);
  const folios = useStore((s) => s.folios);

  const handleConfirmCheckout = (transferToDebtors: boolean) => {
    setCheckoutTarget(false);
    if (transferToDebtors) {
      const sourceFolio = folios.find((f) => f.reservationId === reservation.id);
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
    const r = checkOut(reservation.id);
    if (r.ok) {
      const res = reservationById(reservation.id);
      setCheckedOutRes({ id: reservation.id, name: res?.guestName ?? "\u2014", folioId: res?.folioId });
      if (r.postStay) {
        toast.warning(
          transferToDebtors
            ? "Guest checked out. Balance transferred to Debtors Account — Finance to follow up."
            : `Guest checked out. Outstanding balance of ${fmtUGX(r.balance ?? 0)} remains. Collect payment from guest.`,
        );
      } else {
        toast.success(`${res?.guestName} checked out successfully.`);
      }
      onCheckedOut();
      setShowFeedback(true);
    } else {
      toast.error(r.error);
    }
  };

  return (
    <>
      <button
        onClick={() => setCheckoutTarget(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        <LogOut className="h-4 w-4" /> Check Out
      </button>

      {checkoutTarget && (
        <CheckoutConfirmationDialog
          reservation={reservation}
          onConfirm={handleConfirmCheckout}
          onClose={() => setCheckoutTarget(false)}
        />
      )}

      {showFeedback && checkedOutRes && (
        <FeedbackDialog
          reservationId={checkedOutRes.id}
          folioId={checkedOutRes.folioId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </>
  );
}

function FeedbackDialog({
  reservationId,
  folioId,
  onClose,
}: {
  reservationId: string;
  folioId?: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success("Thank you for your feedback!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        {!submitted ? (
          <>
            <div className="mb-4 text-center">
              <Star className="mx-auto h-10 w-10 text-amber-500" />
              <h3 className="mt-2 text-lg font-semibold">How was your stay?</h3>
              <p className="text-xs text-muted-foreground">
                We&apos;d love your feedback to help us improve.
              </p>
            </div>
            <div className="mb-4 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hover || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setSubmitted(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Star className="h-4 w-4" /> Submit feedback
              </button>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h3 className="mt-3 text-lg font-semibold">Thank you!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {rating > 0
                ? `You rated your stay ${rating}/5. We appreciate your feedback.`
                : "We hope you enjoyed your stay!"}
            </p>
            {folioId && (
              <Link
                to={`/billing?invoice=${folioId}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                <Receipt className="h-4 w-4" /> View invoice
              </Link>
            )}
            <button
              onClick={onClose}
              className="mt-2 block w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GuestDetail({ guest, onBack }: { guest: Guest; onBack: () => void }) {
  const reservations = useStore((s) => s.reservations);
  const folios = useStore((s) => s.folios);
  const guestReservations = reservations.filter(
    (r) => r.guestEmail === guest.email && r.guestPhone === guest.phone,
  );
  const latestFolioId = useMemo(() => {
    const latest = guestReservations
      .filter((r) => r.folioId)
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn))[0];
    return latest ? folios.find((f) => f.id === latest.folioId)?.id : undefined;
  }, [guestReservations, folios]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to guests
      </button>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br text-lg font-bold text-white",
                guestAccents[parseInt(guest.id.replace("GUE-", ""), 10) % guestAccents.length],
              )}
            >
              {guest.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">{guest.fullName}</h2>
              <div className="text-[11px] font-mono text-muted-foreground/60">{guest.id}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {guest.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {guest.phone}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {guest.nationality}
                </span>
              </div>
            </div>
          </div>
          <span
            className={cn(
              "rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
              tierStyles[guest.tier],
            )}
          >
            <Award className="mr-1 inline h-3 w-3" />
            {guest.tier}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30 p-3 text-center">
            <div
              className="absolute left-0 top-0 h-full w-[3px]"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 0 10px var(--color-primary)",
              }}
            />
            <div className="font-bold text-foreground">{guest.totalVisits}</div>
            <div className="text-[11px] text-muted-foreground">Visits</div>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30 p-3 text-center">
            <div
              className="absolute left-0 top-0 h-full w-[3px]"
              style={{
                background: "var(--color-success)",
                boxShadow: "0 0 10px var(--color-success)",
              }}
            />
            <div className="font-bold text-foreground">{fmtUGX(guest.totalRevenue)}</div>
            <div className="text-[11px] text-muted-foreground">Revenue</div>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30 p-3 text-center">
            <div
              className="absolute left-0 top-0 h-full w-[3px]"
              style={{ background: "var(--color-info)", boxShadow: "0 0 10px var(--color-info)" }}
            />
            <div className="font-bold text-foreground">{guestReservations.length}</div>
            <div className="text-[11px] text-muted-foreground">Bookings</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-4 text-sm">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Date of Birth
            </span>
            <p className="mt-0.5 font-medium">{guest.dateOfBirth || "\u2014"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Gender
            </span>
            <p className="mt-0.5 font-medium">{guest.gender || "\u2014"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Company
            </span>
            <p className="mt-0.5 font-medium">{guest.company || "\u2014"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              ID Type / Number
            </span>
            <p className="mt-0.5 font-medium">
              {guest.idType}: {guest.idNumber}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Discount Rate
            </span>
            <p className="mt-0.5 font-medium">
              {guest.discountRate ? `${guest.discountRate}%` : "\u2014"}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Credit Limit
            </span>
            <p className="mt-0.5 font-medium">
              {guest.creditLimit ? fmtUGX(guest.creditLimit) : "\u2014"}
            </p>
          </div>
          {guest.notes && (
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Notes
              </span>
              <p className="mt-0.5 font-medium text-muted-foreground">{guest.notes}</p>
            </div>
          )}
        </div>

        {guestReservations.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold">Booking History</h3>
            <div className="space-y-2">
              {guestReservations
                .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {r.checkIn} &rarr; {r.checkOut}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {r.roomId ? `Room ${r.roomId}` : ""}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase",
                        r.status === "checked_in"
                          ? "text-success"
                          : r.status === "confirmed"
                            ? "text-warning"
                            : "text-muted-foreground",
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2">
          <Link
            to="/reservations/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> New Booking
          </Link>
          {latestFolioId ? (
            <Link
              to={`/billing?folio=${latestFolioId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <Receipt className="h-3.5 w-3.5" /> View Folio
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GroupBlocksView({
  groupBlocks,
  reservations,
  guests,
  navigate,
}: {
  groupBlocks: GroupBlock[];
  reservations: Reservation[];
  guests: Guest[];
  navigate: (path: string) => void;
}) {
  const blocksWithStats = useMemo(
    () =>
      [...groupBlocks]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((block) => {
          const blockReservations = reservations.filter(
            (r) => r.groupBlockId === block.id,
          );
          const blockGuests = blockReservations
            .map((r) => guests.find((g) => g.email === r.guestEmail && g.phone === r.guestPhone))
            .filter((g): g is Guest => g !== undefined)
            .filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i);
          return { ...block, blockReservations, blockGuests };
        }),
    [groupBlocks, reservations, guests],
  );

  const statusBadge: Record<string, string> = {
    active: "bg-success/15 text-success border-success/30",
    confirmed: "bg-info/15 text-info border-info/30",
    closed: "bg-muted/40 text-muted-foreground border-border/40",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  };

  if (blocksWithStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold text-muted-foreground">No group blocks</h3>
        <p className="mt-1 text-sm text-muted-foreground/60">
          No group or convention bookings exist yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {blocksWithStats.map((block) => (
        <div
          key={block.id}
          className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:border-border/80 hover:shadow-lg cursor-pointer"
          onClick={() => navigate(`/groups/${block.id}`)}
        >
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-400 to-purple-600" />
          <div className="p-5 pl-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{block.groupName}</span>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      statusBadge[effectiveStatus(block)],
                    )}
                  >
                    {effectiveStatus(block)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {block.startDate} &rarr; {block.endDate}
                  </span>
                  {block.organiserName && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {block.organiserName}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground">Reservations</div>
                  <div className="text-lg font-bold tabular-nums">{block.blockReservations.length}</div>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-card/40 text-muted-foreground/30 transition-all group-hover:border-primary/30 group-hover:text-primary">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>

            {block.blockGuests.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="grid gap-2">
                  {block.blockGuests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 transition hover:bg-muted/40"
                      onClick={(e) => { e.stopPropagation(); navigate(`/guests?guest=${guest.id}`); }}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-[11px] font-bold text-white">
                        {guest.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{guest.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{guest.email} &middot; {guest.phone}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{guest.tier}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NewGuestForm({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to guests
      </button>
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Guest creation form coming soon.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          You can add a guest during the reservation process.
        </p>
      </div>
    </div>
  );
}
