import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtUGX, useStore, type Guest } from "@/lib/pms-store";

export const Route = createFileRoute("/_app/guests")({
  head: () => ({ meta: [{ title: "Guests — Jambo PMS" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    guest: typeof search.guest === "string" ? search.guest : undefined,
  }),
  component: GuestsPage,
});

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

function GuestsPage() {
  const guests = useStore((s) => s.guests);
  const reservations = useStore((s) => s.reservations);
  const navigate = useNavigate();
  const { guest: guestId } = useSearch({ from: "/_app/guests" });

  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("All");

  const selectedGuest = guestId ? guests.find((g) => g.id === guestId) : null;

  if (selectedGuest) {
    return (
      <GuestDetail
        guest={selectedGuest}
        onBack={() => navigate({ to: "/guests", search: { guest: undefined } })}
      />
    );
  }
  if (guestId === "new") {
    return (
      <NewGuestForm onBack={() => navigate({ to: "/guests", search: { guest: undefined } })} />
    );
  }

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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Guests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {guests.length} guest profiles on record.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/guests", search: { guest: "new" } })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Guest
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone, or ID…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
        >
          <option value="All">All tiers</option>
          <option value="Platinum">Platinum</option>
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Bronze">Bronze</option>
        </select>
      </div>

      {/* Guest Cards */}
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
                    Last stay: {lastStay.checkIn} → {lastStay.checkOut}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => navigate({ to: "/guests", search: { guest: guest.id } })}
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
    </div>
  );
}

function GuestDetail({ guest, onBack }: { guest: Guest; onBack: () => void }) {
  const reservations = useStore((s) => s.reservations);
  const guestReservations = reservations.filter(
    (r) => r.guestEmail === guest.email && r.guestPhone === guest.phone,
  );

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
                guestAccents[parseInt(guest.id.replace("GST-", ""), 10) % guestAccents.length],
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
            <p className="mt-0.5 font-medium">{guest.dateOfBirth || "—"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Gender
            </span>
            <p className="mt-0.5 font-medium">{guest.gender || "—"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Company
            </span>
            <p className="mt-0.5 font-medium">{guest.company || "—"}</p>
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
              {guest.discountRate ? `${guest.discountRate}%` : "—"}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Credit Limit
            </span>
            <p className="mt-0.5 font-medium">
              {guest.creditLimit ? fmtUGX(guest.creditLimit) : "—"}
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
                        {r.checkIn} → {r.checkOut}
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
        </div>
      </div>
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
