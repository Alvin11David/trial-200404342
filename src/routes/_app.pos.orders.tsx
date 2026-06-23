import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, type ComponentType } from "react";
import {
  Search,
  Printer,
  Eye,
  X,
  ShoppingCart,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  TrendingUp,
  Banknote,
  CreditCard,
  BedDouble,
  ScrollText,
  AlertCircle,
  Receipt,
  ArrowUpRight,
  Timer,
  User,
  Table2,
  ChevronRight,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/pms-store";
import { printReceipt } from "@/lib/print-receipt";

export const Route = createFileRoute("/_app/pos/orders")({
  head: () => ({ meta: [{ title: "POS Orders — Jambo ERP" }] }),
  component: POSOrdersPage,
});

type OrderStatus = "Pending" | "Completed" | "Cancelled";
type PaymentMethod = "Cash" | "Card" | "Room Charge" | "Credit";

type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  items: OrderItem[];
  table: string;
  cashier: string;
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  date: string;
  time: string;
};

const orders: Order[] = [
  {
    id: "POS-1001",
    items: [
      { name: "Coca Cola", qty: 2, price: 5_000 },
      { name: "French Fries", qty: 1, price: 8_000 },
      { name: "Grilled Chicken", qty: 1, price: 25_000 },
    ],
    table: "T1",
    cashier: "Amani Kato",
    subtotal: 43_000,
    tax: 7_740,
    total: 50_740,
    status: "Completed",
    paymentMethod: "Cash",
    date: "Jun 10",
    time: "14:32",
  },
  {
    id: "POS-1002",
    items: [
      { name: "Johnnie Walker Red", qty: 2, price: 35_000 },
      { name: "Mineral Water", qty: 1, price: 3_000 },
    ],
    table: "Bar",
    cashier: "Amani Kato",
    subtotal: 73_000,
    tax: 13_140,
    total: 86_140,
    status: "Completed",
    paymentMethod: "Card",
    date: "Jun 10",
    time: "13:15",
  },
  {
    id: "POS-1003",
    items: [
      { name: "Chicken Burger", qty: 2, price: 18_000 },
      { name: "French Fries", qty: 2, price: 8_000 },
      { name: "Fresh Orange Juice", qty: 2, price: 8_000 },
    ],
    table: "T3",
    cashier: "James Mwangi",
    subtotal: 68_000,
    tax: 12_240,
    total: 80_240,
    status: "Pending",
    paymentMethod: "Room Charge",
    date: "Jun 10",
    time: "15:00",
  },
  {
    id: "POS-1004",
    items: [
      { name: "Beef Steak", qty: 1, price: 35_000 },
      { name: "Pasta Bolognese", qty: 1, price: 22_000 },
      { name: "Red Wine", qty: 1, price: 45_000 },
    ],
    table: "T5",
    cashier: "Grace Achieng",
    subtotal: 102_000,
    tax: 18_360,
    total: 120_360,
    status: "Pending",
    paymentMethod: "Credit",
    date: "Jun 10",
    time: "15:22",
  },
  {
    id: "POS-1005",
    items: [
      { name: "Samosas (4 pcs)", qty: 2, price: 6_000 },
      { name: "Spring Rolls", qty: 1, price: 8_000 },
      { name: "Coca Cola", qty: 3, price: 5_000 },
    ],
    table: "T2",
    cashier: "Amani Kato",
    subtotal: 35_000,
    tax: 6_300,
    total: 41_300,
    status: "Completed",
    paymentMethod: "Cash",
    date: "Jun 09",
    time: "19:45",
  },
  {
    id: "POS-1006",
    items: [
      { name: "Fish & Chips", qty: 1, price: 22_000 },
      { name: "Mango Smoothie", qty: 1, price: 10_000 },
    ],
    table: "T7",
    cashier: "James Mwangi",
    subtotal: 32_000,
    tax: 5_760,
    total: 37_760,
    status: "Cancelled",
    paymentMethod: "Cash",
    date: "Jun 09",
    time: "12:10",
  },
  {
    id: "POS-1007",
    items: [
      { name: "Chicken Wings", qty: 3, price: 15_000 },
      { name: "Nachos", qty: 1, price: 12_000 },
    ],
    table: "Bar",
    cashier: "Grace Achieng",
    subtotal: 57_000,
    tax: 10_260,
    total: 67_260,
    status: "Completed",
    paymentMethod: "Card",
    date: "Jun 08",
    time: "22:30",
  },
  {
    id: "POS-1008",
    items: [
      { name: "Vegetable Curry", qty: 1, price: 20_000 },
      { name: "Mineral Water", qty: 2, price: 3_000 },
      { name: "Spring Rolls", qty: 1, price: 8_000 },
    ],
    table: "Takeaway",
    cashier: "Amani Kato",
    subtotal: 34_000,
    tax: 6_120,
    total: 40_120,
    status: "Completed",
    paymentMethod: "Cash",
    date: "Jun 08",
    time: "18:05",
  },
];

