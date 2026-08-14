import { useMemo, useState } from "react";
import {
  BarChart3, LogIn, LogOut, Users, XCircle, BedDouble, TrendingUp, DollarSign,
  CreditCard, Wallet, Receipt, Smartphone, Building2, Landmark, AlertTriangle, FileWarning,
  LayoutDashboard, ClipboardCheck, Store, Award, ArrowLeftRight, ScrollText, CalendarRange, Tag,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  fmtUGX,
  todayISO,
  folioBalance,
  folioById,
  roomTypeById,
  ratePlanById,
  roomById,
  PAYMENT_METHOD_LABEL,
  CHARGE_TYPE_LABEL,
  type Reservation,
  type FolioCharge,
  type PaymentMethod,
} from "@/lib/pms-store";

type ReportTab =
  | "overview"
  | "occupancy" | "arrivals" | "in-house" | "no-show"
  | "daily-revenue" | "rev-by-rateplan" | "rev-by-roomtype" | "rev-by-service" | "payment-breakdown" | "outstanding"
  | "efris-summary" | "efris-failed"
  | "room-status" | "hk-productivity"
  | "pos-sales" | "pos-best-items" | "pos-reconciliation" | "sales-by-staff" | "service-revenue"
  | "flash-report" | "period-comparison";

function tabGroup(tabId: ReportTab): { label: string; tabs: { id: ReportTab; label: string; icon: React.ComponentType<{ className?: string }> }[] } | undefined {
  return TAB_GROUPS.find((g) => g.tabs.some((t) => t.id === tabId));
}

const OCCUPANCY_TABS = [
  { id: "occupancy" as ReportTab, label: "Daily Occupancy", icon: BedDouble },
  { id: "arrivals" as ReportTab, label: "Arrivals / Departures", icon: LogIn },
  { id: "in-house" as ReportTab, label: "In-House Guests", icon: Users },
  { id: "no-show" as ReportTab, label: "No-Show / Cancellation", icon: XCircle },
];

const REVENUE_TABS = [
  { id: "daily-revenue" as ReportTab, label: "Daily Revenue", icon: DollarSign },
  { id: "rev-by-rateplan" as ReportTab, label: "Revenue by Rate Plan", icon: TrendingUp },
  { id: "rev-by-roomtype" as ReportTab, label: "Revenue by Room Type", icon: BedDouble },
  { id: "rev-by-service" as ReportTab, label: "Revenue by Service Dept", icon: Tag },
  { id: "payment-breakdown" as ReportTab, label: "Payment Method Breakdown", icon: CreditCard },
  { id: "outstanding" as ReportTab, label: "Outstanding Balances", icon: Landmark },
];

const EFRIS_TABS = [
  { id: "efris-summary" as ReportTab, label: "EFRIS Summary", icon: Receipt },
  { id: "efris-failed" as ReportTab, label: "Failed / Pending", icon: FileWarning },
];

const HK_TABS = [
  { id: "room-status" as ReportTab, label: "Room Status", icon: LayoutDashboard },
  { id: "hk-productivity" as ReportTab, label: "HK Productivity", icon: ClipboardCheck },
];

const POS_TABS = [
  { id: "pos-sales" as ReportTab, label: "Daily Sales by Outlet", icon: Store },
  { id: "pos-best-items" as ReportTab, label: "Best-Selling Items", icon: Award },
  { id: "sales-by-staff" as ReportTab, label: "Sales by Staff & Outlet", icon: Users },
  { id: "service-revenue" as ReportTab, label: "Service Revenue", icon: Tag },
  { id: "pos-reconciliation" as ReportTab, label: "POS-to-Room Reconciliation", icon: ArrowLeftRight },
];

const MANAGEMENT_TABS = [
  { id: "flash-report" as ReportTab, label: "Flash Report", icon: ScrollText },
  { id: "period-comparison" as ReportTab, label: "Period Comparison", icon: CalendarRange },
];

