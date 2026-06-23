import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BedDouble,
  TrendingUp,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck2,
  CalendarX2,
  ClipboardList,
  ShieldCheck,
  FileSearch,
  Receipt,
  ShoppingCart,
  Wallet,
  Users,
  SearchX,
  Plus,
  ArrowRight,
  Settings,
  CreditCard,
  BarChart3,
  UserPlus,
  LogOut,
  Menu as MenuIcon,
  Calculator,
  Building2,
  PoundSterling,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, RadialBarChart, RadialBar, LabelList } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useRole, ROLE_META } from "@/lib/role";
import {
  adrOnDate,
  dateRangeList,
  fmtUGX,
  occupancyOnDate,
  revparOnDate,
  todayISO,
  totalRevenueOnDate,
  useStore,
} from "@/lib/pms-store";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Jambo PMS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { role } = useRole();
  const meta = ROLE_META[role];
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="mx-auto max-w-7xl space-y-6 min-h-screen py-1 relative mesh-bg" role="main" aria-label="Dashboard">
      <header className="group/header relative flex flex-wrap items-end justify-between gap-3 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card/85 via-card/65 to-card/40 px-6 py-5 shadow-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-500 group-hover/header:before:opacity-100 before:bg-gradient-to-r before:from-primary/[0.03] before:via-transparent before:to-primary/[0.02]">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent blur-3xl transition-all duration-700 group-hover/header:scale-110 group-hover/header:from-primary/[0.12]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-gradient-to-tr from-success/[0.05] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-1 rounded-full bg-primary animate-accent-slide" />
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{role}</p>
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-breathe" />
            <span className="h-1.5 w-px bg-border/60" />
            <span className="text-[10px] tabular-nums text-muted-foreground/60 font-medium">{dateStr}</span>
          </div>
          <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}, {meta.person.split(" ")[0]}
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground/80 leading-relaxed max-w-xl">{meta.tagline}</p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1.5 relative z-10">
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="live-dot" />
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{timeStr}</span>
          </div>
          <p className="text-xs text-muted-foreground/60">Jambo Sphere Hotel · Kampala, UG</p>
        </div>
      </header>

      {role === "Owner / GM" && <OwnerGMDashboard />}
      {role === "Front Desk" && <FrontDeskDashboard />}
      {role === "Housekeeping" && <HousekeepingDashboard />}
      {role === "POS / Cashier" && <PosDashboard />}
      {role === "Reservations / Revenue" && <ReservationsDashboard />}
      {role === "Accountant" && <AccountantDashboard />}
      {role === "System Administrator" && <SysadminDashboard />}
    </div>
  );
}

/* ============================== Owner / GM ============================== */

const ugx = (n: number) => fmtUGX(n);

