import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Printer,
  Eye,
  X,
  ShoppingCart,
  ClipboardList,
  UtensilsCrossed,
  ChevronDown,
  Calendar,
  TicketCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const statusStyles: Record<OrderStatus, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Completed: "bg-success/15 text-success border-success/30",
  Cancelled: "bg-muted/40 text-muted-foreground border-border/40",
};

const cashiers = [...new Set(orders.map((o) => o.cashier))];
const tables = [...new Set(orders.map((o) => o.table))];

function POSOrdersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [cashierFilter, setCashierFilter] = useState<string>("All");
  const [tableFilter, setTableFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (statusFilter !== "All" && o.status !== statusFilter) return false;
        if (cashierFilter !== "All" && o.cashier !== cashierFilter) return false;
        if (tableFilter !== "All" && o.table !== tableFilter) return false;
        if (dateFrom && o.date < dateFrom) return false;
        if (dateTo && o.date > dateTo) return false;
        if (query && !`${o.id} ${o.table} ${o.cashier}`.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [query, statusFilter, cashierFilter, tableFilter, dateFrom, dateTo],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">POS Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All point-of-sale transactions across the property.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/pos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <ShoppingCart className="h-4 w-4" />
            Back to POS
          </Link>
          <Link
            to="/pos/menu"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <UtensilsCrossed className="h-4 w-4" />
            Menu Items
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Today's Orders", value: "4" },
          { label: "Pending", value: "2" },
          { label: "Completed", value: "5" },
          { label: "Revenue Today", value: "UGX 338K" },
        ].map((s) => (
          <div key={s.label} className="glass card-hover rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, table, cashier…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
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

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as OrderStatus | "All")}
          >
            <SelectTrigger className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={cashierFilter}
            onValueChange={setCashierFilter}
          >
            <SelectTrigger className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="All cashiers" />
            </SelectTrigger>
            <SelectContent>
              {cashiers.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            <option value="All" className="bg-card">
              All tables
            </option>
            {tables.map((t) => (
              <option key={t} value={t} className="bg-card">
                {t}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
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
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Date / Time</th>
                <th className="px-4 py-3 font-medium">Table</th>
                <th className="px-4 py-3 font-medium">Cashier</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className="group border-b border-border/30 transition hover:bg-card/40"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.date}</div>
                    <div className="text-xs text-muted-foreground">{o.time}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{o.table}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.cashier}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{o.items.reduce((s, i) => s + i.qty, 0)} items</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        statusStyles[o.status],
                      )}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    UGX {o.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                      <button
                        onClick={() => setDetailOrder(o)}
                        className="rounded-lg border border-border/50 bg-card/40 p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="rounded-lg border border-border/50 bg-card/40 p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        title="Print receipt"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">{detailOrder.id}</h3>
                <p className="text-xs text-muted-foreground">
                  {detailOrder.date} · {detailOrder.time} · {detailOrder.table}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    statusStyles[detailOrder.status],
                  )}
                >
                  {detailOrder.status}
                </span>
                <button
                  onClick={() => setDetailOrder(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/40 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <span>Item</span>
                <span className="flex gap-6">
                  <span>Qty</span>
                  <span>Amount</span>
                </span>
              </div>
              <ul className="space-y-2">
                {detailOrder.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="flex-1">{it.name}</span>
                    <span className="flex items-center gap-6 tabular-nums">
                      <span className="w-8 text-center">{it.qty}</span>
                      <span className="w-20 text-right">
                        UGX {(it.price * it.qty).toLocaleString()}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="my-3 border-t border-border/40" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>UGX {detailOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (18%)</span>
                  <span>UGX {detailOrder.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-1">
                  <span>Total</span>
                  <span className="text-gradient-primary">
                    UGX {detailOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Cashier: <span className="font-medium text-foreground">{detailOrder.cashier}</span>
                <br />
                Payment:{" "}
                <span className="font-medium text-foreground">{detailOrder.paymentMethod}</span>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <Printer className="h-4 w-4" />
                  Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