const TAB_GROUPS = [
  { label: "Occupancy & Front Desk", tabs: OCCUPANCY_TABS },
  { label: "Revenue & Billing", tabs: REVENUE_TABS },
  { label: "Tax & Compliance", tabs: EFRIS_TABS },
  { label: "Housekeeping", tabs: HK_TABS },
  { label: "Point of Sale", tabs: POS_TABS },
  { label: "Management", tabs: MANAGEMENT_TABS },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("overview");
  const group = tab !== "overview" ? tabGroup(tab) : undefined;
  const tenant = useStore((s) => s.tenant);
  const activeLabel = tab !== "overview" ? TAB_GROUPS.flatMap((g) => g.tabs).find((t) => t.id === tab)?.label : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-24">
      {/* Professional print stylesheet */}
      <style>{`
        @media print {
          html { color-scheme: light; }
          html.dark {
            --background: oklch(0.985 0.003 250) !important;
            --foreground: oklch(0.22 0.04 260) !important;
            --card: oklch(1 0 0) !important;
            --card-foreground: oklch(0.22 0.04 260) !important;
            --popover: oklch(1 0 0) !important;
            --popover-foreground: oklch(0.22 0.04 260) !important;
            --primary: oklch(0.49 0.18 264) !important;
            --primary-foreground: oklch(0.99 0 0) !important;
            --secondary: oklch(0.96 0.01 260) !important;
            --secondary-foreground: oklch(0.3 0.04 260) !important;
            --muted: oklch(0.96 0.01 260) !important;
            --muted-foreground: oklch(0.52 0.02 260) !important;
            --accent: oklch(0.95 0.02 260) !important;
            --accent-foreground: oklch(0.3 0.04 260) !important;
            --border: oklch(0.92 0.01 260) !important;
            --input: oklch(0.92 0.01 260) !important;
            --ring: oklch(0.49 0.18 264) !important;
            --success: oklch(0.55 0.14 152) !important;
            --warning: oklch(0.74 0.16 70) !important;
            --info: oklch(0.62 0.16 240) !important;
            --chart-1: oklch(0.49 0.18 264) !important;
            --chart-2: oklch(0.55 0.14 152) !important;
            --chart-3: oklch(0.74 0.16 70) !important;
            --chart-4: oklch(0.6 0.22 27) !important;
            --chart-5: oklch(0.6 0.18 295) !important;
          }
          @page {
            size: A4;
            margin: 16mm 14mm;
            @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: #64748b; }
            @top-right { content: "Jambo PMS"; font-size: 9px; color: #64748b; }
          }
          body { background: #fff !important; }
          aside, header, nav { display: none !important; }
          main { padding: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tr { break-inside: avoid; }
          svg { max-width: 100% !important; }
          .recharts-wrapper { margin: 0 auto; }
        }
      `}</style>

      {/* Header with breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/20">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => setTab("overview")} className="hover:text-foreground transition-colors">Reports</button>
            {group && (
              <>
                <span>/</span>
                <span className="text-foreground font-medium">{group.label}</span>
              </>
            )}
          </div>
          {group ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {group.tabs.length} report{group.tabs.length !== 1 ? "s" : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Select a category to explore reports
            </p>
          )}
        </div>
        {tab !== "overview" && (
          <button
            onClick={() => window.print()}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground print:hidden"
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </button>
        )}
      </div>

      {/* Print-only professional header */}
      {tab !== "overview" && (
        <div className="hidden print:block">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-lg font-bold leading-tight">{tenant.businessName ?? tenant.name}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-foreground/60">
                {[tenant.address, tenant.streetAddress, tenant.city, tenant.country].filter(Boolean).join(" · ")}
                {tenant.phone ? ` · ${tenant.phone}` : ""}
                {tenant.tin ? ` · TIN: ${tenant.tin}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/60">{group?.label}</p>
              <h1 className="text-2xl font-bold">{activeLabel}</h1>
              <p className="mt-0.5 text-[10px] text-foreground/60">
                Generated {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Jambo PMS
              </p>
            </div>
          </div>
          <div className="mt-3 border-b-2 border-foreground" />
        </div>
      )}

      {/* Sub-navigation tabs - only show when a group is active */}
      {group && (
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-sm print:hidden">
          {group.tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Report content */}
      {tab === "overview" && <ReportsOverview onSelect={(id) => setTab(id)} />}
      {tab !== "overview" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {tab === "occupancy" && <OccupancyReport />}
          {tab === "arrivals" && <ArrivalsDeparturesReport />}
          {tab === "in-house" && <InHouseGuestList />}
          {tab === "no-show" && <NoShowCancellationReport />}
          {tab === "daily-revenue" && <DailyRevenueReport />}
          {tab === "rev-by-rateplan" && <RevenueByRatePlan />}
          {tab === "rev-by-roomtype" && <RevenueByRoomType />}
          {tab === "rev-by-service" && <RevenueByServiceDept />}
          {tab === "payment-breakdown" && <PaymentBreakdown />}
          {tab === "outstanding" && <OutstandingBalances />}
          {tab === "efris-summary" && <EFRISSummaryReport />}
          {tab === "efris-failed" && <EFRISFailedPendingReport />}
          {tab === "room-status" && <RoomStatusReport />}
          {tab === "hk-productivity" && <HkProductivityReport />}
          {tab === "pos-sales" && <PosDailySalesReport />}
          {tab === "pos-best-items" && <PosBestSellingItemsReport />}
          {tab === "sales-by-staff" && <SalesByStaffMatrix />}
          {tab === "service-revenue" && <RevenueByServiceDept />}
          {tab === "pos-reconciliation" && <PosReconciliationReport />}
          {tab === "flash-report" && <FlashReport />}
          {tab === "period-comparison" && <PeriodComparison />}
        </div>
      )}
    </div>
  );
}

/* ============================== REPORTS OVERVIEW ============================== */

const GROUP_DESCRIPTIONS: Record<string, string> = {
  "Occupancy & Front Desk": "Daily occupancy, arrivals/departures, in-house guests, and no-show tracking",
  "Revenue & Billing": "Daily revenue, rate plan analysis, room type revenue, payment breakdowns, and outstanding balances",
  "Tax & Compliance": "EFRIS summary and failed/pending transaction monitoring for URA compliance",
  "Housekeeping": "Real-time room status snapshot and housekeeper productivity metrics",
  "Point of Sale": "Sales by outlet, staff & outlet matrix, service revenue, best-selling menu items, and POS-to-room charge reconciliation",
};

function ReportsOverview({ onSelect }: { onSelect: (tabId: ReportTab) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TAB_GROUPS.map((group) => {
          const Icon = group.tabs[0]?.icon ?? BarChart3;
          const description = GROUP_DESCRIPTIONS[group.label] ?? "";
          return (
            <button
              key={group.label}
              onClick={() => onSelect(group.tabs[0].id)}
              className="group rounded-2xl border border-border/50 bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-base font-semibold">{group.label}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{description}</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
                <span>{group.tabs.length} report{group.tabs.length !== 1 ? "s" : ""}</span>
                <span>&rarr;</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick stats footer */}
      <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-3">All Reports</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TAB_GROUPS.flatMap((g) =>
            g.tabs.map((t) => {
              const Icon = t.icon;
              const activeGroup = tabGroup(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-4 py-2.5 text-left text-sm transition-colors hover:border-border hover:bg-muted/30"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.label}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/50">{activeGroup?.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== Daily Occupancy Report ============================== */

function OccupancyReport() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const reservations = useStore((s) => s.reservations);

  const activeRooms = useMemo(() => rooms.filter((r) => r.isActive), [rooms]);

  const report = useMemo(() => {
    const totalRooms = activeRooms.length;
    const typeMap = new Map(roomTypes.map((rt) => [rt.id, rt]));

    const roomsByTypeId = new Map<string, number>();
    activeRooms.forEach((r) => {
      roomsByTypeId.set(r.roomTypeId, (roomsByTypeId.get(r.roomTypeId) ?? 0) + 1);
    });

    const soldSet = new Set<string>();
    reservations.forEach((r) => {
      if (r.status === "cancelled" || r.status === "no_show") return;
      if (r.checkIn <= to && r.checkOut > from && r.roomId) {
        soldSet.add(r.roomId);
      }
    });
    const roomsSold = soldSet.size;

    const byType = Array.from(roomsByTypeId.entries())
      .map(([roomTypeId, total]) => {
        const rt = typeMap.get(roomTypeId);
        const sold = reservations.filter((r) => {
          if (r.status === "cancelled" || r.status === "no_show") return false;
          return r.checkIn <= to && r.checkOut > from && r.roomTypeId === roomTypeId;
        }).length;
        return {
          roomTypeId,
          roomTypeName: rt?.name ?? roomTypeId,
          total,
          sold,
          occupancyPct: total > 0 ? Math.round((sold / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { totalRooms, roomsSold, occupancyPct: totalRooms > 0 ? Math.round((roomsSold / totalRooms) * 100) : 0, byType };
  }, [activeRooms, roomTypes, reservations, from, to]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm print:hidden">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Rooms" value={report.totalRooms.toString()} />
        <StatCard label="Rooms Sold" value={report.roomsSold.toString()} />
        <StatCard label="Occupancy %" value={`${report.occupancyPct}%`} highlight={report.occupancyPct >= 80 ? "success" : report.occupancyPct >= 50 ? "warning" : undefined} />
      </div>

      <TableCard title="Breakdown by Room Type">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
              <th className="px-6 py-3">Room Type</th>
              <th className="px-6 py-3 text-right">Total Rooms</th>
              <th className="px-6 py-3 text-right">Sold</th>
              <th className="px-6 py-3 text-right">Occupancy %</th>
              <th className="px-6 py-3">Bar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {report.byType.map((row) => (
              <tr key={row.roomTypeId} className="transition-colors hover:bg-muted/20">
                <td className="px-6 py-3 font-medium">{row.roomTypeName}</td>
                <td className="px-6 py-3 text-right tabular-nums">{row.total}</td>
                <td className="px-6 py-3 text-right tabular-nums">{row.sold}</td>
                <td className="px-6 py-3 text-right tabular-nums font-semibold">{row.occupancyPct}%</td>
                <td className="px-6 py-3">
                  <div className="flex h-2 w-32 overflow-hidden rounded-full bg-muted">
                    <div className={cn("rounded-full transition-all", row.occupancyPct >= 80 ? "bg-success" : row.occupancyPct >= 50 ? "bg-warning" : "bg-muted-foreground/30")} style={{ width: `${row.occupancyPct}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ============================== Arrivals / Departures Report ============================== */

function ArrivalsDeparturesReport() {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);

  const roomTypeMap = useMemo(() => new Map(roomTypes.map((rt) => [rt.id, rt.name])), [roomTypes]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r.roomNumber])), [rooms]);

  const arrivals = useMemo(() => reservations.filter((r) => r.checkIn === date && r.status !== "cancelled" && r.status !== "no_show").sort((a, b) => a.guestName.localeCompare(b.guestName)), [reservations, date]);
  const departures = useMemo(() => reservations.filter((r) => r.checkOut === date && r.status !== "cancelled" && r.status !== "no_show").sort((a, b) => a.guestName.localeCompare(b.guestName)), [reservations, date]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm print:hidden">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <GuestPanel title="Arrivals" count={arrivals.length} icon={LogIn} headerColor="bg-success/5" iconColor="text-success">
          {arrivals.map((r) => (
            <GuestRow key={r.id} guestName={r.guestName} detail={`${roomTypeMap.get(r.roomTypeId) ?? r.roomTypeId} · Room ${r.roomId ? roomMap.get(r.roomId) ?? r.roomId : "—"} · ${r.adults}A${r.children > 0 ? ` ${r.children}C` : ""}`} />
          ))}
        </GuestPanel>
        <GuestPanel title="Departures" count={departures.length} icon={LogOut} headerColor="bg-warning/5" iconColor="text-warning">
          {departures.map((r) => (
            <GuestRow key={r.id} guestName={r.guestName} detail={`Room ${r.roomId ? roomMap.get(r.roomId) ?? r.roomId : "—"} · ${fmtUGX(r.ratePerNight)}/night`} />
          ))}
        </GuestPanel>
      </div>
    </div>
  );
}

/* ============================== In-House Guest List ============================== */