const paymentIcons: Record<PaymentMethod, typeof Banknote> = {
  Cash: Banknote,
  Card: CreditCard,
  "Room Charge": BedDouble,
  Credit: ScrollText,
};

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; gradient: string; badge: string }> = {
  Pending: {
    label: "Pending",
    icon: Clock,
    gradient: "from-amber-400 to-orange-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  },
  Completed: {
    label: "Completed",
    icon: CheckCircle2,
    gradient: "from-emerald-400 to-green-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  Cancelled: {
    label: "Cancelled",
    icon: AlertCircle,
    gradient: "from-slate-400 to-slate-500",
    badge: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800",
  },
};

const cashiers = [...new Set(orders.map((o) => o.cashier))];
const tables = [...new Set(orders.map((o) => o.table))];
const statuses: (OrderStatus | "All")[] = ["All", "Pending", "Completed", "Cancelled"];

function POSOrdersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [cashierFilter, setCashierFilter] = useState<string>("All");
  const [tableFilter, setTableFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const tenant = useStore((s) => s.tenant);

  function handlePrintOrder(order: Order) {
    printReceipt({
      id: order.id,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      taxRate: 0.18,
      total: order.total,
      paymentMethod: order.paymentMethod,
      table: order.table,
      cashier: order.cashier,
      businessName: tenant.name,
      businessAddress: tenant.address,
      businessPhone: tenant.phone,
      businessEmail: tenant.email,
      businessTin: tenant.tin,
    });
  }

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (statusFilter !== "All" && o.status !== statusFilter) return false;
        if (cashierFilter !== "All" && o.cashier !== cashierFilter) return false;
        if (tableFilter !== "All" && o.table !== tableFilter) return false;
        if (dateFrom && o.date < dateFrom) return false;
        if (dateTo && o.date > dateTo) return false;
        if (query && !`${o.id} ${o.table} ${o.cashier} ${o.items.map(i => i.name).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [query, statusFilter, cashierFilter, tableFilter, dateFrom, dateTo],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Orders</h1>
              <p className="text-sm text-muted-foreground">
                Point-of-sale transactions across the property
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:text-foreground hover:shadow-md"
          >
            <ShoppingCart className="h-4 w-4" />
            POS Terminal
          </Link>
          <Link
            to="/pos/menu"
            className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary shadow-sm transition-all hover:bg-primary/20 hover:shadow-md"
          >
            <UtensilsCrossed className="h-4 w-4" />
            Menu
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Today's Orders", value: "4", gradient: "from-sky-400 to-teal-500", icon: ShoppingCart, detail: "+2 since yesterday" },
          { label: "Pending", value: "2", gradient: "from-amber-400 to-orange-500", icon: Clock, detail: "Awaiting fulfillment" },
          { label: "Completed", value: "5", gradient: "from-emerald-400 to-green-500", icon: CheckCircle2, detail: "83% completion rate" },
          { label: "Revenue Today", value: "UGX 338K", gradient: "from-violet-400 to-purple-600", icon: TrendingUp, detail: "+18% vs yesterday" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 opacity-[0.08] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.12]">
                <div className={`h-full w-full rounded-full bg-gradient-to-br ${s.gradient}`} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {s.label}
                  </span>
                  <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-lg shadow-${s.gradient.split(" ")[0].replace("from-", "")}/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                </div>
                <div className={`mt-3 text-2xl font-bold tracking-tight bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent`}>
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground/60">{s.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-1 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 p-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, items, cashier…"
              className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 pl-10 pr-3 text-sm outline-none ring-0 transition-all placeholder:text-muted-foreground/40 focus:border-primary/60 focus:bg-background/80 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-background/30 p-1">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-background/50",
                )}
              >
                {s === "All" ? "All" : s}
              </button>
            ))}
          </div>

          {/* Cashier filter */}
          <select
            value={cashierFilter}
            onChange={(e) => setCashierFilter(e.target.value)}
            className="rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-xs font-medium text-muted-foreground outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
          >
            <option value="All">All cashiers</option>
            {cashiers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Table filter */}
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-xs font-medium text-muted-foreground outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
          >
            <option value="All">All tables</option>
            {tables.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-xs text-muted-foreground">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-24 bg-transparent outline-none [color-scheme:dark]"
              placeholder="From"
            />
            <span className="text-muted-foreground/40">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-24 bg-transparent outline-none [color-scheme:dark]"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Order cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 py-24">
          <Package className="mb-3 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground">No orders match your filters</p>
          <p className="mt-1 text-xs text-muted-foreground/50">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const StatusIcon = statusConfig[o.status].icon;
            const PaymentIcon = paymentIcons[o.paymentMethod];
            const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
            return (
              <div
                key={o.id}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-lg"
              >
                {/* Status accent bar */}
                <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${statusConfig[o.status].gradient}`} />

                <div className="p-5 pl-6">
                  {/* Row 1: ID, status, date */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground/60">
                        {o.id}
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                        statusConfig[o.status].badge,
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[o.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                      <Timer className="h-3 w-3" />
                      {o.date} · {o.time}
                    </div>
                  </div>

                  {/* Row 2: Main content */}
                  <div className="mt-4 flex items-start justify-between gap-6">
                    {/* Left: items, table, cashier */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Items */}
                      <div className="flex flex-wrap gap-2">
                        {o.items.slice(0, 3).map((it, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/40 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                          >
                            <span className="text-[10px] font-bold text-muted-foreground/40">×{it.qty}</span>
                            {it.name}
                          </span>
                        ))}
                        {o.items.length > 3 && (
                          <span className="inline-flex items-center rounded-lg bg-card/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground/50">
                            +{o.items.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                        <span className="inline-flex items-center gap-1.5">
                          <Table2 className="h-3.5 w-3.5" />
                          {o.table}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {o.cashier}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <PaymentIcon className="h-3.5 w-3.5" />
                          {o.paymentMethod}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Right: total + actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground/50">Total</div>
                        <div className="text-lg font-bold tracking-tight">
                          UGX {o.total.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailOrder(o)}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-card/40 text-muted-foreground/60 shadow-sm transition-all hover:border-primary/40 hover:text-primary hover:shadow-md active:scale-95"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrintOrder(o)}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-card/40 text-muted-foreground/60 shadow-sm transition-all hover:border-primary/40 hover:text-primary hover:shadow-md active:scale-95"
                          title="Print receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDetailOrder(o)}
                          className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm transition-all hover:from-primary/20 hover:to-primary/10 hover:shadow-md active:scale-95 lg:hidden"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle hover shimmer */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              </div>
            );
          })}
        </div>
      )}

      {/* Order count */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
        {(statusFilter !== "All" || cashierFilter !== "All" || tableFilter !== "All" || query || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setQuery("");
              setStatusFilter("All");
              setCashierFilter("All");
              setTableFilter("All");
              setDateFrom("");
              setDateTo("");
            }}
            className="ml-1 font-medium text-primary underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Order Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailOrder(null)} />
          <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl">
              {/* Modal header */}
              <div className="relative bg-gradient-to-br from-primary/5 via-card to-card px-6 pb-4 pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground/60">
                        {detailOrder.id}
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                        statusConfig[detailOrder.status].badge,
                      )}>
                        {React.createElement(statusConfig[detailOrder.status].icon, { className: "h-3 w-3" })}
                        {statusConfig[detailOrder.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/60">
                      {detailOrder.date} · {detailOrder.time} · Table {detailOrder.table}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetailOrder(null)}
                    className="grid h-8 w-8 place-items-center rounded-xl border border-border/50 bg-card/40 text-muted-foreground/60 transition-all hover:border-destructive/40 hover:text-destructive hover:shadow-sm active:scale-90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                  <span>Item</span>
                  <span className="flex gap-8">
                    <span>Qty</span>
                    <span className="w-20 text-right">Amount</span>
                  </span>
                </div>
                <div className="space-y-2">
                  {detailOrder.items.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-border/30 bg-card/30 px-4 py-2.5 transition-colors hover:bg-card/60"
                    >
                      <span className="flex-1 text-sm font-medium">{it.name}</span>
                      <span className="flex items-center gap-8 text-sm tabular-nums">
                        <span className="w-6 text-center text-muted-foreground">{it.qty}</span>
                        <span className="w-20 text-right font-semibold">
                          UGX {(it.price * it.qty).toLocaleString()}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-5 space-y-1.5 rounded-2xl bg-gradient-to-br from-muted/30 to-card px-4 py-4">
                  <div className="flex justify-between text-sm text-muted-foreground/70">
                    <span>Subtotal</span>
                    <span className="tabular-nums">UGX {detailOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground/70">
                    <span>VAT (18%)</span>
                    <span className="tabular-nums">UGX {detailOrder.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] bg-clip-text text-transparent">
                      UGX {detailOrder.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Meta & actions */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="space-y-1 text-xs text-muted-foreground/60">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>Cashier: <strong className="text-foreground/80">{detailOrder.cashier}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      {React.createElement(paymentIcons[detailOrder.paymentMethod], { className: "h-3.5 w-3.5" })}
                      <span>Payment: <strong className="text-foreground/80">{detailOrder.paymentMethod}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDetailOrder(null);
                      }}
                      className="rounded-xl border border-border/50 bg-card/40 px-4 py-2 text-xs font-medium text-muted-foreground/70 shadow-sm transition-all hover:border-border/80 hover:text-foreground hover:shadow-md active:scale-95"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handlePrintOrder(detailOrder)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-5 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print Receipt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
