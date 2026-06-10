import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, MoreHorizontal, Plus, Search, LogIn, LogOut, Eye, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/reservations")({
  head: () => ({ meta: [{ title: "Reservations — Jambo ERP" }] }),
  component: ReservationsLayout,
});

function ReservationsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/reservations") return <Outlet />;
  return <ReservationsPage />;
}

type Status = "Open" | "Checked In" | "Checked Out" | "Cancelled";

const rows: {
  id: string;
  guest: string;
  email: string;
  room: string;
  type: string;
  in: string;
  out: string;
  nights: number;
  status: Status;
  amount: string;
  source: string;
}[] = [
  {
    id: "RSV-4821",
    guest: "Sarah Nakato",
    email: "sarah@example.com",
    room: "Deluxe 304",
    type: "Deluxe",
    in: "Jun 10",
    out: "Jun 14",
    nights: 4,
    status: "Open",
    amount: "UGX 1,200,000",
    source: "Direct",
  },
  {
    id: "RSV-4822",
    guest: "James Okello",
    email: "j.okello@example.com",
    room: "Suite 501",
    type: "Suite",
    in: "Jun 10",
    out: "Jun 13",
    nights: 3,
    status: "Checked In",
    amount: "UGX 3,400,000",
    source: "Booking.com",
  },
  {
    id: "RSV-4823",
    guest: "Priya Sharma",
    email: "priya@example.in",
    room: "Standard 212",
    type: "Standard",
    in: "Jun 11",
    out: "Jun 15",
    nights: 4,
    status: "Open",
    amount: "UGX 980,000",
    source: "Expedia",
  },
  {
    id: "RSV-4824",
    guest: "David Mensah",
    email: "d.mensah@example.com",
    room: "Deluxe 308",
    type: "Deluxe",
    in: "Jun 12",
    out: "Jun 18",
    nights: 6,
    status: "Open",
    amount: "UGX 2,100,000",
    source: "Direct",
  },
  {
    id: "RSV-4825",
    guest: "Aisha Wanjiku",
    email: "aisha.w@example.com",
    room: "Suite 502",
    type: "Suite",
    in: "Jun 12",
    out: "Jun 16",
    nights: 4,
    status: "Checked In",
    amount: "UGX 4,600,000",
    source: "Corporate",
  },
  {
    id: "RSV-4826",
    guest: "Mark Tindyebwa",
    email: "mark.t@example.com",
    room: "Standard 108",
    type: "Standard",
    in: "Jun 13",
    out: "Jun 14",
    nights: 1,
    status: "Cancelled",
    amount: "UGX 280,000",
    source: "Direct",
  },
  {
    id: "RSV-4827",
    guest: "Linda Asiimwe",
    email: "linda@example.com",
    room: "Deluxe 311",
    type: "Deluxe",
    in: "Jun 14",
    out: "Jun 20",
    nights: 6,
    status: "Open",
    amount: "UGX 2,520,000",
    source: "Direct",
  },
  {
    id: "RSV-4828",
    guest: "Kwame Boateng",
    email: "k.boateng@example.com",
    room: "Suite 503",
    type: "Suite",
    in: "Jun 08",
    out: "Jun 10",
    nights: 2,
    status: "Checked Out",
    amount: "UGX 2,200,000",
    source: "Booking.com",
  },
  {
    id: "RSV-4829",
    guest: "Maria Lopez",
    email: "maria@example.com",
    room: "Standard 217",
    type: "Standard",
    in: "Jun 09",
    out: "Jun 11",
    nights: 2,
    status: "Checked Out",
    amount: "UGX 560,000",
    source: "Expedia",
  },
];

const statusStyles: Record<Status, string> = {
  Open: "bg-info/15 text-info border-info/30",
  "Checked In": "bg-success/15 text-success border-success/30",
  "Checked Out": "bg-muted/40 text-muted-foreground border-border/40",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const tabs = ["All", "Open", "Checked In", "Checked Out", "Cancelled"] as const;
type Tab = (typeof tabs)[number];

function ReservationsPage() {
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [roomType, setRoomType] = useState<string>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab !== "All" && r.status !== tab) return false;
      if (roomType !== "All" && r.type !== roomType) return false;
      if (
        query &&
        !`${r.guest} ${r.id} ${r.email} ${r.room}`.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [tab, query, roomType]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows.length };
    tabs.forEach((t) => t !== "All" && (c[t] = rows.filter((r) => r.status === t).length));
    return c;
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Reservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage bookings across all channels.</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Today", value: "12" },
          { label: "Arriving", value: "27" },
          { label: "Departing", value: "19" },
          { label: "In-house", value: "142" },
        ].map((s) => (
          <div key={s.label} className="glass card-hover rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="glass flex flex-wrap items-center gap-1 rounded-2xl p-1.5">
        {tabs.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative rounded-xl px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-primary/25 to-primary/10 text-foreground shadow-inner"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              <span
                className={cn(
                  "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-primary/30 text-primary" : "bg-muted/50 text-muted-foreground",
                )}
              >
                {counts[t]}
              </span>
              {active && (
                <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by guest, reservation ID, room, email…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-transparent text-foreground outline-none"
            />
            <span className="text-muted-foreground">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-transparent text-foreground outline-none"
            />
          </div>

          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            {["All", "Standard", "Deluxe", "Suite"].map((t) => (
              <option key={t} value={t} className="bg-card">
                {t === "All" ? "All room types" : t}
              </option>
            ))}
          </select>

          <button className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> More filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="group border-b border-border/30 transition hover:bg-card/40"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/50 to-success/50 text-xs font-semibold text-primary-foreground ring-1 ring-border/60">
                        {r.guest
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-medium">{r.guest}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.room}</div>
                    <div className="text-xs text-muted-foreground">{r.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {r.in} → {r.out}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.nights} night{r.nights !== 1 && "s"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.source}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        statusStyles[r.status],
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{r.amount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                      <RowBtn icon={Eye} label="View" />
                      {r.status === "Open" && (
                        <RowBtn icon={LogIn} label="Check in" tone="success" />
                      )}
                      {r.status === "Checked In" && (
                        <RowBtn icon={LogOut} label="Check out" tone="warning" />
                      )}
                      <RowBtn icon={MoreHorizontal} label="More" />
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Floating New Reservation FAB */}
      <Link
        to="/reservations/new"
        className="group fixed bottom-8 right-8 z-30 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-[oklch(0.78_0.20_75)] to-success px-5 py-4 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/40 transition-all hover:scale-105 hover:shadow-primary/60 animate-pulse-glow"
      >
        <span className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-primary/40 blur-xl" />
        <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
        New Reservation
      </Link>
    </div>
  );
}

function RowBtn({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "success" | "warning";
}) {
  return (
    <button
      title={label}
      aria-label={label}
      className={cn(
        "rounded-lg border border-border/50 bg-card/40 p-1.5 text-muted-foreground transition hover:text-foreground",
        tone === "success" && "hover:border-success/40 hover:bg-success/10 hover:text-success",
        tone === "warning" && "hover:border-warning/40 hover:bg-warning/10 hover:text-warning",
        !tone && "hover:border-primary/40",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