function OwnerGMDashboard() {
  const today = todayISO();
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const occ = occupancyOnDate(today);
  const adr = adrOnDate(today);
  const revpar = revparOnDate(today);
  const revToday = totalRevenueOnDate(today);
  const arrivals = reservations.filter((r) => r.checkIn === today && (r.status === "confirmed" || r.status === "checked_in"));
  const departures = reservations.filter((r) => r.checkOut === today && (r.status === "checked_in" || r.status === "checked_out"));
  const dirtyRooms = rooms.filter((r) => r.status === "dirty");

  return (
    <>
      {/* CTA buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to="/reports" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"><BarChart3 className="h-3.5 w-3.5" /> View Reports <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/audit" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-4 py-2 text-xs font-semibold text-warning"><FileSearch className="h-3.5 w-3.5" /> Audit Trail <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/rates" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-info/10 px-4 py-2 text-xs font-semibold text-info"><PoundSterling className="h-3.5 w-3.5" /> Manage Rates <ArrowRight className="h-3 w-3" /></Link>
      </div>


      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-kpi-enter">
          <KpiCard
            label="Occupancy"
            value={(occ.pct * 100).toFixed(0) + "%"}
            delta={`${occ.occupied} / ${occ.total} rooms`}
            icon={<BedDouble className="h-4 w-4" />}
            accent="primary"
            extra={<Ring percent={Math.round(occ.pct * 100)} />}
            index={0}
          />
        </div>
        <div className="animate-kpi-enter" style={{ animationDelay: "80ms" }}>
          <KpiCard
            label="ADR"
            value={ugx(adr)}
            delta="Today"
            icon={<TrendingUp className="h-4 w-4" />}
            accent="success"
            index={1}
          />
        </div>
        <div className="animate-kpi-enter" style={{ animationDelay: "160ms" }}>
          <KpiCard
            label="RevPAR"
            value={ugx(revpar)}
            delta="Today"
            icon={<DollarSign className="h-4 w-4" />}
            accent="info"
            index={2}
          />
        </div>
        <div className="animate-kpi-enter" style={{ animationDelay: "240ms" }}>
          <KpiCard
            label="Today's Revenue"
            value={ugx(revToday)}
            delta="All sources"
            icon={<Wallet className="h-4 w-4" />}
            accent="warning"
            index={3}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="7-day occupancy trend" subtitle="Rolling daily occupancy %" className="lg:col-span-2">
          <OccupancyChart />
        </Card>
        <Card title="Revenue by source" subtitle="Today">
          <RevenueBars />
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Today's arrivals" subtitle={`${arrivals.length} expected check-ins`} action={<Link to="/reservations" className="text-xs font-medium text-primary hover:underline">View all →</Link>}>
          <GuestTable
            rows={arrivals.slice(0, 5).map((r) => ({
              name: r.guestName,
              room: r.roomId ?? "—",
              time: "—",
              nights: Math.max(1, Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86_400_000)),
              status: r.status === "checked_in" ? "Checked In" : "Confirmed",
            }))}
            kind="arrival"
          />
        </Card>
        <Card title="Today's departures" subtitle={`${departures.length} scheduled check-outs`} action={<Link to="/reservations" className="text-xs font-medium text-primary hover:underline">View all →</Link>}>
          <GuestTable
            rows={departures.slice(0, 5).map((r) => ({
              name: r.guestName,
              room: r.roomId ?? "—",
              time: "—",
              nights: Math.max(1, Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86_400_000)),
              status: r.status === "checked_out" ? "Cleared" : "Folio open",
            }))}
            kind="departure"
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Housekeeping needs attention" subtitle={`${dirtyRooms.length} rooms in queue`} className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {dirtyRooms.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
                <div>
                  <div className="text-sm font-semibold">Room {r.id}</div>
                  <div className="text-[11px] text-muted-foreground">Floor {r.floor} · awaiting turnover</div>
                </div>
                <PriorityBadge p="High" />
              </div>
            ))}
            {dirtyRooms.length === 0 && (
              <p className="col-span-2 rounded-xl border border-success/20 bg-success/10 px-3 py-3 text-xs text-success backdrop-blur-sm">
                All rooms clean.
              </p>
            )}
          </div>
        </Card>
        <Card title="Quick reports" subtitle="Generate now">
          <div className="grid grid-cols-2 gap-2">
            {[
              { t: "Occupancy", icon: BedDouble },
              { t: "Revenue", icon: DollarSign },
              { t: "ADR / RevPAR", icon: TrendingUp },
              { t: "Audit log", icon: FileSearch },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.t}
                  to="/reports"
                  className="group rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="mt-2 text-xs font-semibold">{r.t}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">View →</div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ============================== Other roles ============================== */

function FrontDeskDashboard() {
  return (
    <>
      {/* CTA buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to="/check-in" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"><UserPlus className="h-3.5 w-3.5" /> Check In <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/check-out" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-4 py-2 text-xs font-semibold text-warning"><LogOut className="h-3.5 w-3.5" /> Check Out <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/reservations/new" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-success/10 px-4 py-2 text-xs font-semibold text-success"><Plus className="h-3.5 w-3.5" /> New Booking <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/billing" search={{ folio: undefined, invoice: undefined }} className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-info/10 px-4 py-2 text-xs font-semibold text-info"><CreditCard className="h-3.5 w-3.5" /> Record Payment <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-kpi-enter"><KpiCard label="Arrivals today" value="12" delta="3 walked-in" icon={<CalendarCheck2 className="h-4 w-4" />} accent="primary" index={0} /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "80ms" }}><KpiCard label="Departures today" value="9" delta="2 pending" icon={<CalendarX2 className="h-4 w-4" />} accent="warning" index={1} /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "160ms" }}><KpiCard label="In-house guests" value="86" delta="78% occ" deltaPositive icon={<Users className="h-4 w-4" />} accent="info" index={2} /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "240ms" }}><KpiCard label="Open folios" value="14" delta={ugx(8_240_000)} icon={<Receipt className="h-4 w-4" />} accent="success" index={3} /></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Occupancy trend" subtitle="7-day rolling" className="lg:col-span-2" accent="primary">
          <OccupancyChart />
        </Card>
        <Card title="Revenue by source" subtitle="Today" accent="success">
          <RevenueBars />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Arrivals" action={<Link to="/reservations" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">View all &rarr;</Link>} accent="primary">
          <GuestTable
            rows={[
              { name: "Sarah Mwangi", room: "204", time: "14:00", nights: 3, status: "Confirmed" },
              { name: "James Okello", room: "311", time: "15:30", nights: 2, status: "Confirmed" },
              { name: "Priya Sharma", room: "108", time: "16:00", nights: 5, status: "Pre-paid" },
            ]}
            kind="arrival"
          />
        </Card>
        <Card title="Departures" action={<Link to="/reservations" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">View all &rarr;</Link>} accent="warning">
          <GuestTable
            rows={[
              { name: "Mark Tindyebwa", room: "112", time: "10:00", nights: 2, status: "Folio open" },
              { name: "Linda Owino", room: "303", time: "11:00", nights: 4, status: "Cleared" },
              { name: "Joan Nansubuga", room: "405", time: "12:00", nights: 3, status: "Folio open" },
            ]}
            kind="departure"
          />
        </Card>
      </div>
    </>
  );
}

function HousekeepingDashboard() {
  return (
    <>
      {/* CTA buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to="/housekeeping" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"><ClipboardList className="h-3.5 w-3.5" /> Update Room Status <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/rooms" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-info/10 px-4 py-2 text-xs font-semibold text-info"><Building2 className="h-3.5 w-3.5" /> View All Rooms <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-kpi-enter"><KpiCard label="Rooms to clean" value="14" delta="9 high priority" icon={<Sparkles className="h-4 w-4" />} accent="primary" index={0} /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "80ms" }}><KpiCard label="In progress" value="6" delta="3 attendants" icon={<ClipboardList className="h-4 w-4" />} accent="warning" index={1} /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "160ms" }}><KpiCard label="Inspected today" value="32" delta="+5 vs yesterday" deltaPositive icon={<BedDouble className="h-4 w-4" />} accent="success" index={2} /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "240ms" }}><KpiCard label="Out of order" value="2" delta="Maintenance" icon={<BedDouble className="h-4 w-4" />} accent="info" index={3} /></div>
      </div>
      <Card title="My assigned rooms" subtitle="9 rooms · sorted by priority" accent="warning">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {["101","102","103","204","205","305","306","402","410"].map((r, i) => (
            <div key={r} className="group/room flex items-center justify-between rounded-xl border border-border/50 bg-card/50 px-3.5 py-3 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:border-primary/30 hover:bg-card/70 hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">{r}</span>
                <div>
                  <div className="text-sm font-semibold">Room {r}</div>
                  <div className="text-[11px] text-muted-foreground/70">{i % 2 ? "Stayover" : "Departure clean"}</div>
                </div>
              </div>
              <PriorityBadge p={i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low"} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function PosDashboard() {
  const fmt = (n: number) => fmtUGX(n);

  const hourlyData = [
    { h: "08", v: 0 }, { h: "09", v: 45000 }, { h: "10", v: 120000 },
    { h: "11", v: 185000 }, { h: "12", v: 320000 }, { h: "13", v: 280000 },
    { h: "14", v: 195000 }, { h: "15", v: 160000 }, { h: "16", v: 240000 },
    { h: "17", v: 310000 }, { h: "18", v: 420000 }, { h: "19", v: 380000 },
    { h: "20", v: 260000 }, { h: "21", v: 140000 }, { h: "22", v: 35000 },
  ];

  const catData = [
    { name: "Soft Drinks", value: 445000, color: "var(--color-chart-1)" },
    { name: "Spirits", value: 280000, color: "var(--color-chart-2)" },
    { name: "Food", value: 215000, color: "var(--color-chart-3)" },
    { name: "Snacks", value: 125000, color: "var(--color-chart-5)" },
  ];

  const topItems = [
    { name: "Coca Cola", qty: 32 }, { name: "Grilled Chicken", qty: 24 },
    { name: "French Fries", qty: 20 }, { name: "Johnnie Walker Red", qty: 17 },
    { name: "Fanta Orange", qty: 15 },
  ];

  const total = hourlyData.reduce((s, d) => s + d.v, 0);
  const catTotal = catData.reduce((s, d) => s + d.value, 0);

  return (
    <>
      {/* CTA buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to="/pos" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"><ShoppingCart className="h-3.5 w-3.5" /> Open POS <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/pos/orders" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-4 py-2 text-xs font-semibold text-warning"><ClipboardList className="h-3.5 w-3.5" /> View Orders <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/pos/menu" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-info/10 px-4 py-2 text-xs font-semibold text-info"><MenuIcon className="h-3.5 w-3.5" /> Manage Menu <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-kpi-enter" style={{ animationDelay: "0ms" }}><KpiCard label="Open tabs" value="7" icon={<ShoppingCart className="h-4 w-4" />} accent="primary" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "80ms" }}><KpiCard label="Orders today" value="42" delta="+12 vs. yest." deltaPositive icon={<ClipboardList className="h-4 w-4" />} accent="info" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "160ms" }}><KpiCard label="POS revenue" value={fmt(1_980_000)} delta="+8.1%" deltaPositive icon={<DollarSign className="h-4 w-4" />} accent="success" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "240ms" }}><KpiCard label="Cash drawer" value={fmt(640_000)} icon={<Wallet className="h-4 w-4" />} accent="warning" /></div>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Hourly Sales" subtitle={`Today · ${fmt(total)} total`} className="lg:col-span-2">
          <ChartContainer config={{ sales: { label: "Sales", color: "var(--color-primary)" } }} className="h-44 w-full">
            <AreaChart data={hourlyData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="posDashFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis dataKey="h" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} tickFormatter={(v: number) => fmt(v)} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="rounded-xl" formatter={(v: number) => fmt(v)} />} />
              <Area type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#posDashFill)" dot={{ fill: "var(--color-card)", stroke: "var(--color-primary)", strokeWidth: 2.5, r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ChartContainer>
        </Card>
        <Card title="Categories" subtitle="Sales split">
          <ChartContainer config={{ value: { label: "Value" } }} className="h-44 w-full">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0} cornerRadius={4} paddingAngle={2}>
                {catData.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent className="rounded-xl" formatter={(v: number) => fmt(v)} />} />
            </PieChart>
          </ChartContainer>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {catData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-medium tabular-nums">{Math.round((d.value / catTotal) * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Top Selling Items" subtitle="Today">
          <ChartContainer config={{ qty: { label: "Qty", color: "var(--color-chart-2)" } }} className="h-40 w-full">
            <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
              <XAxis type="number" hide domain={[0, "dataMax + 8"]} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} width={100} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent className="rounded-xl" />} />
              <Bar dataKey="qty" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="qty" position="right" className="fill-foreground" fontSize={10} fontWeight={600} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>
        <Card title="Recent orders">
          <p className="text-sm text-muted-foreground">Open the POS to manage active orders.</p>
          <Link to="/pos" className="mt-3 inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Open POS →</Link>
        </Card>
      </div>
    </>
  );
}

function ReservationsDashboard() {
  return (
    <>
      {/* CTA buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to="/reservations/new" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"><Plus className="h-3.5 w-3.5" /> New Booking <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/rates" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-success/10 px-4 py-2 text-xs font-semibold text-success"><PoundSterling className="h-3.5 w-3.5" /> Manage Rates <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/reports" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-info/10 px-4 py-2 text-xs font-semibold text-info"><BarChart3 className="h-3.5 w-3.5" /> Reports <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-kpi-enter" style={{ animationDelay: "0ms" }}><KpiCard label="Pipeline (7d)" value="38" delta="+6" deltaPositive icon={<CalendarCheck2 className="h-4 w-4" />} accent="primary" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "80ms" }}><KpiCard label="Forecast Occ (7d)" value="74%" icon={<BedDouble className="h-4 w-4" />} accent="info" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "160ms" }}><KpiCard label="ADR" value={ugx(285000)} delta="+2.1%" deltaPositive icon={<TrendingUp className="h-4 w-4" />} accent="success" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "240ms" }}><KpiCard label="Cancellations" value="3" delta="-2 vs. wk" icon={<CalendarX2 className="h-4 w-4" />} accent="warning" /></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="7-day occupancy forecast" className="lg:col-span-2"><OccupancyChart /></Card>
        <Card title="Channels"><RevenueBars labels={["Direct","OTA","Corporate"]} values={[55,30,15]} /></Card>
      </div>
    </>
  );
}

function AccountantDashboard() {
  const revTrend = [
    { d: "Mon", rev: 4.2, exp: 2.8 },
    { d: "Tue", rev: 5.1, exp: 3.2 },
    { d: "Wed", rev: 4.8, exp: 2.6 },
    { d: "Thu", rev: 6.3, exp: 3.5 },
    { d: "Fri", rev: 7.2, exp: 4.1 },
    { d: "Sat", rev: 8.6, exp: 3.8 },
    { d: "Sun", rev: 5.9, exp: 2.9 },
  ];

  const expenseData = [
    { name: "Payroll", value: 42, color: "var(--color-chart-1)" },
    { name: "Utilities", value: 18, color: "var(--color-chart-2)" },
    { name: "F&B Supplies", value: 16, color: "var(--color-chart-3)" },
    { name: "Maintenance", value: 12, color: "var(--color-chart-4)" },
    { name: "Marketing", value: 7, color: "var(--color-chart-5)" },
    { name: "Other", value: 5, color: "var(--color-muted-foreground)" },
  ];

  const txData = [
    { d: "Mon", tx: 28 }, { d: "Tue", tx: 35 }, { d: "Wed", tx: 31 },
    { d: "Thu", tx: 42 }, { d: "Fri", tx: 48 }, { d: "Sat", tx: 56 },
    { d: "Sun", tx: 38 },
  ];

  const expTotal = expenseData.reduce((s, e) => s + e.value, 0);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Link to="/billing" search={{ folio: undefined, invoice: undefined }} className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"><Receipt className="h-3.5 w-3.5" /> View Billing <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/accounting" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-info/10 px-4 py-2 text-xs font-semibold text-info"><Calculator className="h-3.5 w-3.5" /> Accounting <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/reports" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-4 py-2 text-xs font-semibold text-warning"><BarChart3 className="h-3.5 w-3.5" /> Run Reports <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/audit" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-success/10 px-4 py-2 text-xs font-semibold text-success"><FileSearch className="h-3.5 w-3.5" /> Audit Trail <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-kpi-enter" style={{ animationDelay: "0ms" }}><KpiCard label="Open folios" value="14" delta={ugx(8_240_000)} icon={<Receipt className="h-4 w-4" />} accent="primary" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "80ms" }}><KpiCard label="Payments today" value={ugx(3_120_000)} delta="+12%" deltaPositive icon={<DollarSign className="h-4 w-4" />} accent="success" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "160ms" }}><KpiCard label="Outstanding" value={ugx(5_120_000)} icon={<Wallet className="h-4 w-4" />} accent="warning" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "240ms" }}><KpiCard label="Refunds" value={ugx(80_000)} icon={<ArrowDownRight className="h-4 w-4" />} accent="info" /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Revenue vs Expenses" subtitle="This week · UGX (M)" className="lg:col-span-2">
          <ChartContainer config={{ rev: { label: "Revenue", color: "var(--color-success)" }, exp: { label: "Expenses", color: "var(--color-destructive)" } }} className="h-48 w-full">
            <AreaChart data={revTrend} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis dataKey="d" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}M`} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="rounded-xl" formatter={(v: number) => `UGX ${v}M`} />} />
              <Area type="monotone" dataKey="rev" stroke="var(--color-success)" strokeWidth={2.5} fill="url(#revFill)" dot={{ r: 4, fill: "var(--color-card)", stroke: "var(--color-success)", strokeWidth: 2.5 }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="exp" stroke="var(--color-destructive)" strokeWidth={2.5} fill="url(#expFill)" dot={{ r: 4, fill: "var(--color-card)", stroke: "var(--color-destructive)", strokeWidth: 2.5 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ChartContainer>
        </Card>
        <Card title="Expense Breakdown" subtitle="YTD spend">
          <ChartContainer config={{ value: { label: "%" } }} className="h-36 w-full">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={58} strokeWidth={0} cornerRadius={4} paddingAngle={2}>
                {expenseData.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent className="rounded-xl" formatter={(v: number) => `${v}%`} />} />
            </PieChart>
          </ChartContainer>
          <div className="mt-2 space-y-1">
            {expenseData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-medium tabular-nums">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Daily Transactions" subtitle="This week">
          <ChartContainer config={{ tx: { label: "Transactions", color: "var(--color-chart-1)" } }} className="h-40 w-full">
            <BarChart data={txData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis dataKey="d" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="rounded-xl" />} />
              <Bar dataKey="tx" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} barSize={32}>
                <LabelList dataKey="tx" position="top" className="fill-foreground" fontSize={10} fontWeight={600} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>
        <Card title="Today's payments">
          <p className="text-sm text-muted-foreground">View detailed payment log in Billing.</p>
          <Link to="/billing" search={{ folio: undefined, invoice: undefined }} className="mt-3 inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Open billing →</Link>
        </Card>
      </div>
    </>
  );
}

function SysadminDashboard() {
  const auditTrend = [
    { d: "Mon", events: 245, logins: 18 },
    { d: "Tue", events: 312, logins: 24 },
    { d: "Wed", events: 278, logins: 21 },
    { d: "Thu", events: 356, logins: 29 },
    { d: "Fri", events: 410, logins: 35 },
    { d: "Sat", events: 189, logins: 12 },
    { d: "Sun", events: 134, logins: 8 },
  ];

  const roleDist = [
    { name: "Front Desk", value: 8, color: "var(--color-chart-1)" },
    { name: "Housekeeping", value: 6, color: "var(--color-chart-2)" },
    { name: "Management", value: 4, color: "var(--color-chart-3)" },
    { name: "Accountant", value: 3, color: "var(--color-chart-4)" },
    { name: "Sysadmin", value: 2, color: "var(--color-chart-5)" },
    { name: "Other", value: 3, color: "var(--color-muted-foreground)" },
  ];

  const activityData = [
    { name: "Reservations", value: 142, color: "var(--color-chart-1)" },
    { name: "Billing", value: 98, color: "var(--color-chart-2)" },
    { name: "Housekeeping", value: 76, color: "var(--color-chart-3)" },
    { name: "Settings", value: 34, color: "var(--color-chart-4)" },
    { name: "Reports", value: 28, color: "var(--color-chart-5)" },
  ];

  const roleTotal = roleDist.reduce((s, r) => s + r.value, 0);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Link to="/identity" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"><Users className="h-3.5 w-3.5" /> Manage Users <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/audit" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-4 py-2 text-xs font-semibold text-warning"><FileSearch className="h-3.5 w-3.5" /> Audit Log <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/settings" className="dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-info/10 px-4 py-2 text-xs font-semibold text-info"><Settings className="h-3.5 w-3.5" /> System Settings <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-kpi-enter" style={{ animationDelay: "0ms" }}><KpiCard label="Active users" value="24" icon={<Users className="h-4 w-4" />} accent="primary" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "80ms" }}><KpiCard label="Roles" value="7" icon={<ShieldCheck className="h-4 w-4" />} accent="info" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "160ms" }}><KpiCard label="Audit events (24h)" value="318" icon={<FileSearch className="h-4 w-4" />} accent="warning" /></div>
        <div className="animate-kpi-enter" style={{ animationDelay: "240ms" }}><KpiCard label="Failed logins" value="2" icon={<ShieldCheck className="h-4 w-4" />} accent="success" /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Audit Events" subtitle="This week" className="lg:col-span-2">
          <ChartContainer config={{ events: { label: "Events", color: "var(--color-chart-1)" }, logins: { label: "Logins", color: "var(--color-warning)" } }} className="h-44 w-full">
            <AreaChart data={auditTrend} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="evtFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis dataKey="d" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="rounded-xl" />} />
              <Area type="monotone" dataKey="events" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#evtFill)" dot={{ r: 4, fill: "var(--color-card)", stroke: "var(--color-chart-1)", strokeWidth: 2.5 }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="logins" stroke="var(--color-warning)" strokeWidth={2} fill="none" dot={{ r: 3, fill: "var(--color-warning)" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ChartContainer>
        </Card>
        <Card title="Users by Role" subtitle={`${roleTotal} roles · ${24} users`}>
          <ChartContainer config={{ value: { label: "Users" } }} className="h-28 w-full">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie data={roleDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={46} strokeWidth={0} cornerRadius={4} paddingAngle={2}>
                {roleDist.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent className="rounded-xl" />} />
            </PieChart>
          </ChartContainer>
          <div className="mt-2 space-y-1">
            {roleDist.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-medium tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Module Activity" subtitle="Events today">
          <ChartContainer config={{ value: { label: "Events", color: "var(--color-chart-1)" } }} className="h-44 w-full">
            <BarChart data={activityData} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
              <XAxis type="number" hide domain={[0, "dataMax + 20"]} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} width={100} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent className="rounded-xl" />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {activityData.map((e) => <Cell key={e.name} fill={e.color} />)}
                <LabelList dataKey="value" position="right" className="fill-foreground" fontSize={10} fontWeight={600} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>
        <Card title="Identity & Access" action={<Link to="/identity" className="text-xs text-primary">Manage →</Link>}>
          <p className="text-sm text-muted-foreground">Manage users, roles and permissions for property staff.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Users</p>
              <p className="mt-1 font-display text-xl font-bold">24</p>
              <p className="text-[10px] text-success">+2 this month</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Roles</p>
              <p className="mt-1 font-display text-xl font-bold">7</p>
              <p className="text-[10px] text-muted-foreground">4 active today</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sessions</p>
              <p className="mt-1 font-display text-xl font-bold">14</p>
              <p className="text-[10px] text-success">+3 vs. yesterday</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Failed logins</p>
              <p className="mt-1 font-display text-xl font-bold">2</p>
              <p className="text-[10px] text-destructive">-1 from last week</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ============================== Primitives ============================== */

type Accent = "primary" | "success" | "warning" | "info";
const accentMap: Record<Accent, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};
const accentColor: Record<Accent, string> = {
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
};

function KpiCard({
  label, value, delta, deltaPositive, icon, accent = "primary", extra, index = 0,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon?: ReactNode;
  accent?: Accent;
  extra?: ReactNode;
  index?: number;
}) {
  return (
    <div
      className="dashboard-card group/kpi relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Accent bar with glow */}
      <div
        className="absolute left-0 top-0 h-full w-[3px] transition-all duration-300 group-hover/kpi:w-[4px]"
        style={{
          background: `linear-gradient(180deg, ${accentColor[accent]}, color-mix(in oklab, ${accentColor[accent]} 60%, transparent))`,
          boxShadow: `0 0 12px ${accentColor[accent]}`,
        }}
      />
      {/* Hover radial glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-all duration-500 group-hover/kpi:opacity-100 blur-2xl"
        style={{
          background: `radial-gradient(circle, ${accentColor[accent]} 0%, transparent 70%)`,
        }}
      />
      <div className="flex items-start justify-between pl-1.5 relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground truncate">{value}</p>
          {delta && (
            <p className={"mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium transition-colors duration-200 " + (deltaPositive ? "text-success" : "text-muted-foreground/80")}>
              {deltaPositive ? <ArrowUpRight className="h-3 w-3" /> : null}
              {delta}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {extra}
          <span className={"grid h-10 w-10 place-items-center rounded-xl transition-all duration-300 group-hover/kpi:scale-110 group-hover/kpi:shadow-lg " + accentMap[accent]}
            style={{
              boxShadow: `0 2px 8px color-mix(in oklab, ${accentColor[accent]} 20%, transparent)`,
            }}
          >
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, action, className, accent }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  accent?: Accent;
}) {
  return (
    <div className={"dashboard-card group/card relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " + (className ?? "")}>
      {accent && (
        <div
          className="absolute left-0 top-0 h-full w-[2px] transition-all duration-300 group-hover/card:w-[3px]"
          style={{
            background: `linear-gradient(180deg, ${accentColor[accent]}, color-mix(in oklab, ${accentColor[accent]} 50%, transparent))`,
            boxShadow: `0 0 8px ${accentColor[accent]}`,
          }}
        />
      )}
      <div className="mb-4 flex items-end justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {accent && (
            <span className="h-4 w-0.5 rounded-full flex-shrink-0"
              style={{ background: accentColor[accent] }}
            />
          )}
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {subtitle && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function Ring({ percent }: { percent: number }) {
  const color = percent > 80
    ? "var(--color-success)"
    : percent > 50
      ? "var(--color-warning)"
      : "var(--color-destructive)";
  return (
    <div className="-mr-1 transition-all duration-500 hover:scale-110 hover:-rotate-3">
      <RadialBarChart
        width={46}
        height={46}
        data={[{ name: "Occupancy", value: percent }]}
        innerRadius="72%"
        outerRadius="100%"
        barSize={8}
        startAngle={90}
        endAngle={-270}
        cx="50%"
        cy="50%"
      >
        <RadialBar
          dataKey="value"
          fill={color}
          cornerRadius={6}
          background={{ fill: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}
        />
        <text x={23} y={28} textAnchor="middle" className="fill-foreground text-[10px] font-bold tabular-nums">
          {percent}%
        </text>
      </RadialBarChart>
    </div>
  );
}

function OccupancyChart() {
  const today = todayISO();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  const days = dateRangeList(start.toISOString().slice(0, 10), today);
  const chartData = days.map((d) => ({
    day: new Date(d).toLocaleDateString("en-US", { weekday: "short" }),
    occupancy: Math.round(occupancyOnDate(d).pct * 100),
  }));

  const chartConfig = {
    occupancy: {
      label: "Occupancy",
      color: "var(--color-primary)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-56 w-full">
      <AreaChart
        data={chartData}
        margin={{ top: 24, right: 20, left: -20, bottom: 4 }}
      >
        <defs>
          <linearGradient id="fillOccupancy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-muted-foreground/60" tick={{ fontSize: 10 }} dy={4} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} className="text-muted-foreground/60" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" className="rounded-xl border-border/50 shadow-lg backdrop-blur-xl" />} />
        <Area
          type="monotone"
          dataKey="occupancy"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          fill="url(#fillOccupancy)"
          dot={{ fill: "var(--color-card)", stroke: "var(--color-primary)", strokeWidth: 2.5, r: 4 }}
          activeDot={{ r: 7, stroke: "var(--color-primary)", strokeWidth: 2.5, fill: "var(--color-primary)" }}
        >
          <LabelList
            dataKey="occupancy"
            position="top"
            className="fill-muted-foreground"
            fontSize={10}
            fontWeight={600}
            formatter={(v: number) => `${v}%`}
          />
        </Area>
      </AreaChart>
    </ChartContainer>
  );
}

function RevenueBars({ labels = ["Rooms","F&B","Events","Other"], values = [62, 22, 11, 5] }: { labels?: string[]; values?: number[] }) {
  const chartData = labels.map((l, i) => ({
    source: l,
    value: values[i],
  }));

  const colors = ["var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-info)"];

  const chartConfig = {
    value: { label: "Share" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-44 w-full">
      <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
        <XAxis dataKey="source" tickLine={false} axisLine={false} className="text-muted-foreground/60" tick={{ fontSize: 10 }} dy={4} />
        <YAxis hide domain={[0, 100]} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="rounded-xl border-border/50 shadow-lg backdrop-blur-xl" />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={44}>
          {chartData.map((entry) => (
            <Cell key={entry.source} fill={colors[labels.indexOf(entry.source) % colors.length]} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            className="fill-muted-foreground"
            fontSize={10}
            fontWeight={600}
            formatter={(v: number) => `${v}%`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function GuestTable({ rows, kind }: {
  rows: { name: string; room: string; time: string; nights: number; status: string }[];
  kind: "arrival" | "departure";
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-10 text-center backdrop-blur-sm transition-all hover:border-border/70">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 ring-1 ring-border/60">
          <SearchX className="h-6 w-6 text-muted-foreground/30" />
        </span>
        <p className="text-sm font-medium text-muted-foreground/80">No {kind === "arrival" ? "arrivals" : "departures"} today</p>
        <p className="mt-1 text-xs text-muted-foreground/50">
          {kind === "arrival" ? "No guests scheduled to check in." : "All guests staying another night."}
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-200 hover:border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-muted/20">
          <tr>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Guest</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Room</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{kind === "arrival" ? "ETA" : "ETD"}</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Nts</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((r) => (
            <tr key={r.name} className="group/row cursor-pointer transition-all duration-150 hover:bg-muted/15">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] font-bold text-primary ring-1 ring-primary/20 transition-all duration-200 group-hover/row:ring-2 group-hover/row:ring-primary/30 group-hover/row:scale-105">
                    {r.name.split(" ").map((s) => s[0]).join("").slice(0,2)}
                  </span>
                  <span className="font-medium text-sm transition-colors duration-200 group-hover/row:text-primary">{r.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground/70 group-hover/row:text-foreground transition-colors duration-200">{r.room}</td>
              <td className="px-3 py-2.5 text-muted-foreground/60 text-xs tabular-nums">{r.time || "\u2014"}</td>
              <td className="px-3 py-2.5 tabular-nums text-sm font-medium">{r.nights}</td>
              <td className="px-3 py-2.5"><StatusBadge s={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    Confirmed: "bg-success/10 text-success",
    "Pre-paid": "bg-primary/10 text-primary",
    "Checked In": "bg-info/10 text-info",
    Pending: "bg-warning/10 text-warning",
    "Folio open": "bg-warning/10 text-warning",
    Cleared: "bg-success/10 text-success",
  };
  return (
    <span className={"inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide " + (map[s] ?? "bg-muted/30 text-muted-foreground")}>
      <span className={"h-1 w-1 rounded-full " + (map[s] ? "bg-current" : "bg-muted-foreground/50")} />
      {s}
    </span>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, { cls: string; dot: string }> = {
    High: { cls: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
    Medium: { cls: "bg-warning/10 text-warning", dot: "bg-warning" },
    Low: { cls: "bg-success/10 text-success", dot: "bg-success" },
  };
  const m = map[p] ?? { cls: "bg-muted/30 text-muted-foreground", dot: "bg-muted-foreground/50" };
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold " + m.cls}>
      <span className={"h-1 w-1 rounded-full " + m.dot} />
      {p}
    </span>
  );
}