function InHouseGuestList() {
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);

  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r.roomNumber])), [rooms]);
  const roomTypeMap = useMemo(() => new Map(roomTypes.map((rt) => [rt.id, rt.name])), [roomTypes]);

  const inHouse = useMemo(() => reservations.filter((r) => r.status === "checked_in").sort((a, b) => a.guestName.localeCompare(b.guestName)), [reservations]);
  const guestsWithBalance = useMemo(() => inHouse.map((r) => ({ ...r, balance: r.folioId ? folioBalance(r.folioId) : 0 })), [inHouse]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
        <Users className="h-5 w-5 text-primary" />
        <span className="text-sm"><strong className="text-foreground">{inHouse.length}</strong> <span className="text-muted-foreground">guest{inHouse.length !== 1 ? "s" : ""} currently in house</span></span>
      </div>
      {inHouse.length === 0 ? (
        <EmptyState icon={Users} message="No guests in house" />
      ) : (
        <TableCard>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">Guest Name</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Room Type</th>
                <th className="px-6 py-3">Check-Out</th>
                <th className="px-6 py-3 text-right">Rate</th>
                <th className="px-6 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {guestsWithBalance.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-3 font-medium">{r.guestName}</td>
                  <td className="px-6 py-3 tabular-nums">{r.roomId ? roomMap.get(r.roomId) ?? r.roomId : "—"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{roomTypeMap.get(r.roomTypeId) ?? r.roomTypeId}</td>
                  <td className="px-6 py-3 tabular-nums">{r.checkOut}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{fmtUGX(r.ratePerNight)}</td>
                  <td className={cn("px-6 py-3 text-right tabular-nums font-semibold", r.balance > 0 ? "text-destructive" : "text-success")}>{r.balance > 0 ? fmtUGX(r.balance) : "Settled"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}

/* ============================== No-Show / Cancellation Report ============================== */

function NoShowCancellationReport() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);

  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r.roomNumber])), [rooms]);
  const roomTypeMap = useMemo(() => new Map(roomTypes.map((rt) => [rt.id, rt.name])), [roomTypes]);

  const entries = useMemo(() => {
    return reservations
      .filter((r) => {
        if (r.status !== "cancelled" && r.status !== "no_show") return false;
        const eventDate = r.status === "cancelled" ? r.cancelledAt : r.noShowDeclaredAt;
        if (!eventDate) return false;
        const day = eventDate.slice(0, 10);
        return day >= from && day <= to;
      })
      .sort((a, b) => {
        const aDate = a.status === "cancelled" ? a.cancelledAt : a.noShowDeclaredAt;
        const bDate = b.status === "cancelled" ? b.cancelledAt : b.noShowDeclaredAt;
        return (bDate ?? "").localeCompare(aDate ?? "");
      })
      .map((r) => ({
        ...r,
        eventDate: (r.status === "cancelled" ? r.cancelledAt : r.noShowDeclaredAt) ?? "",
        reason: r.status === "cancelled" ? (r.cancellationReason ?? "—") : "No-show declared",
      }));
  }, [reservations, from, to]);

  const totals = useMemo(() => ({
    cancelled: entries.filter((r) => r.status === "cancelled").length,
    noShow: entries.filter((r) => r.status === "no_show").length,
    total: entries.length,
  }), [entries]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      {entries.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total" value={totals.total.toString()} />
          <StatCard label="Cancelled" value={totals.cancelled.toString()} highlight="destructive" />
          <StatCard label="No-Shows" value={totals.noShow.toString()} highlight="warning" />
        </div>
      )}
      {entries.length === 0 ? (
        <EmptyState icon={XCircle} message="No cancellations or no-shows in this period" />
      ) : (
        <TableCard>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Guest Name</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Room Type</th>
                <th className="px-6 py-3">Check-In</th>
                <th className="px-6 py-3">Check-Out</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {entries.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-3">
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", r.status === "cancelled" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/30 bg-warning/10 text-warning")}>
                      {r.status === "cancelled" ? "Cancelled" : "No-Show"}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-medium">{r.guestName}</td>
                  <td className="px-6 py-3 tabular-nums">{r.roomId ? roomMap.get(r.roomId) ?? r.roomId : "—"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{roomTypeMap.get(r.roomTypeId) ?? r.roomTypeId}</td>
                  <td className="px-6 py-3 tabular-nums">{r.checkIn}</td>
                  <td className="px-6 py-3 tabular-nums">{r.checkOut}</td>
                  <td className="px-6 py-3 tabular-nums text-muted-foreground">{r.eventDate.slice(0, 10)}</td>
                  <td className="px-6 py-3 text-muted-foreground max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}

/* ============================== DAILY REVENUE REPORT (Night Audit Summary) ============================== */

function DailyRevenueReport() {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);

  const report = useMemo(() => {
    const dayCharges = charges.filter((c) => c.date === date);
    const dayPayments = payments.filter((p) => p.date === date && p.status === "confirmed");

    const roomRev = dayCharges.filter((c) => c.type === "room").reduce((s, c) => s + c.amount, 0);
    const fnbRev = dayCharges.filter((c) => c.type === "fnb").reduce((s, c) => s + c.amount, 0);
    const miscRev = dayCharges.filter((c) => c.type === "misc").reduce((s, c) => s + c.amount, 0);
    const taxTotal = dayCharges.filter((c) => c.type === "tax").reduce((s, c) => s + c.amount, 0);
    const discountTotal = dayCharges.filter((c) => c.type === "discount").reduce((s, c) => s + c.amount, 0);
    const grossRevenue = roomRev + fnbRev + miscRev;
    const netRevenue = grossRevenue + discountTotal;

    const totalPayments = dayPayments.reduce((s, p) => s + p.amount, 0);

    return { roomRev, fnbRev, miscRev, taxTotal, discountTotal, grossRevenue, netRevenue, totalPayments };
  }, [charges, payments, date]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm print:hidden">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Room Revenue" value={fmtUGX(report.roomRev)} />
        <StatCard label="F&B Revenue" value={fmtUGX(report.fnbRev)} />
        <StatCard label="Misc Revenue" value={fmtUGX(report.miscRev)} />
        <StatCard label="Taxes" value={fmtUGX(report.taxTotal)} />
      </div>

      <TableCard title="Night Audit Summary">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border/40">
            <Row label="Room Revenue" value={report.roomRev} />
            <Row label="Food & Beverage" value={report.fnbRev} />
            <Row label="Miscellaneous" value={report.miscRev} />
            <Row label="Gross Revenue" value={report.grossRevenue} bold />
            <Row label="Discounts" value={report.discountTotal} />
            <Row label="Net Revenue" value={report.netRevenue} bold highlight={report.netRevenue >= 0 ? "success" : "destructive"} />
            <Row label="Tax Collected" value={report.taxTotal} />
            <Row label="Total Payments Received" value={report.totalPayments} bold />
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ============================== REVENUE BY RATE PLAN ============================== */

function RevenueByRatePlan() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const charges = useStore((s) => s.charges);
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const ratePlans = useStore((s) => s.ratePlans);

  const report = useMemo(() => {
    const folioResMap = new Map(folios.filter((f) => f.reservationId).map((f) => [f.id, f.reservationId]));
    const resRatePlanMap = new Map<string, string>();
    reservations.forEach((r) => {
      const rp = ratePlanForReservation(r, ratePlans);
      if (rp) resRatePlanMap.set(r.id, rp);
    });

    const byPlan = new Map<string, number>();
    const dateRange = dateList(from, to);
    charges
      .filter((c) => c.type !== "discount" && dateRange.includes(c.date))
      .forEach((c) => {
        const resId = folioResMap.get(c.folioId);
        const plan = resId ? resRatePlanMap.get(resId) : undefined;
        const key = plan ?? "Unknown";
        byPlan.set(key, (byPlan.get(key) ?? 0) + c.amount);
      });

    const total = Array.from(byPlan.values()).reduce((s, v) => s + v, 0);
    return Array.from(byPlan.entries())
      .map(([name, amount]) => ({ name, amount, pct: total > 0 ? Math.round((amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [charges, folios, reservations, ratePlans, from, to]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      {report.length === 0 ? (
        <EmptyState icon={TrendingUp} message="No revenue data for this period" />
      ) : (
        <TableCard title="Revenue by Rate Plan">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">Rate Plan</th>
                <th className="px-6 py-3 text-right">Revenue</th>
                <th className="px-6 py-3 text-right">Share</th>
                <th className="px-6 py-3">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {report.map((row) => (
                <tr key={row.name} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-3 font-medium">{row.name}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold">{fmtUGX(row.amount)}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">{row.pct}%</td>
                  <td className="px-6 py-3">
                    <div className="flex h-2 w-32 overflow-hidden rounded-full bg-muted">
                      <div className="rounded-full bg-primary" style={{ width: `${row.pct}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}

/* ============================== REVENUE BY ROOM TYPE ============================== */

function RevenueByRoomType() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const charges = useStore((s) => s.charges);
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const roomTypes = useStore((s) => s.roomTypes);

  const report = useMemo(() => {
    const folioResMap = new Map(folios.filter((f) => f.reservationId).map((f) => [f.id, f.reservationId]));
    const resRoomTypeMap = new Map(reservations.map((r) => [r.id, r.roomTypeId]));
    const rtNameMap = new Map(roomTypes.map((rt) => [rt.id, rt.name]));
    const dateRange = dateList(from, to);

    const byType = new Map<string, number>();
    const byTypeRoom = new Map<string, number>();

    charges
      .filter((c) => c.type === "room" && dateRange.includes(c.date))
      .forEach((c) => {
        const resId = folioResMap.get(c.folioId);
        const rtId = resId ? resRoomTypeMap.get(resId) : undefined;
        const key = rtNameMap.get(rtId ?? "") ?? rtId ?? "Unknown";
        byType.set(key, (byType.get(key) ?? 0) + c.amount);
        byTypeRoom.set(key, (byTypeRoom.get(key) ?? 0) + 1);
      });

    const total = Array.from(byType.values()).reduce((s, v) => s + v, 0);
    return Array.from(byType.entries())
      .map(([name, amount]) => ({ name, amount, rooms: byTypeRoom.get(name) ?? 0, pct: total > 0 ? Math.round((amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [charges, folios, reservations, roomTypes, from, to]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      {report.length === 0 ? (
        <EmptyState icon={BedDouble} message="No room revenue for this period" />
      ) : (
        <TableCard title="Revenue by Room Type">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">Room Type</th>
                <th className="px-6 py-3 text-right">Room Nights</th>
                <th className="px-6 py-3 text-right">Revenue</th>
                <th className="px-6 py-3 text-right">Share</th>
                <th className="px-6 py-3">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {report.map((row) => (
                <tr key={row.name} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-3 font-medium">{row.name}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{row.rooms}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold">{fmtUGX(row.amount)}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">{row.pct}%</td>
                  <td className="px-6 py-3">
                    <div className="flex h-2 w-32 overflow-hidden rounded-full bg-muted">
                      <div className="rounded-full bg-primary" style={{ width: `${row.pct}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}

/* ============================== REVENUE BY SERVICE DEPARTMENT ============================== */

function RevenueByServiceDept() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const charges = useStore((s) => s.charges);
  const items = useStore((s) => s.miscChargeItems);

  const deptLabels: Record<string, string> = {
    POOL: "Pool", KPOOL: "Kids Pool", REC: "Recreation",
    BIZ: "Business Center", CONF: "Conference",
    HC: "Health Club", SPA: "Spa", REST: "Restaurant", BAR: "Bar", MISC: "Misc",
  };
  const deptOrder = ["POOL", "KPOOL", "REC", "BIZ", "CONF", "HC", "SPA", "REST", "BAR", "MISC"];

  const rows = useMemo(() => {
    const filtered = charges.filter((c) => c.type === "misc" && c.date >= from && c.date <= to);
    const itemMap = new Map(items.map((i) => [i.name, i]));
    const byDept: Record<string, { count: number; total: number }> = {};
    for (const c of filtered) {
      const dept = itemMap.get(c.description)?.departmentCode ?? "MISC";
      if (!byDept[dept]) byDept[dept] = { count: 0, total: 0 };
      byDept[dept].count++;
      byDept[dept].total += c.amount;
    }
    return deptOrder.filter((d) => byDept[d]).map((d) => ({ dept: d, label: deptLabels[d] ?? d, ...byDept[d] }));
  }, [charges, items, from, to]);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return (
    <TableCard title="Revenue by Service Department">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right">Charges</th>
              <th className="px-4 py-3 text-right">Total Revenue</th>
              <th className="px-4 py-3 text-right">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dept} className="border-t">
                <td className="px-4 py-3 font-medium">{r.label}</td>
                <td className="px-4 py-3 text-right">{r.count}</td>
                <td className="px-4 py-3 text-right font-mono">{fmtUGX(r.total)}</td>
                <td className="px-4 py-3 text-right">{grandTotal > 0 ? ((r.total / grandTotal) * 100).toFixed(1) : "0.0"}%</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No misc charges in this period</td></tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50 font-medium">
            <tr>
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.count, 0)}</td>
              <td className="px-4 py-3 text-right font-mono">{fmtUGX(grandTotal)}</td>
              <td className="px-4 py-3 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </TableCard>
  );
}

/* ============================== PAYMENT METHOD BREAKDOWN ============================== */

function PaymentBreakdown() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const payments = useStore((s) => s.payments);

  const report = useMemo(() => {
    const dateRange = dateList(from, to);
    const filtered = payments.filter((p) => p.status === "confirmed" && dateRange.includes(p.date));

    const byMethod = new Map<PaymentMethod, number>();
    filtered.forEach((p) => byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount));

    const total = Array.from(byMethod.values()).reduce((s, v) => s + v, 0);
    const methodConfigs: { method: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
      { method: "cash", label: "Cash", icon: Wallet },
      { method: "mtn_momo", label: "MTN Mobile Money", icon: Smartphone },
      { method: "airtel_money", label: "Airtel Money", icon: Smartphone },
      { method: "card", label: "Card", icon: CreditCard },
      { method: "bank_transfer", label: "Bank Transfer", icon: Building2 },
    ];
    const methods = methodConfigs.map((m) => ({
      method: m.method,
      label: m.label,
      icon: m.icon,
      amount: byMethod.get(m.method) ?? 0,
      pct: total > 0 ? Math.round(((byMethod.get(m.method) ?? 0) / total) * 100) : 0,
    }));

    return { total, methods };
  }, [payments, from, to]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      <StatCard label="Total Payments Collected" value={fmtUGX(report.total)} />
      {report.total === 0 ? (
        <EmptyState icon={CreditCard} message="No payments in this period" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {report.methods.filter((m) => m.amount > 0).map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.method} className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.pct}% of total</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold tabular-nums">{fmtUGX(m.amount)}</p>
                </div>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
                  <div className="rounded-full bg-primary" style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <TableCard title="Payment Method Detail">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
              <th className="px-6 py-3">Method</th>
              <th className="px-6 py-3 text-right">Amount</th>
              <th className="px-6 py-3 text-right">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {report.methods.map((m) => (
              <tr key={m.method} className="transition-colors hover:bg-muted/20">
                <td className="px-6 py-3 font-medium">{m.label}</td>
                <td className="px-6 py-3 text-right tabular-nums font-semibold">{fmtUGX(m.amount)}</td>
                <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">{m.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ============================== OUTSTANDING BALANCES / ACCOUNTS RECEIVABLE ============================== */

function OutstandingBalances() {
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);

  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r.roomNumber])), [rooms]);
  const roomTypeMap = useMemo(() => new Map(roomTypes.map((rt) => [rt.id, rt.name])), [roomTypes]);
  const resMap = useMemo(() => new Map(reservations.map((r) => [r.id, r])), [reservations]);

  const outstanding = useMemo(() => {
    return folios
      .filter((f) => f.status === "open")
      .map((f) => {
        const balance = folioBalance(f.id);
        const res = f.reservationId ? resMap.get(f.reservationId) : undefined;
        return { folio: f, balance, reservation: res };
      })
      .filter((x) => x.balance > 0.5)
      .sort((a, b) => b.balance - a.balance);
  }, [folios, resMap]);

  const totals = useMemo(() => ({
    count: outstanding.length,
    totalOutstanding: outstanding.reduce((s, x) => s + x.balance, 0),
    totalCharges: outstanding.reduce((s, x) => s + (x.folio.totalCharges ?? 0), 0),
  }), [outstanding]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding Folios" value={totals.count.toString()} />
        <StatCard label="Total Outstanding" value={fmtUGX(totals.totalOutstanding)} highlight="destructive" />
        <StatCard label="Total Charges" value={fmtUGX(totals.totalCharges)} />
      </div>

      {outstanding.length === 0 ? (
        <EmptyState icon={Landmark} message="No outstanding balances — all folios are settled" />
      ) : (
        <TableCard title="Accounts Receivable">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">Guest</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Room Type</th>
                <th className="px-6 py-3">Check-Out</th>
                <th className="px-6 py-3">Folio</th>
                <th className="px-6 py-3 text-right">Balance</th>
                <th className="px-6 py-3">Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {outstanding.map((x) => (
                <tr key={x.folio.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-3 font-medium">{x.reservation?.guestName ?? "—"}</td>
                  <td className="px-6 py-3 tabular-nums">{x.reservation?.roomId ? roomMap.get(x.reservation.roomId) ?? x.reservation.roomId : "—"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{x.reservation ? roomTypeMap.get(x.reservation.roomTypeId) ?? x.reservation.roomTypeId : "—"}</td>
                  <td className="px-6 py-3 tabular-nums">{x.reservation?.checkOut ?? "—"}</td>
                  <td className="px-6 py-3 tabular-nums text-xs text-muted-foreground">{x.folio.id}</td>
                  <td className={cn("px-6 py-3 text-right tabular-nums font-semibold", "text-destructive")}>{fmtUGX(x.balance)}</td>
                  <td className="px-6 py-3">
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", x.folio.billingArrangement === "city_ledger" ? "border-info/30 bg-info/10 text-info" : x.folio.billingArrangement === "agent_ledger" ? "border-amber/30 bg-amber/10 text-amber" : "border-border/60 bg-muted/30 text-muted-foreground")}>
                      {x.folio.billingArrangement === "city_ledger" ? "City Ledger" : x.folio.billingArrangement === "agent_ledger" ? "Agent Ledger" : "Pay at Checkout"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}

/* ============================== EFRIS SUMMARY REPORT ============================== */

function EFRISSummaryReport() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const invoices = useStore((s) => s.invoices);
  const properties = useStore((s) => s.properties);
  const currentPropertyId = useStore((s) => s.currentPropertyId);

  const property = useMemo(() => properties.find((p) => p.id === currentPropertyId), [properties, currentPropertyId]);

  const report = useMemo(() => {
    const dateRange = dateList(from, to);
    const filtered = invoices.filter(
      (inv) => !inv.isProforma && !inv.isCreditNote && dateRange.includes(inv.issuedAt.slice(0, 10)),
    );

    const totalInvoices = filtered.length;
    const totalTaxable = filtered.reduce((s, inv) => s + (inv.totalTaxable ?? 0), 0);
    const totalVat = filtered.reduce((s, inv) => s + (inv.totalVat ?? 0), 0);
    const totalAmount = filtered.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0);

    const byStatus: Record<string, number> = { confirmed: 0, pending: 0, failed: 0, submitted: 0 };
    const byStatusAmount: Record<string, number> = { confirmed: 0, pending: 0, failed: 0, submitted: 0 };
    filtered.forEach((inv) => {
      byStatus[inv.eFRISStatus] = (byStatus[inv.eFRISStatus] ?? 0) + 1;
      byStatusAmount[inv.eFRISStatus] = (byStatusAmount[inv.eFRISStatus] ?? 0) + (inv.totalAmount ?? 0);
    });

    return { totalInvoices, totalTaxable, totalVat, totalAmount, byStatus, byStatusAmount };
  }, [invoices, from, to]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Property TIN" value={property?.tin ?? "—"} />
        <StatCard label="EFRIS Device No" value={property?.efrisDeviceNo ?? "—"} />
        <StatCard label="VAT Rate" value={property?.vatRate != null ? `${(property.vatRate * 100).toFixed(0)}%` : "—"} />
        <StatCard label="Total Invoices" value={String(report.totalInvoices)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Taxable Sales" value={fmtUGX(report.totalTaxable)} />
        <StatCard label="Total VAT Collected" value={fmtUGX(report.totalVat)} />
        <StatCard label="Total Invoice Amount" value={fmtUGX(report.totalAmount)} />
      </div>

      <TableCard title="EFRIS Submission Status Breakdown">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Count</th>
              <th className="px-6 py-3 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {(["confirmed", "submitted", "pending", "failed"] as const).map((status) => (
              <tr key={status} className="transition-colors hover:bg-muted/20">
                <td className="px-6 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    status === "confirmed" && "bg-success/10 text-success",
                    status === "submitted" && "bg-blue-500/10 text-blue-600",
                    status === "pending" && "bg-warning/10 text-warning",
                    status === "failed" && "bg-destructive/10 text-destructive",
                  )}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-3 text-right tabular-nums">{report.byStatus[status] ?? 0}</td>
                <td className="px-6 py-3 text-right tabular-nums">{fmtUGX(report.byStatusAmount[status] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ============================== EFRIS FAILED / PENDING TRANSACTIONS ============================== */

function EFRISFailedPendingReport() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const invoices = useStore((s) => s.invoices);

  const report = useMemo(() => {
    const dateRange = dateList(from, to);
    return invoices.filter(
      (inv) =>
        !inv.isProforma &&
        !inv.isCreditNote &&
        dateRange.includes(inv.issuedAt.slice(0, 10)) &&
        (inv.eFRISStatus === "failed" || inv.eFRISStatus === "pending"),
    );
  }, [invoices, from, to]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      {report.length === 0 ? (
        <EmptyState icon={Receipt} message="All invoices synced successfully with EFRIS" />
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-medium text-destructive">
              {report.length} invoice{report.length !== 1 ? "s" : ""} need{report.length === 1 ? "s" : ""} attention
            </span>
          </div>

          <TableCard title="Failed / Pending EFRIS Transactions">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-6 py-3">Invoice No</th>
                  <th className="px-6 py-3">Guest</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">EFRIS Status</th>
                  <th className="px-6 py-3">Fiscal No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {report.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-6 py-3 font-mono text-xs font-medium">{inv.invoiceNo}</td>
                    <td className="px-6 py-3">{inv.guestName}</td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{inv.issuedAt.slice(0, 10)}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{fmtUGX(inv.totalAmount)}</td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        inv.eFRISStatus === "failed" && "bg-destructive/10 text-destructive",
                        inv.eFRISStatus === "pending" && "bg-warning/10 text-warning",
                      )}>
                        {inv.eFRISStatus.charAt(0).toUpperCase() + inv.eFRISStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{inv.eFRISFiscalNo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </>
      )}
    </div>
  );
}

/* ============================== ROOM STATUS REPORT ============================== */

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: "Available",   color: "text-emerald-600",    bg: "bg-emerald-50 border-emerald-200" },
  occupied:    { label: "Occupied",    color: "text-blue-600",       bg: "bg-blue-50 border-blue-200" },
  dirty:       { label: "Dirty",       color: "text-red-600",        bg: "bg-red-50 border-red-200" },
  in_progress: { label: "In Progress", color: "text-amber-600",      bg: "bg-amber-50 border-amber-200" },
  clean:       { label: "Clean",       color: "text-sky-600",        bg: "bg-sky-50 border-sky-200" },
  inspected:   { label: "Inspected",   color: "text-emerald-600",    bg: "bg-emerald-50 border-emerald-300" },
  maintenance: { label: "Maintenance", color: "text-slate-600",      bg: "bg-slate-100 border-slate-300" },
  blocked:     { label: "Blocked",     color: "text-slate-600",      bg: "bg-slate-100 border-slate-300" },
};

function RoomStatusReport() {
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);

  const report = useMemo(() => {
    const activeRooms = rooms.filter((r) => r.isActive);
    const total = activeRooms.length;

    const byStatus: Record<string, number> = {};
    activeRooms.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    });

    const typeMap = new Map(roomTypes.map((rt) => [rt.id, rt.name]));
    const byTypeList = Array.from(
      activeRooms.reduce((m, r) => {
        const name = typeMap.get(r.roomTypeId) ?? r.roomTypeId;
        m.set(name, (m.get(name) ?? 0) + 1);
        return m;
      }, new Map<string, number>()),
    ).map(([name, count]) => ({ name, count }));

    return { total, byStatus, byTypeList };
  }, [rooms, roomTypes]);

  const statusOrder: string[] = ["available", "occupied", "dirty", "in_progress", "clean", "inspected", "maintenance", "blocked"];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Rooms" value={String(report.total)} />
        <StatCard label="Available" value={String(report.byStatus.available ?? 0)} highlight="success" />
        <StatCard label="Occupied" value={String(report.byStatus.occupied ?? 0)} />
        <StatCard label="Out of Order" value={String((report.byStatus.maintenance ?? 0) + (report.byStatus.blocked ?? 0))} highlight="destructive" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statusOrder.map((s) => {
          const meta = STATUS_META[s];
          const count = report.byStatus[s] ?? 0;
          return (
            <div key={s} className={cn("rounded-xl border px-4 py-3", meta.bg)}>
              <p className="text-xs font-medium text-muted-foreground">{meta.label}</p>
              <p className={cn("mt-0.5 text-2xl font-bold", meta.color)}>{count}</p>
            </div>
          );
        })}
      </div>

      {report.byTypeList.length > 0 && (
        <TableCard title="Rooms by Type">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">Room Type</th>
                <th className="px-6 py-3 text-right">Rooms</th>
                <th className="px-6 py-3">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {report.byTypeList.map((row) => {
                const pct = report.total > 0 ? Math.round((row.count / report.total) * 100) : 0;
                return (
                  <tr key={row.name} className="transition-colors hover:bg-muted/20">
                    <td className="px-6 py-3 font-medium">{row.name}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{row.count}</td>
                    <td className="px-6 py-3">
                      <div className="flex h-2 w-32 overflow-hidden rounded-full bg-muted">
                        <div className="rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}

/* ============================== HOUSEKEEPING PRODUCTIVITY REPORT ============================== */

function HkProductivityReport() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const tasks = useStore((s) => s.housekeepingTasks);
  const users = useStore((s) => s.users);

  const report = useMemo(() => {
    const dateRange = dateList(from, to);
    const completed = tasks.filter(
      (t) => t.completedAt && dateRange.includes(t.completedAt.slice(0, 10)),
    );

    const byStaff = new Map<string, { count: number }>();
    completed.forEach((t) => {
      if (!t.assignedTo) return;
      const entry = byStaff.get(t.assignedTo) ?? { count: 0 };
      entry.count++;
      byStaff.set(t.assignedTo, entry);
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      totalTasks: completed.length,
      staff: Array.from(byStaff.entries())
        .map(([userId, data]) => ({
          userId,
          staffName: userMap.get(userId)?.fullName ?? userId,
          department: userMap.get(userId)?.department,
          count: data.count,
          pct: completed.length > 0 ? Math.round((data.count / completed.length) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count),
      unassigned: completed.filter((t) => !t.assignedTo).length,
    };
  }, [tasks, users, from, to]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tasks Completed" value={String(report.totalTasks)} />
        <StatCard label="Staff with Tasks" value={String(report.staff.length)} />
        <StatCard label="Unassigned Tasks" value={String(report.unassigned)} highlight={report.unassigned > 0 ? "warning" : undefined} />
      </div>
      {report.totalTasks === 0 ? (
        <EmptyState icon={ClipboardCheck} message="No completed housekeeping tasks in this period" />
      ) : (
        <TableCard title="Rooms Cleaned per Staff Member">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">Staff</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3 text-right">Rooms Cleaned</th>
                <th className="px-6 py-3 text-right">Share</th>
                <th className="px-6 py-3">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {report.staff.map((s) => (
                <tr key={s.userId} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-3 font-medium">{s.staffName}</td>
                  <td className="px-6 py-3 text-xs text-muted-foreground">{s.department ?? "—"}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold">{s.count}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">{s.pct}%</td>
                  <td className="px-6 py-3">
                    <div className="flex h-2 w-32 overflow-hidden rounded-full bg-muted">
                      <div className="rounded-full bg-primary" style={{ width: `${s.pct}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}

/* ============================== POS DAILY SALES BY OUTLET ============================== */

function PosDailySalesReport() {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const posTabs = useStore((s) => s.posTabs);
  const posOutlets = useStore((s) => s.posOutlets);

  const report = useMemo(() => {
    const settled = posTabs.filter(
      (t) => (t.status === "settled" || t.status === "room_charged") && t.settledAt?.startsWith(date),
    );
    const outletMap = new Map(posOutlets.map((o) => [o.id, o]));
    const outletNames = new Map(posOutlets.filter((o) => o.isActive).map((o) => [o.id, o.name]));

    const byOutlet = new Map<string, { count: number; total: number; vat: number; svc: number; covers: number }>();
    settled.forEach((t) => {
      const entry = byOutlet.get(t.posOutletId) ?? { count: 0, total: 0, vat: 0, svc: 0, covers: 0 };
      entry.count++;
      entry.total += t.totalAmount;
      entry.vat += t.vatAmount;
      entry.svc += t.serviceChargeAmount;
      entry.covers += t.coverCount;
      byOutlet.set(t.posOutletId, entry);
    });

    const allOutlets = posOutlets
      .filter((o) => o.isActive)
      .map((o) => ({
        id: o.id,
        name: o.name,
        data: byOutlet.get(o.id) ?? { count: 0, total: 0, vat: 0, svc: 0, covers: 0 },
        svcPct: o.serviceChargePct,
      }));

    const grandTotal = allOutlets.reduce((s, o) => s + o.data.total, 0);

    return { allOutlets, grandTotal, totalTabs: settled.length };
  }, [posTabs, posOutlets, date]);

  const openTabs = useMemo(
    () => posTabs.filter((t) => t.status === "open" && t.openedAt.startsWith(date)).length,
    [posTabs, date],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm print:hidden">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Settled Tabs" value={String(report.totalTabs)} />
        <StatCard label="Open Tabs" value={String(openTabs)} />
        <StatCard label="Total Sales" value={fmtUGX(report.grandTotal)} />
        <StatCard label="Outlets" value={String(report.allOutlets.length)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {report.allOutlets.map((o) => (
          <div key={o.id} className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{o.name}</h3>
              <span className="text-xs text-muted-foreground">{o.data.count} tab{o.data.count !== 1 ? "s" : ""}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{fmtUGX(o.data.total)}</p>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span>{o.data.covers} covers</span>
              <span>VAT: {fmtUGX(o.data.vat)}</span>
              <span>SC @{o.svcPct}%: {fmtUGX(o.data.svc)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== SALES BY STAFF & OUTLET MATRIX ============================== */

function SalesByStaffMatrix() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const posTabs = useStore((s) => s.posTabs);
  const posOutlets = useStore((s) => s.posOutlets);

  const report = useMemo(() => {
    const dateRange = dateList(from, to);
    const settled = posTabs.filter(
      (t) => (t.status === "settled" || t.status === "room_charged") && t.settledAt && dateRange.includes(t.settledAt.slice(0, 10)),
    );

    const activeOutlets = posOutlets.filter((o) => o.isActive).sort((a, b) => a.name.localeCompare(b.name));

    const cellMap = new Map<string, number>();
    const staffSet = new Set<string>();

    settled.forEach((t) => {
      if (!t.settledBy) return;
      const key = `${t.settledBy}|${t.posOutletId}`;
      cellMap.set(key, (cellMap.get(key) ?? 0) + t.totalAmount);
      staffSet.add(t.settledBy);
    });

    const staffList = Array.from(staffSet).sort();

    const rows = staffList.map((staff) => {
      const cells = activeOutlets.map((o) => ({
        outletId: o.id,
        total: cellMap.get(`${staff}|${o.id}`) ?? 0,
      }));
      const rowTotal = cells.reduce((s, c) => s + c.total, 0);
      return { staff, cells, rowTotal };
    });

    const colTotals = activeOutlets.map((o) =>
      staffList.reduce((s, staff) => s + (cellMap.get(`${staff}|${o.id}`) ?? 0), 0),
    );

    const grandTotal = colTotals.reduce((s, t) => s + t, 0);

    return { rows, activeOutlets, colTotals, grandTotal, totalTabs: settled.length };
  }, [posTabs, posOutlets, from, to]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Revenue" value={fmtUGX(report.grandTotal)} />
        <StatCard label="Staff with Sales" value={String(report.rows.length)} />
        <StatCard label="Settled Tabs" value={String(report.totalTabs)} />
      </div>
      {report.rows.length === 0 ? (
        <EmptyState icon={Users} message="No settled POS tabs in this period" />
      ) : (
        <TableCard title="Sales by Staff & Outlet Matrix">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                  <th className="sticky left-0 z-10 bg-card px-4 py-3">Staff</th>
                  {report.activeOutlets.map((o) => (
                    <th key={o.id} className="px-4 py-3 text-right">{o.name}</th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {report.rows.map((row) => (
                  <tr key={row.staff} className="transition-colors hover:bg-muted/20">
                    <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium">{row.staff}</td>
                    {row.cells.map((cell) => (
                      <td key={cell.outletId} className="px-4 py-3 text-right tabular-nums">
                        {cell.total > 0 ? fmtUGX(cell.total) : "—"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmtUGX(row.rowTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border text-sm font-semibold">
                  <td className="sticky left-0 z-10 bg-card px-4 py-3">Total</td>
                  {report.colTotals.map((total, i) => (
                    <td key={report.activeOutlets[i].id} className="px-4 py-3 text-right tabular-nums">
                      {fmtUGX(total)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right tabular-nums">{fmtUGX(report.grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TableCard>
      )}
    </div>
  );
}

/* ============================== POS BEST-SELLING ITEMS ============================== */

function PosBestSellingItemsReport() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const posTabs = useStore((s) => s.posTabs);
  const posTabItems = useStore((s) => s.posTabItems);
  const menuItems = useStore((s) => s.menuItems);
  const menuCategories = useStore((s) => s.menuCategories);
  const posOutlets = useStore((s) => s.posOutlets);

  const report = useMemo(() => {
    const dateRange = dateList(from, to);
    const settledTabIds = new Set(
      posTabs
        .filter((t) => (t.status === "settled" || t.status === "room_charged") && t.settledAt && dateRange.includes(t.settledAt.slice(0, 10)))
        .map((t) => t.id),
    );
    const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]));
    const catMap = new Map(menuCategories.map((c) => [c.id, c.name]));
    const outletMap = new Map(posOutlets.map((o) => [o.id, o.name]));

    const byItem = new Map<string, { qty: number; rev: number }>();
    posTabItems
      .filter((ti) => settledTabIds.has(ti.posTabId) && !ti.isVoided)
      .forEach((ti) => {
        const entry = byItem.get(ti.menuItemId) ?? { qty: 0, rev: 0 };
        entry.qty += ti.quantity;
        entry.rev += ti.quantity * ti.unitPrice;
        byItem.set(ti.menuItemId, entry);
      });

    const items = Array.from(byItem.entries())
      .map(([menuItemId, data]) => {
        const mi = menuItemMap.get(menuItemId);
        const catName = mi ? catMap.get(mi.menuCategoryId) : undefined;
        const outletName = mi ? outletMap.get(mi.posOutletId) : undefined;
        return { menuItemId, name: mi?.name ?? menuItemId, category: catName ?? "—", outlet: outletName ?? "—", qty: data.qty, rev: data.rev };
      })
      .sort((a, b) => b.qty - a.qty);

    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    const totalRev = items.reduce((s, i) => s + i.rev, 0);

    return { items, totalQty, totalRev };
  }, [posTabs, posTabItems, menuItems, menuCategories, posOutlets, from, to]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unique Items Sold" value={String(report.items.length)} />
        <StatCard label="Total Units Sold" value={String(report.totalQty)} />
        <StatCard label="Total Revenue" value={fmtUGX(report.totalRev)} />
      </div>
      {report.items.length === 0 ? (
        <EmptyState icon={Award} message="No sales data for this period" />
      ) : (
        <TableCard title="Best-Selling Items">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Outlet</th>
                <th className="px-6 py-3 text-right">Qty Sold</th>
                <th className="px-6 py-3 text-right">Revenue</th>
                <th className="px-6 py-3">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {report.items.map((row, i) => {
                const pct = report.totalQty > 0 ? Math.round((row.qty / report.totalQty) * 100) : 0;
                return (
                  <tr key={row.menuItemId} className="transition-colors hover:bg-muted/20">
                    <td className="px-6 py-3 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-6 py-3 font-medium">{row.name}</td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{row.category}</td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{row.outlet}</td>
                    <td className="px-6 py-3 text-right tabular-nums font-semibold">{row.qty}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{fmtUGX(row.rev)}</td>
                    <td className="px-6 py-3">
                      <div className="flex h-2 w-32 overflow-hidden rounded-full bg-muted">
                        <div className="rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}

/* ============================== POS-TO-ROOM CHARGE RECONCILIATION ============================== */

function PosReconciliationReport() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const charges = useStore((s) => s.charges);
  const posTabs = useStore((s) => s.posTabs);
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const posOutlets = useStore((s) => s.posOutlets);

  const report = useMemo(() => {
    const dateRange = dateList(from, to);

    const posCharges = charges.filter(
      (c) =>
        c.chargeSource === "pos_charge" &&
        !c.voided &&
        dateRange.includes(c.date),
    );

    const roomChargedTabs = posTabs.filter(
      (t) => t.status === "room_charged" && t.settledAt && dateRange.includes(t.settledAt.slice(0, 10)),
    );

    const folioMap = new Map(folios.map((f) => [f.id, f]));
    const resMap = new Map(reservations.map((r) => [r.id, r]));
    const outletMap = new Map(posOutlets.map((o) => [o.id, o.name]));

    const posChargeTotal = posCharges.reduce((s, c) => s + c.amount, 0);
    const roomTabTotal = roomChargedTabs.reduce((s, t) => s + t.totalAmount, 0);

    return {
      posCharges: posCharges.map((c) => {
        const folio = folioMap.get(c.folioId);
        const res = folio?.reservationId ? resMap.get(folio.reservationId) : undefined;
        return { ...c, guestName: res?.guestName ?? "—" };
      }),
      posChargeTotal,
      roomChargedTabs: roomChargedTabs.map((t) => ({
        ...t,
        outletName: outletMap.get(t.posOutletId) ?? t.posOutletId,
      })),
      roomTabTotal,
    };
  }, [charges, posTabs, folios, reservations, posOutlets, from, to]);

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="POS Room-Charge Entries" value={String(report.roomChargedTabs.length)} />
        <StatCard label="POS Room-Charge Total" value={fmtUGX(report.roomTabTotal)} />
        <StatCard label="Folio POS Charges" value={String(report.posCharges.length)} />
        <StatCard label="Folio POS Charge Total" value={fmtUGX(report.posChargeTotal)} />
      </div>

      {report.posCharges.length > 0 && (
        <TableCard title="Folio POS Charges (pos_charge source)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Guest</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Folio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {report.posCharges.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-3 tabular-nums text-xs text-muted-foreground">{c.date}</td>
                  <td className="px-6 py-3 text-sm font-medium">{c.guestName}</td>
                  <td className="px-6 py-3 text-xs text-muted-foreground">{c.description}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold">{fmtUGX(c.amount)}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{c.folioId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      {report.roomChargedTabs.length > 0 && (
        <TableCard title="POS Tabs Charged to Room">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Outlet</th>
                <th className="px-6 py-3">Tab</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Folio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {report.roomChargedTabs.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-3 tabular-nums text-xs text-muted-foreground">{t.settledAt?.slice(0, 10)}</td>
                  <td className="px-6 py-3 text-sm font-medium">{t.outletName}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold">{fmtUGX(t.totalAmount)}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{t.roomChargeFolioId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      {report.posCharges.length === 0 && report.roomChargedTabs.length === 0 && (
        <EmptyState icon={ArrowLeftRight} message="No POS-to-room charge data for this period" />
      )}
    </div>
  );
}

/* ============================== MANAGER'S FLASH REPORT ============================== */

function FlashReport() {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const reservations = useStore((s) => s.reservations);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);
  const folios = useStore((s) => s.folios);
  const guests = useStore((s) => s.guests);

  const report = useMemo(() => {
    const activeRooms = rooms.filter((r) => r.isActive);
    const totalRooms = activeRooms.length;

    const inHouse = reservations.filter((r) => r.status === "checked_in");
    const roomsSold = activeRooms.filter((r) => r.status === "occupied").length;

    const occupancyPct = totalRooms > 0 ? Math.round((roomsSold / totalRooms) * 100) : 0;

    const dayCharges = charges.filter((c) => c.date === date && !c.voided);
    const dayPayments = payments.filter((p) => p.date === date && p.status === "confirmed");

    const roomRev = dayCharges.filter((c) => c.type === "room").reduce((s, c) => s + c.amount, 0);
    const fnbRev = dayCharges.filter((c) => c.type === "fnb").reduce((s, c) => s + c.amount, 0);
    const miscRev = dayCharges.filter((c) => c.type === "misc").reduce((s, c) => s + c.amount, 0);
    const discountTotal = dayCharges.filter((c) => c.type === "discount").reduce((s, c) => s + c.amount, 0);

    const grossRevenue = roomRev + fnbRev + miscRev;
    const netRevenue = grossRevenue + discountTotal;
    const totalPayments = dayPayments.reduce((s, p) => s + p.amount, 0);

    const adr = roomsSold > 0 ? Math.round(roomRev / roomsSold) : 0;
    const revpar = totalRooms > 0 ? Math.round(roomRev / totalRooms) : 0;

    const arrivals = reservations.filter((r) => r.checkIn === date && r.status !== "cancelled" && r.status !== "no_show").length;
    const departures = reservations.filter((r) => r.checkOut === date && r.status !== "cancelled" && r.status !== "no_show").length;

    const outstandingFolios = folios.filter((f) => f.status === "open");
    const totalOutstanding = outstandingFolios.reduce((s, f) => s + folioBalance(f.id), 0);

    return {
      totalRooms, roomsSold, occupancyPct,
      roomRev, fnbRev, miscRev, discountTotal, grossRevenue, netRevenue, totalPayments,
      adr, revpar, arrivals, departures, inHouse: inHouse.length, totalOutstanding,
    };
  }, [rooms, reservations, charges, payments, folios, guests, date]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm print:hidden">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Occupancy" value={`${report.occupancyPct}%`} highlight={report.occupancyPct >= 80 ? "success" : report.occupancyPct >= 60 ? "warning" : "destructive"} />
        <StatCard label="ADR" value={fmtUGX(report.adr)} />
        <StatCard label="RevPAR" value={fmtUGX(report.revpar)} />
        <StatCard label="Rooms Sold" value={`${report.roomsSold} / ${report.totalRooms}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Arrivals" value={String(report.arrivals)} highlight="success" />
        <StatCard label="Departures" value={String(report.departures)} highlight="warning" />
        <StatCard label="In-House" value={String(report.inHouse)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Room Revenue" value={fmtUGX(report.roomRev)} />
        <StatCard label="F&B Revenue" value={fmtUGX(report.fnbRev)} />
        <StatCard label="Other Revenue" value={fmtUGX(report.miscRev)} />
        <StatCard label="Payments Collected" value={fmtUGX(report.totalPayments)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Net Revenue" value={fmtUGX(report.netRevenue)} highlight={report.netRevenue >= 0 ? "success" : "destructive"} />
        <StatCard label="Outstanding Balances" value={fmtUGX(report.totalOutstanding)} highlight={report.totalOutstanding > 0 ? "destructive" : undefined} />
      </div>

      <TableCard title="Daily Summary">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border/40">
            <Row label="Total Rooms" value={report.totalRooms} />
            <Row label="Rooms Sold" value={report.roomsSold} />
            <Row label="Occupancy %" value={report.occupancyPct} />
            <Row label="Average Daily Rate (ADR)" value={report.adr} bold />
            <Row label="RevPAR" value={report.revpar} bold />
            <tr className="border-t border-border/60"><td colSpan={2} className="px-6 py-2" /></tr>
            <Row label="Room Revenue" value={report.roomRev} />
            <Row label="Food & Beverage" value={report.fnbRev} />
            <Row label="Miscellaneous" value={report.miscRev} />
            <Row label="Gross Revenue" value={report.grossRevenue} bold />
            <Row label="Discounts" value={report.discountTotal} />
            <Row label="Net Revenue" value={report.netRevenue} bold highlight={report.netRevenue >= 0 ? "success" : "destructive"} />
            <tr className="border-t border-border/60"><td colSpan={2} className="px-6 py-2" /></tr>
            <Row label="Arrivals" value={report.arrivals} />
            <Row label="Departures" value={report.departures} />
            <Row label="In-House Guests" value={report.inHouse} />
            <Row label="Outstanding Balances" value={report.totalOutstanding} highlight={report.totalOutstanding > 0 ? "destructive" : undefined} />
            <Row label="Payments Collected" value={report.totalPayments} bold />
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ============================== PERIOD COMPARISON ============================== */

function PeriodComparison() {
  const today = todayISO();
  const [fromA, setFromA] = useState(today);
  const [toA, setToA] = useState(today);
  const [fromB, setFromB] = useState(today);
  const [toB, setToB] = useState(today);
  const rooms = useStore((s) => s.rooms);
  const reservations = useStore((s) => s.reservations);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);
  const folios = useStore((s) => s.folios);

  function periodStats(from: string, to: string) {
    const dateRange = dateList(from, to);
    const days = dateRange.length;

    const activeRooms = rooms.filter((r) => r.isActive);
    const totalRooms = activeRooms.length;

    const inRange = reservations.filter(
      (r) => r.status !== "cancelled" && r.status !== "no_show" &&
        ((r.checkIn >= from && r.checkIn <= to) || (r.checkOut >= from && r.checkOut <= to) ||
         (r.checkIn <= from && r.checkOut >= to)),
    );

    const periodCharges = charges.filter((c) => !c.voided && dateRange.includes(c.date));
    const periodPayments = payments.filter((p) => p.status === "confirmed" && dateRange.includes(p.date));

    const roomRev = periodCharges.filter((c) => c.type === "room").reduce((s, c) => s + c.amount, 0);
    const fnbRev = periodCharges.filter((c) => c.type === "fnb").reduce((s, c) => s + c.amount, 0);
    const miscRev = periodCharges.filter((c) => c.type === "misc").reduce((s, c) => s + c.amount, 0);
    const totalRev = roomRev + fnbRev + miscRev;
    const totalPayments = periodPayments.reduce((s, p) => s + p.amount, 0);

    const roomNights = inRange.reduce((s, r) => {
      const start = r.checkIn >= from ? new Date(r.checkIn) : new Date(from);
      const end = r.checkOut <= to ? new Date(r.checkOut) : new Date(to);
      const nights = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
      return s + nights;
    }, 0);

    const occupancyPct = totalRooms > 0 && days > 0 ? Math.round((roomNights / (totalRooms * days)) * 100) : 0;
    const adr = roomNights > 0 ? Math.round(roomRev / roomNights) : 0;
    const revpar = totalRooms > 0 && days > 0 ? Math.round(roomRev / (totalRooms * days)) : 0;

    return { days, roomRev, fnbRev, miscRev, totalRev, totalPayments, roomNights, occupancyPct, adr, revpar };
  }

  const statsA = useMemo(() => periodStats(fromA, toA), [rooms, reservations, charges, payments, fromA, toA, folios]);
  const statsB = useMemo(() => periodStats(fromB, toB), [rooms, reservations, charges, payments, fromB, toB, folios]);

  function diff(a: number, b: number) {
    const abs = a - b;
    const pct = b !== 0 ? Math.round((abs / Math.abs(b)) * 100) : 0;
    return { abs, pct };
  }

  const rows: { label: string; a: number; b: number; isCurrency: boolean; bold?: boolean }[] = [
    { label: "Days in Period", a: statsA.days, b: statsB.days, isCurrency: false },
    { label: "Room Nights", a: statsA.roomNights, b: statsB.roomNights, isCurrency: false },
    { label: "Occupancy %", a: statsA.occupancyPct, b: statsB.occupancyPct, isCurrency: false },
    { label: "Average Daily Rate (ADR)", a: statsA.adr, b: statsB.adr, isCurrency: true, bold: true },
    { label: "RevPAR", a: statsA.revpar, b: statsB.revpar, isCurrency: true, bold: true },
    { label: "Room Revenue", a: statsA.roomRev, b: statsB.roomRev, isCurrency: true },
    { label: "F&B Revenue", a: statsA.fnbRev, b: statsB.fnbRev, isCurrency: true },
    { label: "Other Revenue", a: statsA.miscRev, b: statsB.miscRev, isCurrency: true },
    { label: "Total Revenue", a: statsA.totalRev, b: statsB.totalRev, isCurrency: true, bold: true },
    { label: "Payments Collected", a: statsA.totalPayments, b: statsB.totalPayments, isCurrency: true },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm print:hidden">
          <h3 className="mb-3 text-sm font-semibold text-primary">Period A</h3>
          <div className="flex gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
              <input type="date" value={fromA} onChange={(e) => setFromA(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
              <input type="date" value={toA} onChange={(e) => setToA(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm print:hidden">
          <h3 className="mb-3 text-sm font-semibold text-primary">Period B</h3>
          <div className="flex gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
              <input type="date" value={fromB} onChange={(e) => setFromB(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
              <input type="date" value={toB} onChange={(e) => setToB(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
          </div>
        </div>
      </div>

      <TableCard title="Period Comparison">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs font-medium text-muted-foreground">
              <th className="px-6 py-3">Metric</th>
              <th className="px-6 py-3 text-right">Period A</th>
              <th className="px-6 py-3 text-right">Period B</th>
              <th className="px-6 py-3 text-right">Change</th>
              <th className="px-6 py-3 text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((r) => {
              const d = diff(r.a, r.b);
              return (
                <tr key={r.label} className="transition-colors hover:bg-muted/20">
                  <td className={cn("px-6 py-3", r.bold && "font-semibold")}>{r.label}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{r.isCurrency ? fmtUGX(r.a) : r.a}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{r.isCurrency ? fmtUGX(r.b) : r.b}</td>
                  <td className={cn("px-6 py-3 text-right tabular-nums", d.abs > 0 ? "text-success" : d.abs < 0 ? "text-destructive" : "")}>
                    {d.abs > 0 ? "+" : ""}{r.isCurrency ? fmtUGX(d.abs) : d.abs}
                  </td>
                  <td className={cn("px-6 py-3 text-right tabular-nums", d.pct > 0 ? "text-success" : d.pct < 0 ? "text-destructive" : "")}>
                    {d.pct > 0 ? "+" : ""}{d.pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

/* ============================== SHARED HELPERS ============================== */

function ratePlanForReservation(res: Reservation, ratePlans: { id: string; name: string; roomTypeId: string }[]): string | undefined {
  const plan = ratePlans.find((rp) => rp.roomTypeId === res.roomTypeId && rp.name.toLowerCase().includes("rack"));
  return plan?.name ?? ratePlans.find((rp) => rp.roomTypeId === res.roomTypeId)?.name;
}

function dateList(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/* ============================== UI COMPONENTS ============================== */

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-3xl font-bold tracking-tight", highlight === "success" && "text-success", highlight === "warning" && "text-warning", highlight === "destructive" && "text-destructive")}>{value}</p>
    </div>
  );
}

function TableCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      {title && <div className="border-b border-border/40 px-6 py-4"><h3 className="text-sm font-semibold">{title}</h3></div>}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/50 bg-card/30 py-20">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground/20" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

function DateRangeFilter({ from, to, onFromChange, onToChange }: { from: string; to: string; onFromChange: (v: string) => void; onToChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm print:hidden">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
      </div>
    </div>
  );
}

function GuestPanel({ title, count, icon: Icon, headerColor, iconColor, children }: { title: string; count: number; icon: React.ComponentType<{ className?: string }>; headerColor: string; iconColor: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className={cn("flex items-center gap-2 border-b border-border/40 px-6 py-4", headerColor)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
        <h3 className="text-sm font-semibold">{title} — {count}</h3>
      </div>
      {count === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Icon className={cn("mb-2 h-8 w-8", iconColor.replace("text-", "text-").replace("5", "3").replace("success", "muted-foreground/30"))} />
          <p className="text-xs text-muted-foreground">None on this date</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">{children}</div>
      )}
    </div>
  );
}

function GuestRow({ guestName, detail }: { guestName: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/20">
      <span className="text-sm font-medium">{guestName}</span>
      <span className="ml-auto text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: string }) {
  return (
    <tr className="transition-colors hover:bg-muted/20">
      <td className={cn("px-6 py-3", bold && "font-semibold")}>{label}</td>
      <td className={cn("px-6 py-3 text-right tabular-nums", bold && "font-semibold", highlight === "success" && "text-success", highlight === "destructive" && "text-destructive")}>{fmtUGX(value)}</td>
    </tr>
  );
}
