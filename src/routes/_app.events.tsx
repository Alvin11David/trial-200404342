import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ListTodo,
  PartyPopper,
  MapPin,
  Users,
  Clock,
  X,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/events")({
  component: EventsLayout,
});

function EventsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/events") return <Outlet />;
  return <EventsCalendarPage />;
}

type EventStatus = "Confirmed" | "Tentative" | "Cancelled";

type CalendarEvent = {
  id: string;
  name: string;
  organisation: string;
  date: number; // day of month 1-31
  month: number; // 0-11
  year: number;
  startTime: string;
  endTime: string;
  venue: string;
  guests: number;
  status: EventStatus;
};

const events: CalendarEvent[] = [
  {
    id: "evt-001",
    name: "Corporate Strategy Meeting",
    organisation: "Jambo Sphere Ltd",
    date: 12,
    month: 5,
    year: 2026,
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
    date: 14,
    month: 5,
    year: 2026,
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
    date: 18,
    month: 5,
    year: 2026,
    startTime: "10:00",
    endTime: "16:00",
    venue: "Conference Hall B",
    guests: 80,
    status: "Tentative",
  },
  {
    id: "evt-004",
    name: "Birthday Party",
    organisation: "Private Client",
    date: 5,
    month: 6,
    year: 2026,
    startTime: "18:00",
    endTime: "22:00",
    venue: "Terrace Garden",
    guests: 45,
    status: "Confirmed",
  },
  {
    id: "evt-005",
    name: "Annual General Meeting",
    organisation: "East African Hospitality Assoc.",
    date: 22,
    month: 5,
    year: 2026,
    startTime: "08:00",
    endTime: "17:00",
    venue: "Grand Ballroom",
    guests: 300,
    status: "Confirmed",
  },
  {
    id: "evt-006",
    name: "Team Building Workshop",
    organisation: "Uganda Breweries Ltd",
    date: 10,
    month: 6,
    year: 2026,
    startTime: "09:00",
    endTime: "15:00",
    venue: "Conference Hall A",
    guests: 60,
    status: "Tentative",
  },
  {
    id: "evt-007",
    name: "Private Dinner",
    organisation: "Minister of Tourism",
    date: 8,
    month: 6,
    year: 2026,
    startTime: "19:00",
    endTime: "22:00",
    venue: "VIP Lounge",
    guests: 12,
    status: "Confirmed",
  },
  {
    id: "evt-008",
    name: "Fashion Show",
    organisation: "Kampala Fashion Week",
    date: 28,
    month: 5,
    year: 2026,
    startTime: "15:00",
    endTime: "21:00",
    venue: "Grand Ballroom",
    guests: 400,
    status: "Cancelled",
  },
  {
    id: "evt-009",
    name: "Cocktail Reception",
    organisation: "Diplomatic Corps",
    date: 15,
    month: 6,
    year: 2026,
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
    date: 20,
    month: 6,
    year: 2026,
    startTime: "08:00",
    endTime: "18:00",
    venue: "Grand Ballroom",
    guests: 500,
    status: "Tentative",
  },
];

const statusColors: Record<EventStatus, string> = {
  Confirmed: "oklch(0.72 0.16 162)",
  Tentative: "oklch(0.78 0.16 75)",
  Cancelled: "oklch(0.65 0.22 25)",
};

const statusBg: Record<EventStatus, string> = {
  Confirmed: "bg-success/15 text-success border-success/30",
  Tentative: "bg-warning/15 text-warning border-warning/30",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function EventsCalendarPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(5);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

  const monthEvents = useMemo(
    () => events.filter((e) => e.month === viewMonth && e.year === viewYear),
    [viewMonth, viewYear],
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const today = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Events Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly view of all events and functions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/events/list"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <ListTodo className="h-4 w-4" />
            Events List
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

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: statusColors.Confirmed }}
          />
          Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: statusColors.Tentative }}
          />
          Tentative
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: statusColors.Cancelled }}
          />
          Cancelled
        </span>
        <span className="text-muted-foreground/60">·</span>
        <span>
          {monthEvents.length} event{monthEvents.length !== 1 ? "s" : ""} this month
        </span>
      </div>

      {/* Calendar header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="font-display text-2xl font-bold">
            {months[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={nextMonth}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null)
              return <div key={`e-${i}`} className="min-h-[100px] rounded-xl bg-card/10" />;
            const dayEvents = monthEvents.filter((e) => e.date === day);
            const isToday = day === today && viewMonth === todayMonth && viewYear === todayYear;
            return (
              <div
                key={day}
                className={cn(
                  "min-h-[100px] rounded-xl border border-border/40 p-1.5 transition hover:border-primary/40",
                  isToday && "border-primary/60 bg-primary/5 shadow-inner",
                )}
              >
                <div
                  className={cn(
                    "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full rounded-md px-1.5 py-1 text-left text-[10px] font-medium leading-tight transition hover:brightness-110"
                      style={{
                        background: `${statusColors[ev.status]}20`,
                        color: statusColors[ev.status],
                      }}
                    >
                      <div className="truncate">{ev.name}</div>
                      <div className="opacity-70">{ev.startTime}</div>
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-xl font-bold">{selectedEvent.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedEvent.organisation}</p>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  statusBg[selectedEvent.status],
                )}
              >
                {selectedEvent.status}
              </span>
            </div>

            <div className="space-y-3 rounded-xl border border-border/50 bg-card/40 p-4">
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {months[selectedEvent.month]} {selectedEvent.date}, {selectedEvent.year}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {selectedEvent.startTime} → {selectedEvent.endTime}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{selectedEvent.venue}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{selectedEvent.guests.toLocaleString()} guests</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
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
