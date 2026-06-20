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
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis, RadialBarChart, RadialBar, LabelList } from "recharts";
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

  return (
    <div className="mx-auto max-w-7xl space-y-6" role="main" aria-label="Dashboard">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">{role}</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
            Welcome back, {meta.person.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.tagline}</p>
        </div>
        <div className="hidden text-right md:block">
          <p className="text-xs text-muted-foreground">Property</p>
          <p className="text-sm font-semibold">Jambo Sphere Hotel · Kampala</p>
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
        <Link to="/reports" className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"><BarChart3 className="h-3.5 w-3.5" /> View Reports <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/audit" className="inline-flex items-center gap-1.5 rounded-lg bg-warning/10 px-3.5 py-2 text-xs font-semibold text-warning transition hover:bg-warning/20"><FileSearch className="h-3.5 w-3.5" /> Audit Trail <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/rates" className="inline-flex items-center gap-1.5 rounded-lg bg-info/10 px-3.5 py-2 text-xs font-semibold text-info transition hover:bg-info/20"><PoundSterling className="h-3.5 w-3.5" /> Manage Rates <ArrowRight className="h-3 w-3" /></Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Occupancy"
          value={(occ.pct * 100).toFixed(0) + "%"}
          delta={`${occ.occupied} / ${occ.total} rooms`}
          icon={<BedDouble className="h-4 w-4" />}
          accent="primary"
          extra={<Ring percent={Math.round(occ.pct * 100)} />}
        />
        <KpiCard
          label="ADR"
          value={ugx(adr)}
          delta="Today"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="success"
        />
        <KpiCard
          label="RevPAR"
          value={ugx(revpar)}
          delta="Today"
          icon={<DollarSign className="h-4 w-4" />}
          accent="info"
        />
        <KpiCard
          label="Today's Revenue"
          value={ugx(revToday)}
          delta="All sources"
          icon={<Wallet className="h-4 w-4" />}
          accent="warning"
        />
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
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold">Room {r.id}</div>
                  <div className="text-[11px] text-muted-foreground">Floor {r.floor} · awaiting turnover</div>
                </div>
                <PriorityBadge p="High" />
              </div>
            ))}
            {dirtyRooms.length === 0 && (
              <p className="col-span-2 rounded-md border border-success/20 bg-success/10 px-3 py-3 text-xs text-success">
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
                  className="group rounded-lg border border-border bg-card p-3 transition hover:border-primary/40 hover:bg-primary/5"
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
        <Link to="/check-in" className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"><UserPlus className="h-3.5 w-3.5" /> Check In <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/check-out" className="inline-flex items-center gap-1.5 rounded-lg bg-warning/10 px-3.5 py-2 text-xs font-semibold text-warning transition hover:bg-warning/20"><LogOut className="h-3.5 w-3.5" /> Check Out <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/reservations/new" className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3.5 py-2 text-xs font-semibold text-success transition hover:bg-success/20"><Plus className="h-3.5 w-3.5" /> New Booking <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/billing" search={{ folio: undefined, invoice: undefined }} className="inline-flex items-center gap-1.5 rounded-lg bg-info/10 px-3.5 py-2 text-xs font-semibold text-info transition hover:bg-info/20"><CreditCard className="h-3.5 w-3.5" /> Record Payment <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Arrivals today" value="12" delta="3 walked-in" icon={<CalendarCheck2 className="h-4 w-4" />} accent="primary" />
        <KpiCard label="Departures today" value="9" delta="2 pending" icon={<CalendarX2 className="h-4 w-4" />} accent="warning" />
        <KpiCard label="In-house guests" value="86" delta="78% occ" deltaPositive icon={<Users className="h-4 w-4" />} accent="info" />
        <KpiCard label="Open folios" value="14" delta={ugx(8_240_000)} icon={<Receipt className="h-4 w-4" />} accent="success" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="7-day occupancy trend" subtitle="Rolling daily occupancy %" className="lg:col-span-2">
          <OccupancyChart />
        </Card>
        <Card title="Revenue by source" subtitle="Today">
          <RevenueBars />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Arrivals" action={<Link to="/reservations" className="text-xs text-primary">View all →</Link>}>
          <GuestTable
            rows={[
              { name: "Sarah Mwangi", room: "204", time: "14:00", nights: 3, status: "Confirmed" },
              { name: "James Okello", room: "311", time: "15:30", nights: 2, status: "Confirmed" },
              { name: "Priya Sharma", room: "108", time: "16:00", nights: 5, status: "Pre-paid" },
            ]}
            kind="arrival"
          />
        </Card>
        <Card title="Departures" action={<Link to="/reservations" className="text-xs text-primary">View all →</Link>}>
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
        <Link to="/housekeeping" className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"><ClipboardList className="h-3.5 w-3.5" /> Update Room Status <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/rooms" className="inline-flex items-center gap-1.5 rounded-lg bg-info/10 px-3.5 py-2 text-xs font-semibold text-info transition hover:bg-info/20"><Building2 className="h-3.5 w-3.5" /> View All Rooms <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Rooms to clean" value="14" delta="9 high priority" icon={<Sparkles className="h-4 w-4" />} accent="primary" />
        <KpiCard label="In progress" value="6" delta="3 attendants" icon={<ClipboardList className="h-4 w-4" />} accent="warning" />
        <KpiCard label="Inspected" value="32" delta="Today" deltaPositive icon={<BedDouble className="h-4 w-4" />} accent="success" />
        <KpiCard label="Out of order" value="2" delta="Maintenance" icon={<BedDouble className="h-4 w-4" />} accent="info" />
      </div>
      <Card title="My assigned rooms">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {["101","102","103","204","205","305","306","402","410"].map((r, i) => (
            <div key={r} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
              <div>
                <div className="text-sm font-semibold">Room {r}</div>
                <div className="text-[11px] text-muted-foreground">{i % 2 ? "Stayover" : "Departure clean"}</div>
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
  return (
    <>
      {/* CTA buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to="/pos" className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"><ShoppingCart className="h-3.5 w-3.5" /> Open POS <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/pos/orders" className="inline-flex items-center gap-1.5 rounded-lg bg-warning/10 px-3.5 py-2 text-xs font-semibold text-warning transition hover:bg-warning/20"><ClipboardList className="h-3.5 w-3.5" /> View Orders <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/pos/menu" className="inline-flex items-center gap-1.5 rounded-lg bg-info/10 px-3.5 py-2 text-xs font-semibold text-info transition hover:bg-info/20"><MenuIcon className="h-3.5 w-3.5" /> Manage Menu <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open tabs" value="7" icon={<ShoppingCart className="h-4 w-4" />} accent="primary" />
        <KpiCard label="Orders today" value="42" delta="+12 vs. yest." deltaPositive icon={<ClipboardList className="h-4 w-4" />} accent="info" />
        <KpiCard label="POS revenue" value={ugx(1_980_000)} delta="+8.1%" deltaPositive icon={<DollarSign className="h-4 w-4" />} accent="success" />
        <KpiCard label="Cash drawer" value={ugx(640_000)} icon={<Wallet className="h-4 w-4" />} accent="warning" />
      </div>
      <Card title="Recent orders">
        <p className="text-sm text-muted-foreground">Open the POS to manage active orders.</p>
        <Link to="/pos" className="mt-3 inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Open POS →</Link>
      </Card>
    </>
  );
}

function ReservationsDashboard() {
  return (
    <>
      {/* CTA buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to="/reservations/new" className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"><Plus className="h-3.5 w-3.5" /> New Booking <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/rates" className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3.5 py-2 text-xs font-semibold text-success transition hover:bg-success/20"><PoundSterling className="h-3.5 w-3.5" /> Manage Rates <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/reports" className="inline-flex items-center gap-1.5 rounded-lg bg-info/10 px-3.5 py-2 text-xs font-semibold text-info transition hover:bg-info/20"><BarChart3 className="h-3.5 w-3.5" /> Reports <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Pipeline (7d)" value="38" delta="+6" deltaPositive icon={<CalendarCheck2 className="h-4 w-4" />} accent="primary" />
        <KpiCard label="Forecast Occ (7d)" value="74%" icon={<BedDouble className="h-4 w-4" />} accent="info" />
        <KpiCard label="ADR" value={ugx(285000)} delta="+2.1%" deltaPositive icon={<TrendingUp className="h-4 w-4" />} accent="success" />
        <KpiCard label="Cancellations" value="3" delta="-2 vs. wk" icon={<CalendarX2 className="h-4 w-4" />} accent="warning" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="7-day occupancy forecast" className="lg:col-span-2"><OccupancyChart /></Card>
        <Card title="Channels"><RevenueBars labels={["Direct","OTA","Corporate"]} values={[55,30,15]} /></Card>
      </div>
    </>
  );
}

function AccountantDashboard() {
  return (
    <>
      {/* CTA buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to="/billing" search={{ folio: undefined, invoice: undefined }} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"><Receipt className="h-3.5 w-3.5" /> View Billing <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/accounting" className="inline-flex items-center gap-1.5 rounded-lg bg-info/10 px-3.5 py-2 text-xs font-semibold text-info transition hover:bg-info/20"><Calculator className="h-3.5 w-3.5" /> Accounting <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/reports" className="inline-flex items-center gap-1.5 rounded-lg bg-warning/10 px-3.5 py-2 text-xs font-semibold text-warning transition hover:bg-warning/20"><BarChart3 className="h-3.5 w-3.5" /> Run Reports <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/audit" className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3.5 py-2 text-xs font-semibold text-success transition hover:bg-success/20"><FileSearch className="h-3.5 w-3.5" /> Audit Trail <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open folios" value="14" delta={ugx(8_240_000)} icon={<Receipt className="h-4 w-4" />} accent="primary" />
        <KpiCard label="Payments today" value={ugx(3_120_000)} delta="+12%" deltaPositive icon={<DollarSign className="h-4 w-4" />} accent="success" />
        <KpiCard label="Outstanding" value={ugx(5_120_000)} icon={<Wallet className="h-4 w-4" />} accent="warning" />
        <KpiCard label="Refunds" value={ugx(80_000)} icon={<ArrowDownRight className="h-4 w-4" />} accent="info" />
      </div>
      <Card title="Today's payments">
        <p className="text-sm text-muted-foreground">View detailed payment log in Billing.</p>
        <Link to="/billing" search={{ folio: undefined, invoice: undefined }} className="mt-3 inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Open billing →</Link>
      </Card>
    </>
  );
}

function SysadminDashboard() {
  return (
    <>
      {/* CTA buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to="/identity" className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"><Users className="h-3.5 w-3.5" /> Manage Users <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/audit" className="inline-flex items-center gap-1.5 rounded-lg bg-warning/10 px-3.5 py-2 text-xs font-semibold text-warning transition hover:bg-warning/20"><FileSearch className="h-3.5 w-3.5" /> Audit Log <ArrowRight className="h-3 w-3" /></Link>
        <Link to="/settings" className="inline-flex items-center gap-1.5 rounded-lg bg-info/10 px-3.5 py-2 text-xs font-semibold text-info transition hover:bg-info/20"><Settings className="h-3.5 w-3.5" /> System Settings <ArrowRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active users" value="24" icon={<Users className="h-4 w-4" />} accent="primary" />
        <KpiCard label="Roles" value="7" icon={<ShieldCheck className="h-4 w-4" />} accent="info" />
        <KpiCard label="Audit events (24h)" value="318" icon={<FileSearch className="h-4 w-4" />} accent="warning" />
        <KpiCard label="Failed logins" value="2" icon={<ShieldCheck className="h-4 w-4" />} accent="success" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Identity & Access" action={<Link to="/identity" className="text-xs text-primary">Manage →</Link>}>
          <p className="text-sm text-muted-foreground">Manage users, roles and permissions for property staff.</p>
        </Card>
        <Card title="Recent audit events" action={<Link to="/audit" className="text-xs text-primary">View log →</Link>}>
          <p className="text-sm text-muted-foreground">All folio edits, voids and role changes are logged.</p>
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
  label, value, delta, deltaPositive, icon, accent = "primary", extra,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon?: ReactNode;
  accent?: Accent;
  extra?: ReactNode;
}) {
  return (
    <div className="card-hover relative overflow-hidden rounded-xl border border-border bg-card p-5">
      <div
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: accentColor[accent], boxShadow: `0 0 10px ${accentColor[accent]}` }}
      />
      <div className="flex items-start justify-between pl-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-bold tracking-tight">{value}</p>
          {delta && (
            <p className={"mt-1 inline-flex items-center gap-1 text-[11px] font-medium " + (deltaPositive ? "text-success" : "text-muted-foreground")}>
              {deltaPositive ? <ArrowUpRight className="h-3 w-3" /> : null}
              {delta}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {extra}
          <span className={"grid h-9 w-9 place-items-center rounded-lg " + accentMap[accent]}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, action, className }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={"rounded-xl border border-border bg-card p-5 " + (className ?? "")}>
      <div className="mb-4 flex items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Ring({ percent }: { percent: number }) {
  return (
    <div className="-mr-1">
      <RadialBarChart
        width={44}
        height={44}
        data={[{ name: "Occupancy", value: percent }]}
        innerRadius="75%"
        outerRadius="100%"
        barSize={6}
        startAngle={90}
        endAngle={-270}
        cx="50%"
        cy="50%"
      >
        <RadialBar
          dataKey="value"
          fill="var(--color-primary)"
          cornerRadius={3}
          background={{ fill: "var(--color-muted)" }}
        />
        <text x={22} y={27} textAnchor="middle" className="fill-foreground text-[10px] font-bold">
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
        margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fillOccupancy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" className="rounded-xl" />} />
        <Area
          type="monotone"
          dataKey="occupancy"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          fill="url(#fillOccupancy)"
          dot={{ fill: "var(--color-card)", stroke: "var(--color-primary)", strokeWidth: 2.5, r: 4.5 }}
          activeDot={{ r: 6, stroke: "var(--color-primary)", strokeWidth: 2.5, fill: "var(--color-primary)" }}
        >
          <LabelList
            dataKey="occupancy"
            position="top"
            className="fill-foreground"
            fontSize={11}
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
      <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
        <XAxis dataKey="source" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
        <YAxis hide domain={[0, 100]} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="rounded-xl" />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={44}>
          {chartData.map((entry) => (
            <Cell key={entry.source} fill={colors[labels.indexOf(entry.source) % colors.length]} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            className="fill-foreground"
            fontSize={11}
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
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
        <SearchX className="mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No {kind === "arrival" ? "arrivals" : "departures"} today</p>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          {kind === "arrival" ? "No guests are scheduled to check in." : "All guests are staying another night."}
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Guest</th>
            <th className="px-3 py-2 text-left font-semibold">Room</th>
            <th className="px-3 py-2 text-left font-semibold">{kind === "arrival" ? "ETA" : "ETD"}</th>
            <th className="px-3 py-2 text-left font-semibold">Nts</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.name} className="hover:bg-muted/30">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {r.name.split(" ").map((s) => s[0]).join("").slice(0,2)}
                  </span>
                  <span className="font-medium">{r.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs">{r.room}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{r.time}</td>
              <td className="px-3 py-2.5">{r.nights}</td>
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
    Confirmed: "bg-success/10 text-success border-success/20",
    "Pre-paid": "bg-primary/10 text-primary border-primary/20",
    Pending: "bg-warning/10 text-warning border-warning/20",
    "Folio open": "bg-warning/10 text-warning border-warning/20",
    Cleared: "bg-success/10 text-success border-success/20",
  };
  return (
    <span className={"inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold " + (map[s] ?? "bg-muted text-muted-foreground border-border")}>
      {s}
    </span>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, string> = {
    High: "bg-destructive/10 text-destructive",
    Medium: "bg-warning/10 text-warning",
    Low: "bg-success/10 text-success",
  };
  return <span className={"rounded-md px-2 py-0.5 text-[10px] font-semibold " + (map[p] ?? "bg-muted text-muted-foreground")}>{p}</span>;
}
