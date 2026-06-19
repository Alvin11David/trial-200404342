import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Eye, CalendarDays, PartyPopper, MapPin, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/events/list")({
  head: () => ({ meta: [{ title: "Events List — Jambo ERP" }] }),
  component: EventsListPage,
});

type EventStatus = "Confirmed" | "Tentative" | "Cancelled";

type EventItem = {
  id: string;
  name: string;
  organisation: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  guests: number;
  status: EventStatus;
};

const events: EventItem[] = [
  {
    id: "evt-001",
    name: "Corporate Strategy Meeting",
    organisation: "Jambo Sphere Ltd",
    date: "Jun 12",
    startTime: "09:00",
    endTime: "12:00",
    venue: "Boardroom A",
    guests: 24,
    status: "Confirmed",
  },
  {
    id: "evt-002",
    name: "Wedding Reception",
    organisation: "Okello Family",
    date: "Jun 14",
    startTime: "14:00",
    endTime: "23:00",
    venue: "Grand Ballroom",
    guests: 250,
    status: "Confirmed",
  },
  {
    id: "evt-003",
    name: "Product Launch",
    organisation: "Tech Innovations Ltd",
    date: "Jun 18",
    startTime: "10:00",
    endTime: "16:00",
    venue: "Conference Hall B",
    guests: 80,
    status: "Tentative",
  },
  {
    id: "evt-004",
    name: "Annual General Meeting",
    organisation: "East African Hospitality Assoc.",
    date: "Jun 22",
    startTime: "08:00",
    endTime: "17:00",
    venue: "Grand Ballroom",
    guests: 300,
    status: "Confirmed",
  },
  {
    id: "evt-005",
    name: "Fashion Show",
    organisation: "Kampala Fashion Week",
    date: "Jun 28",
    startTime: "15:00",
    endTime: "21:00",
    venue: "Grand Ballroom",
    guests: 400,
    status: "Cancelled",
  },
  {
    id: "evt-006",
    name: "Birthday Party",
    organisation: "Private Client",
    date: "Jul 05",
    startTime: "18:00",
    endTime: "22:00",
    venue: "Terrace Garden",
    guests: 45,
    status: "Confirmed",
  },
  {
    id: "evt-007",
    name: "Team Building Workshop",
    organisation: "Uganda Breweries Ltd",
    date: "Jul 10",
    startTime: "09:00",
    endTime: "15:00",
    venue: "Conference Hall A",
    guests: 60,
    status: "Tentative",
  },
  {
    id: "evt-008",
    name: "Private Dinner",
    organisation: "Minister of Tourism",
    date: "Jul 08",
    startTime: "19:00",
    endTime: "22:00",
    venue: "VIP Lounge",
    guests: 12,
    status: "Confirmed",
  },
  {
    id: "evt-009",
    name: "Cocktail Reception",
    organisation: "Diplomatic Corps",
    date: "Jul 15",
    startTime: "17:00",
    endTime: "20:00",
    venue: "Rooftop Terrace",
    guests: 100,
    status: "Confirmed",
  },
  {
    id: "evt-010",
    name: "Conference: Future of Tourism",
    organisation: "Ministry of Tourism",
    date: "Jul 20",
    startTime: "08:00",
    endTime: "18:00",
    venue: "Grand Ballroom",
    guests: 500,
    status: "Tentative",
  },
];

const statusStyles: Record<EventStatus, string> = {
  Confirmed: "bg-success/15 text-success border-success/30",
  Tentative: "bg-warning/15 text-warning border-warning/30",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusColors: Record<EventStatus, string> = {
  Confirmed: "oklch(0.72 0.16 162)",
  Tentative: "oklch(0.78 0.16 75)",
  Cancelled: "oklch(0.65 0.22 25)",
};

function EventsListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "All">("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (statusFilter !== "All" && e.status !== statusFilter) return false;
        if (
          search &&
          !`${e.name} ${e.organisation} ${e.venue} ${e.id}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [search, statusFilter],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Events List</h1>
          <p className="mt-1 text-sm text-muted-foreground">All scheduled events and functions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </Link>
          <Link
            to="/events/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50"
          >
            <PartyPopper className="h-4 w-4" />
            New Event
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Events", value: String(events.length) },
          {
            label: "Confirmed",
            value: String(events.filter((e) => e.status === "Confirmed").length),
            tone: "success",
          },
          {
            label: "Tentative",
            value: String(events.filter((e) => e.status === "Tentative").length),
            tone: "warning",
          },
          {
            label: "Cancelled",
            value: String(events.filter((e) => e.status === "Cancelled").length),
            tone: "destructive",
          },
        ].map((s) => (
          <div key={s.label} className="glass card-hover rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div
              className={cn(
                "mt-1 text-2xl font-bold",
                s.tone === "success" && "text-success",
                s.tone === "warning" && "text-warning",
                s.tone === "destructive" && "text-destructive",
              )}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-xs">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-foreground outline-none w-28"
            />
            <span className="text-muted-foreground">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-foreground outline-none w-28"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EventStatus | "All")}>
            <SelectTrigger className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Tentative">Tentative</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Guests</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="group border-b border-border/30 transition hover:bg-card/40"
                >
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.organisation}</td>
                  <td className="px-4 py-3">{e.date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {e.startTime} → {e.endTime}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.venue}</td>
                  <td className="px-4 py-3 tabular-nums">{e.guests.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        statusStyles[e.status],
                      )}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                      <button
                        onClick={() => setDetailEvent(e)}
                        className="rounded-lg border border-border/50 bg-card/40 p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No events match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-xl font-bold">{detailEvent.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{detailEvent.organisation}</p>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  statusStyles[detailEvent.status],
                )}
              >
                {detailEvent.status}
              </span>
            </div>

            <div className="space-y-3 rounded-xl border border-border/50 bg-card/40 p-4">
              <DetailRow icon={CalendarDays} label="Date" value={detailEvent.date} />
              <DetailRow
                icon={Clock}
                label="Time"
                value={`${detailEvent.startTime} → ${detailEvent.endTime}`}
              />
              <DetailRow icon={MapPin} label="Venue" value={detailEvent.venue} />
              <DetailRow icon={Users} label="Guests" value={detailEvent.guests.toLocaleString()} />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setDetailEvent(null)}
                className="rounded-xl border border-border/60 bg-card/40 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground min-w-[48px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
