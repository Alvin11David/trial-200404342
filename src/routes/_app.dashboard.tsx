import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  CalendarCheck2,
  CalendarX2,
  DollarSign,
  DoorOpen,
  LogIn,
  LogOut,
  Plus,
  ShoppingBag,
  Sparkles,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Jambo ERP" }] }),
  component: Dashboard,
});

/* ───────────────────────── animated counter hook ───────────────────────── */
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  format = "default",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  format?: "default" | "compact";
}) {
  const v = useCountUp(value);
  const formatted =
    format === "compact"
      ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)
      : v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  return (
    <span className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ───────────────────────── stat data ───────────────────────── */
const totalRooms = 168;
const occupiedRooms = 142;
const expectedIn = 27;
const expectedOut = 19;
const revenueToday = 18_400_000;
const hkPending = 14;

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, Amani 👋</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Property <span className="text-gradient-primary">Command Center</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-muted-foreground">Live</span>
            <span className="font-medium">· synced 2m ago</span>
          </div>
          <div className="glass inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction icon={Plus} label="New Reservation" sub="Walk-in or call" tone="primary" />
        <QuickAction icon={LogIn} label="Check In" sub="Process arrival" tone="success" />
        <QuickAction icon={LogOut} label="Check Out" sub="Settle &amp; release" tone="warning" />
        <QuickAction icon={ShoppingBag} label="New POS Order" sub="F&amp;B and retail" tone="info" />
      </div>

      {/* Top stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Rooms"
          icon={DoorOpen}
          accent="from-[oklch(0.68_0.18_258)] to-[oklch(0.6_0.2_220)]"
          headline={
            <div className="flex items-center gap-3">
              <RingChart value={occupiedRooms} max={totalRooms} />
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  <AnimatedNumber value={totalRooms} />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {Math.round((occupiedRooms / totalRooms) * 100)}% occupancy
                </div>
              </div>
            </div>
          }
        />
        <StatCard
          label="Occupied Today"
          icon={BedDouble}
          delta="+8 vs yesterday"
          up
          accent="from-[oklch(0.72_0.16_162)] to-[oklch(0.65_0.18_180)]"
          headline={
            <div className="text-3xl font-bold">
              <AnimatedNumber value={occupiedRooms} />
              <span className="ml-1 text-sm font-medium text-muted-foreground">/ {totalRooms}</span>
            </div>
          }
        />
        <StatCard
          label="Expected Check-ins"
          icon={CalendarCheck2}
          delta="+6 vs yesterday"
          up
          accent="from-[oklch(0.78_0.16_75)] to-[oklch(0.7_0.18_50)]"
          headline={
            <div className="text-3xl font-bold">
              <AnimatedNumber value={expectedIn} />
            </div>
          }
        />
        <StatCard
          label="Expected Check-outs"
          icon={CalendarX2}
          delta="-3 vs yesterday"
          accent="from-[oklch(0.65_0.2_295)] to-[oklch(0.6_0.22_320)]"
          headline={
            <div className="text-3xl font-bold">
              <AnimatedNumber value={expectedOut} />
            </div>
          }
        />
        <StatCard
          label="Today's Revenue"
          icon={DollarSign}
          delta="+12.4%"
          up
          accent="from-[oklch(0.72_0.16_162)] to-[oklch(0.6_0.18_140)]"
          headline={
            <div>
              <div className="text-2xl font-bold">
                UGX <AnimatedNumber value={revenueToday} format="compact" />
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Rooms + POS + Events
              </div>
            </div>
          }
        />
        <StatCard
          label="HK Tasks Pending"
          icon={Sparkles}
          delta="3 high priority"
          accent="from-[oklch(0.78_0.16_75)] to-[oklch(0.65_0.22_25)]"
          headline={
            <div className="text-3xl font-bold">
              <AnimatedNumber value={hkPending} />
            </div>
          }
        />
      </div>

      {/* Middle: charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="glass card-hover rounded-2xl p-6 lg:col-span-3">
          <ChartHeader title="Live Occupancy" subtitle="Last 7 days · % occupied" />
          <OccupancyAreaChart />
        </div>
        <div className="glass card-hover rounded-2xl p-6 lg:col-span-2">
          <ChartHeader title="Revenue Breakdown" subtitle="This week · UGX millions" />
          <RevenueBarChart />
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
            <LegendDot color="oklch(0.68 0.18 258)" label="Rooms" />
            <LegendDot color="oklch(0.72 0.16 162)" label="POS / F&amp;B" />
            <LegendDot color="oklch(0.78 0.16 75)" label="Events" />
          </div>
        </div>
      </div>

      {/* Room status grid */}
      <div className="glass rounded-2xl p-6">
        <ChartHeader
          title="Room Status Grid"
          subtitle={`Live · ${totalRooms} rooms`}
          right={
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <LegendDot color="oklch(0.72 0.16 162)" label="Available" />
              <LegendDot color="oklch(0.68 0.18 258)" label="Occupied" />
              <LegendDot color="oklch(0.78 0.16 75)" label="Dirty" />
              <LegendDot color="oklch(0.65 0.22 25)" label="Maintenance" />
            </div>
          }
        />
        <RoomStatusGrid />
      </div>

      {/* Bottom: tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <ChartHeader
            title="Recent Check-ins"
            subtitle="Last 5 guests"
            right={
              <button className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground">
                View all
              </button>
            }
          />
          <GuestTable
            rows={[
              { name: "James Okello", room: "Suite 501", time: "10 min ago", tag: "VIP" },
              { name: "Aisha Wanjiku", room: "Suite 502", time: "42 min ago", tag: "Returning" },
              { name: "David Mensah", room: "Deluxe 308", time: "1h 12m ago" },
              { name: "Maria Lopez", room: "Standard 217", time: "2h 04m ago" },
              { name: "Kwame Boateng", room: "Deluxe 312", time: "3h 22m ago" },
            ]}
            icon={LogIn}
            tone="success"
          />
        </div>
        <div className="glass rounded-2xl p-6">
          <ChartHeader
            title="Upcoming Check-outs"
            subtitle="Next 5 guests"
            right={
              <button className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground">
                View all
              </button>
            }
          />
          <GuestTable
            rows={[
              { name: "Sarah Nakato", room: "Deluxe 304", time: "In 38 min", tag: "Late checkout" },
              { name: "Priya Sharma", room: "Standard 212", time: "In 1h 10m" },
              { name: "Linda Asiimwe", room: "Deluxe 311", time: "In 2h 25m" },
              { name: "Joseph Mugisha", room: "Standard 109", time: "In 3h 15m" },
              { name: "Fatuma Ahmed", room: "Suite 503", time: "Tomorrow 11:00", tag: "Early bird" },
            ]}
            icon={LogOut}
            tone="warning"
          />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── building blocks ───────────────────────── */

function QuickAction({
  icon: Icon,
  label,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  tone: "primary" | "success" | "warning" | "info";
}) {
  const grad: Record<typeof tone, string> = {
    primary: "from-[oklch(0.68_0.18_258)] to-[oklch(0.6_0.2_220)]",
    success: "from-[oklch(0.72_0.16_162)] to-[oklch(0.6_0.18_180)]",
    warning: "from-[oklch(0.78_0.16_75)] to-[oklch(0.7_0.18_50)]",
    info: "from-[oklch(0.7_0.15_240)] to-[oklch(0.65_0.18_220)]",
  };
  return (
    <button
      className={cn(
        "group glass card-hover relative flex items-center gap-4 overflow-hidden rounded-2xl p-4 text-left",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-primary-foreground shadow-lg transition-transform group-hover:scale-110",
          grad[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm font-semibold">{label}</div>
        <div className="truncate text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: sub }} />
      </div>
      <span className="text-muted-foreground/60 transition-transform group-hover:translate-x-1">→</span>
    </button>
  );
}

function StatCard({
  label,
  icon: Icon,
  headline,
  delta,
  up,
  accent,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  headline: React.ReactNode;
  delta?: string;
  up?: boolean;
  accent: string;
}) {
  return (
    <div className="glass card-hover relative overflow-hidden rounded-2xl p-5">
      <div
        className={cn(
          "absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl bg-gradient-to-br",
          accent,
        )}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-primary-foreground", accent)}>
            <Icon className="h-4 w-4" />
          </span>
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                up
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {delta}
            </span>
          )}
        </div>
        <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1">{headline}</div>
      </div>
    </div>
  );
}

function RingChart({ value, max }: { value: number; max: number }) {
  const pct = useCountUp(Math.round((value / max) * 100));
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.16 258)" />
            <stop offset="100%" stopColor="oklch(0.72 0.16 162)" />
          </linearGradient>
        </defs>
        <circle cx="28" cy="28" r={r} stroke="oklch(1 0 0 / 0.1)" strokeWidth="5" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
          style={{ filter: "drop-shadow(0 0 6px oklch(0.68 0.18 258 / 0.6))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums">
        {Math.round(pct)}%
      </div>
    </div>
  );
}

function ChartHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span dangerouslySetInnerHTML={{ __html: label }} />
    </span>
  );
}

/* ───────────────────────── charts ───────────────────────── */

function OccupancyAreaChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = [62, 71, 68, 78, 88, 94, 84];
  const [hover, setHover] = useState<number | null>(null);
  const w = 640;
  const h = 240;
  const pad = { l: 32, r: 12, t: 16, b: 28 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const step = iw / (values.length - 1);
  const pts = values.map((v, i) => [pad.l + i * step, pad.t + ih - (v / 100) * ih] as const);
  const path = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const area = `${path} L${pad.l + iw},${pad.t + ih} L${pad.l},${pad.t + ih} Z`;

  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-64 w-full" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="occGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.68 0.18 258)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="oklch(0.68 0.18 258)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="occLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.78 0.16 258)" />
            <stop offset="100%" stopColor="oklch(0.72 0.16 162)" />
          </linearGradient>
        </defs>

        {/* gridlines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = pad.t + ih - (v / 100) * ih;
          return (
            <g key={v}>
              <line x1={pad.l} x2={pad.l + iw} y1={y} y2={y} stroke="oklch(1 0 0 / 0.05)" strokeDasharray="3 4" />
              <text x={4} y={y + 3} fontSize="10" fill="oklch(1 0 0 / 0.4)">
                {v}%
              </text>
            </g>
          );
        })}

        <path d={area} fill="url(#occGrad)" />
        <path
          d={path}
          fill="none"
          stroke="url(#occLine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 4px 14px oklch(0.68 0.18 258 / 0.4))" }}
        />

        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={hover === i ? 5 : 3} fill="oklch(0.78 0.16 258)" stroke="oklch(0.18 0.03 260)" strokeWidth="2" />
            <rect
              x={x - step / 2}
              y={pad.t}
              width={step}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            <text x={x} y={h - 8} fontSize="11" textAnchor="middle" fill="oklch(1 0 0 / 0.6)">
              {days[i]}
            </text>
            {hover === i && (
              <g>
                <line x1={x} x2={x} y1={pad.t} y2={pad.t + ih} stroke="oklch(0.78 0.16 258 / 0.4)" strokeDasharray="3 3" />
                <g transform={`translate(${Math.min(x + 8, w - 70)}, ${Math.max(y - 36, pad.t)})`}>
                  <rect width="62" height="28" rx="6" fill="oklch(0.22 0.035 262)" stroke="oklch(0.34 0.04 260)" />
                  <text x="8" y="12" fontSize="9" fill="oklch(1 0 0 / 0.55)">
                    {days[i]}
                  </text>
                  <text x="8" y="23" fontSize="12" fontWeight="700" fill="white">
                    {values[i]}%
                  </text>
                </g>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function RevenueBarChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const series = [
    { label: "Rooms", color: "oklch(0.68 0.18 258)", values: [8.2, 9.1, 8.6, 10.4, 12.8, 14.2, 11.6] },
    { label: "POS", color: "oklch(0.72 0.16 162)", values: [3.1, 3.6, 3.2, 4.0, 4.8, 5.4, 4.6] },
    { label: "Events", color: "oklch(0.78 0.16 75)", values: [1.0, 0.6, 1.4, 1.2, 2.6, 3.2, 1.4] },
  ];
  const w = 400;
  const h = 220;
  const pad = { l: 28, r: 8, t: 12, b: 28 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const max = Math.max(...days.map((_, i) => series.reduce((s, ser) => s + ser.values[i], 0)));
  const groupW = iw / days.length;
  const barW = groupW * 0.55;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-56 w-full">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`bar-${i}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="1" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.55" />
          </linearGradient>
        ))}
      </defs>

      {[0, 0.5, 1].map((p) => {
        const y = pad.t + ih * (1 - p);
        return (
          <g key={p}>
            <line x1={pad.l} x2={pad.l + iw} y1={y} y2={y} stroke="oklch(1 0 0 / 0.05)" strokeDasharray="3 4" />
            <text x={4} y={y + 3} fontSize="9" fill="oklch(1 0 0 / 0.4)">
              {(max * p).toFixed(0)}M
            </text>
          </g>
        );
      })}

      {days.map((d, i) => {
        const x0 = pad.l + i * groupW + (groupW - barW) / 2;
        let yCursor = pad.t + ih;
        return (
          <g key={d}>
            {series.map((s, si) => {
              const v = s.values[i];
              const segH = (v / max) * ih;
              yCursor -= segH;
              return (
                <rect
                  key={si}
                  x={x0}
                  y={yCursor}
                  width={barW}
                  height={Math.max(segH, 0)}
                  rx={si === series.length - 1 ? 4 : 0}
                  fill={`url(#bar-${si})`}
                />
              );
            })}
            <text x={x0 + barW / 2} y={h - 10} fontSize="10" textAnchor="middle" fill="oklch(1 0 0 / 0.55)">
              {d}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────────────────── room status grid ───────────────────────── */

type Status = "Available" | "Occupied" | "Dirty" | "Maintenance";
const statusColor: Record<Status, string> = {
  Available: "oklch(0.72 0.16 162)",
  Occupied: "oklch(0.68 0.18 258)",
  Dirty: "oklch(0.78 0.16 75)",
  Maintenance: "oklch(0.65 0.22 25)",
};

function RoomStatusGrid() {
  // generate 168 rooms across 7 floors
  const rooms = Array.from({ length: 168 }, (_, i) => {
    const floor = Math.floor(i / 24) + 1;
    const num = `${floor}${String((i % 24) + 1).padStart(2, "0")}`;
    const seed = (i * 7) % 100;
    const status: Status =
      seed < 60 ? "Occupied" : seed < 82 ? "Available" : seed < 95 ? "Dirty" : "Maintenance";
    return { num, floor, status };
  });

  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }, (_, f) => f + 1).map((floor) => (
        <div key={floor} className="flex items-center gap-3">
          <div className="w-14 shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground">
            Floor {floor}
          </div>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {rooms
              .filter((r) => r.floor === floor)
              .map((r) => (
                <div
                  key={r.num}
                  title={`Room ${r.num} · ${r.status}`}
                  className="group relative h-8 w-10 cursor-pointer rounded-md transition-transform hover:z-10 hover:scale-125"
                  style={{
                    background: `linear-gradient(135deg, ${statusColor[r.status]}, color-mix(in oklab, ${statusColor[r.status]} 55%, black))`,
                    boxShadow: `0 0 0 1px oklch(1 0 0 / 0.06) inset, 0 4px 10px -4px ${statusColor[r.status]}`,
                  }}
                >
                  <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                    {r.num}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── guest table ───────────────────────── */

function GuestTable({
  rows,
  icon: Icon,
  tone,
}: {
  rows: { name: string; room: string; time: string; tag?: string }[];
  icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "warning";
}) {
  return (
    <ul className="divide-y divide-border/40">
      {rows.map((r) => (
        <li key={r.name} className="flex items-center gap-3 py-3 transition hover:bg-card/30">
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-xl",
              tone === "success" ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-[oklch(0.72_0.16_162)]/40 text-[11px] font-semibold">
            {r.name.split(" ").map((p) => p[0]).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{r.name}</span>
              {r.tag && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {r.tag}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{r.room}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium">{r.time}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
