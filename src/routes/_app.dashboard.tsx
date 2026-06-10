import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  CalendarCheck2,
  DollarSign,
  Users,
  Sparkles,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Jambo ERP" }],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Today's Revenue", value: "UGX 18.4M", delta: "+12.4%", up: true, icon: DollarSign, accent: "from-[oklch(0.72_0.16_162)] to-[oklch(0.65_0.18_180)]" },
  { label: "Occupancy", value: "84%", delta: "+3.1%", up: true, icon: BedDouble, accent: "from-[oklch(0.68_0.18_258)] to-[oklch(0.6_0.2_220)]" },
  { label: "Arrivals Today", value: "27", delta: "+6", up: true, icon: CalendarCheck2, accent: "from-[oklch(0.78_0.16_75)] to-[oklch(0.7_0.18_50)]" },
  { label: "In-house Guests", value: "142", delta: "-4", up: false, icon: Users, accent: "from-[oklch(0.65_0.2_295)] to-[oklch(0.6_0.22_320)]" },
];

const reservations = [
  { name: "Sarah Nakato", room: "Deluxe 304", in: "Today", out: "Jun 14", status: "Confirmed", amount: "UGX 1.2M" },
  { name: "James Okello", room: "Suite 501", in: "Today", out: "Jun 13", status: "Checked-in", amount: "UGX 3.4M" },
  { name: "Priya Sharma", room: "Standard 212", in: "Jun 11", out: "Jun 15", status: "Pending", amount: "UGX 980K" },
  { name: "David Mensah", room: "Deluxe 308", in: "Jun 12", out: "Jun 18", status: "Confirmed", amount: "UGX 2.1M" },
  { name: "Aisha Wanjiku", room: "Suite 502", in: "Jun 12", out: "Jun 16", status: "Checked-in", amount: "UGX 4.6M" },
];

const statusStyles: Record<string, string> = {
  Confirmed: "bg-info/15 text-info border-info/30",
  "Checked-in": "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
};

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, Amani 👋</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Property Overview
          </h1>
        </div>
        <div className="glass inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Last sync</span>
          <span className="font-medium">2 min ago</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass card-hover relative overflow-hidden rounded-2xl p-5">
              <div
                className={cn(
                  "absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl",
                  "bg-gradient-to-br",
                  s.accent,
                )}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-primary-foreground", s.accent)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      s.up ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive",
                    )}
                  >
                    {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {s.delta}
                  </span>
                </div>
                <div className="mt-5">
                  <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="glass card-hover rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Revenue · Last 14 days</h3>
              <p className="text-xs text-muted-foreground">Rooms + F&amp;B combined</p>
            </div>
            <div className="flex gap-1 rounded-lg border border-border/60 bg-card/40 p-1 text-xs">
              {["7D", "14D", "30D"].map((t, i) => (
                <button
                  key={t}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition",
                    i === 1 ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <SparkChart />
        </div>

        {/* Room status */}
        <div className="glass card-hover rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold">Room Status</h3>
          <p className="text-xs text-muted-foreground">Live · 168 rooms</p>

          <div className="mt-6 space-y-4">
            {[
              { label: "Occupied", value: 142, total: 168, color: "oklch(0.68 0.18 258)" },
              { label: "Available", value: 18, total: 168, color: "oklch(0.72 0.16 162)" },
              { label: "Out of Service", value: 5, total: 168, color: "oklch(0.78 0.16 75)" },
              { label: "Dirty", value: 3, total: 168, color: "oklch(0.65 0.22 25)" },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold">{r.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(r.value / r.total) * 100}%`,
                      background: `linear-gradient(90deg, ${r.color}, color-mix(in oklab, ${r.color} 60%, white))`,
                      boxShadow: `0 0 18px ${r.color}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reservations */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Upcoming Reservations</h3>
            <p className="text-xs text-muted-foreground">Next 48 hours</p>
          </div>
          <button className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground">
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-3 font-medium">Guest</th>
                <th className="px-3 py-3 font-medium">Room</th>
                <th className="px-3 py-3 font-medium">Check in</th>
                <th className="px-3 py-3 font-medium">Check out</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.name} className="border-b border-border/30 transition hover:bg-card/40">
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-[oklch(0.72_0.16_162)]/40 text-xs font-semibold">
                        {r.name.split(" ").map((p) => p[0]).join("")}
                      </div>
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{r.room}</td>
                  <td className="px-3 py-4 text-muted-foreground">{r.in}</td>
                  <td className="px-3 py-4 text-muted-foreground">{r.out}</td>
                  <td className="px-3 py-4">
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium", statusStyles[r.status])}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right font-semibold">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass card-hover rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.72_0.16_162)] to-[oklch(0.6_0.18_180)]">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold">Housekeeping</h3>
              <p className="text-xs text-muted-foreground">5 tasks awaiting</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { room: "Room 204", task: "Turnover after checkout", time: "11:30" },
              { room: "Room 308", task: "Deep clean", time: "12:00" },
              { room: "Suite 502", task: "Restock minibar", time: "13:15" },
            ].map((t) => (
              <li key={t.room} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-3 transition hover:border-primary/40">
                <div>
                  <div className="font-medium">{t.room}</div>
                  <div className="text-xs text-muted-foreground">{t.task}</div>
                </div>
                <span className="text-xs text-muted-foreground">{t.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass card-hover rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold">Today's Activity</h3>
          <p className="text-xs text-muted-foreground">Real-time front desk feed</p>
          <ul className="mt-5 space-y-4 text-sm">
            {[
              { who: "James Okello", what: "checked into Suite 501", when: "2m ago", color: "bg-success" },
              { who: "Maria Lopez", what: "made a payment of UGX 1.4M", when: "14m ago", color: "bg-primary" },
              { who: "Aisha Wanjiku", what: "requested late checkout", when: "32m ago", color: "bg-warning" },
              { who: "Reservation #4821", what: "was cancelled", when: "1h ago", color: "bg-destructive" },
            ].map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full animate-pulse-glow", a.color)} />
                <div className="flex-1">
                  <p>
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{a.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SparkChart() {
  const values = [40, 55, 48, 62, 70, 58, 75, 82, 76, 88, 95, 84, 92, 110];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const w = 600;
  const h = 200;
  const step = w / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / (max - min)) * (h - 20) - 10;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div className="mt-6">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-56 w-full">
        <defs>
          <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.68 0.18 258)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(0.68 0.18 258)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.78 0.16 258)" />
            <stop offset="100%" stopColor="oklch(0.72 0.16 162)" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1="0" x2={w} y1={h * p} y2={h * p} stroke="oklch(1 0 0 / 0.05)" strokeDasharray="4 4" />
        ))}
        <path d={area} fill="url(#grad)" />
        <path d={path} fill="none" stroke="url(#line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="oklch(0.78 0.16 258)" />
        ))}
      </svg>
    </div>
  );
}
