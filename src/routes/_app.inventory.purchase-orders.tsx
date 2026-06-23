import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Eye,
  X,
  Check,
  Package,
  Warehouse,
  ClipboardCheck,
  Printer,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/inventory/purchase-orders")({
  head: () => ({ meta: [{ title: "Purchase Orders — Jambo ERP" }] }),
  component: PurchaseOrdersPage,
});

type POStatus = "Draft" | "Pending" | "Approved" | "Received" | "Cancelled";

type POItem = {
  name: string;
  qty: number;
  unitCost: number;
};

type PurchaseOrder = {
  id: string;
  supplier: string;
  items: POItem[];
  total: number;
  status: POStatus;
  date: string;
  expectedDate: string;
  createdBy: string;
};

const suppliers = [
  "Uganda Beverages Ltd",
  "Kampala Food Distributors",
  "East African Supplies",
  "Jinja Wholesalers",
  "Entebbe Logistics",
  "Rwenzori Trading Co.",
];

const defaultOrders: PurchaseOrder[] = [
  {
    id: "PO-0421",
    supplier: "Uganda Beverages Ltd",
    items: [
      { name: "Coca Cola (Can)", qty: 120, unitCost: 2_500 },
      { name: "Mineral Water 500ml", qty: 200, unitCost: 1_200 },
    ],
    total: 540_000,
    status: "Received",
    date: "Jun 10",
    expectedDate: "Jun 08",
    createdBy: "Amani Kato",
  },
  {
    id: "PO-0420",
    supplier: "Kampala Food Distributors",
    items: [{ name: "Toilet Paper (roll)", qty: 200, unitCost: 1_500 }],
    total: 300_000,
    status: "Received",
    date: "Jun 09",
    expectedDate: "Jun 07",
    createdBy: "Amani Kato",
  },
  {
    id: "PO-0419",
    supplier: "East African Supplies",
    items: [
      { name: "Towel (white)", qty: 50, unitCost: 18_000 },
      { name: "Bedsheet (king)", qty: 30, unitCost: 35_000 },
    ],
    total: 1_950_000,
    status: "Approved",
    date: "Jun 08",
    expectedDate: "Jun 15",
    createdBy: "Grace Achieng",
  },
  {
    id: "PO-0418",
    supplier: "Jinja Wholesalers",
    items: [{ name: "Potatoes", qty: 40, unitCost: 3_000 }],
    total: 120_000,
    status: "Received",
    date: "Jun 07",
    expectedDate: "Jun 06",
    createdBy: "Amani Kato",
  },
  {
    id: "PO-0417",
    supplier: "Uganda Beverages Ltd",
    items: [
      { name: "Fresh Orange Juice", qty: 30, unitCost: 4_000 },
      { name: "Mango Smoothie", qty: 20, unitCost: 5_000 },
    ],
    total: 220_000,
    status: "Pending",
    date: "Jun 06",
    expectedDate: "Jun 13",
    createdBy: "Amani Kato",
  },
  {
    id: "PO-0416",
    supplier: "Rwenzori Trading Co.",
    items: [
      { name: "Cooking Oil", qty: 20, unitCost: 8_000 },
      { name: "Soap (liquid)", qty: 20, unitCost: 6_000 },
    ],
    total: 280_000,
    status: "Draft",
    date: "Jun 05",
    expectedDate: "Jun 12",
    createdBy: "James Mwangi",
  },
  {
    id: "PO-0415",
    supplier: "Kampala Food Distributors",
    items: [
      { name: "Beef (prep)", qty: 15, unitCost: 15_000 },
      { name: "Grilled Chicken (prep)", qty: 20, unitCost: 12_000 },
    ],
    total: 465_000,
    status: "Cancelled",
    date: "Jun 04",
    expectedDate: "Jun 10",
    createdBy: "James Mwangi",
  },
];

const statusStyles: Record<POStatus, string> = {
  Draft: "bg-muted/40 text-muted-foreground border-border/40",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Approved: "bg-info/15 text-info border-info/30",
  Received: "bg-success/15 text-success border-success/30",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(defaultOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "All">("All");
  const [showCreate, setShowCreate] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);

  const [supplier, setSupplier] = useState(suppliers[0]);
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [expectedDate, setExpectedDate] = useState("");

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (statusFilter !== "All" && o.status !== statusFilter) return false;
        if (search && !`${o.id} ${o.supplier}`.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [orders, search, statusFilter],
  );

  function addPoItem() {
    setPoItems((prev) => [...prev, { name: "", qty: 1, unitCost: 0 }]);
  }

  function updatePoItem(idx: number, field: keyof POItem, value: string | number) {
    setPoItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function removePoItem(idx: number) {
    setPoItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function createOrder() {
    const validItems = poItems.filter((it) => it.name.trim() && it.qty > 0 && it.unitCost > 0);
    if (validItems.length === 0) return;
    const total = validItems.reduce((s, it) => s + it.qty * it.unitCost, 0);
    const newOrder: PurchaseOrder = {
      id: `PO-${String(orders.length + 421).padStart(4, "0")}`,
      supplier,
      items: validItems,
      total,
      status: "Draft",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      expectedDate,
      createdBy: "Amani Kato",
    };
    setOrders((prev) => [newOrder, ...prev]);
    setShowCreate(false);
    setSupplier(suppliers[0]);
    setPoItems([]);
    setExpectedDate("");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Local Purchase Orders for stock replenishment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Package className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            to="/inventory/list"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Warehouse className="h-4 w-4" />
            Inventory
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50"
          >
            <Plus className="h-4 w-4" />
            New LPO
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Orders", value: String(orders.length), icon: Package, accent: "from-primary/20 to-primary/5", bar: "var(--color-primary)", text: "text-primary" },
          { label: "Pending Approval", value: String(orders.filter((o) => o.status === "Pending").length), icon: Clock, accent: "from-warning/20 to-warning/5", bar: "var(--color-warning)", text: "text-warning" },
          { label: "Approved", value: String(orders.filter((o) => o.status === "Approved").length), icon: ClipboardCheck, accent: "from-info/20 to-info/5", bar: "var(--color-info)", text: "text-info" },
          { label: "Received", value: String(orders.filter((o) => o.status === "Received").length), icon: Warehouse, accent: "from-success/20 to-success/5", bar: "var(--color-success)", text: "text-success" },
        ].map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/30 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80"
          >
            <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: s.bar, boxShadow: `0 0 12px ${s.bar}` }} />
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${s.bar}15 0%, transparent 70%)` }} />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
                  {s.value}
                </div>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-card to-muted shadow-sm ring-1 ring-border/50">
                <s.icon className={cn("h-4 w-4", s.text)} />
              </div>
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
              placeholder="Search by PO ID or supplier…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as POStatus | "All")}
          >
            <SelectTrigger className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              {(["Draft", "Pending", "Approved", "Received", "Cancelled"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
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
                <th className="px-4 py-3 font-medium">PO #</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Expected</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created By</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((po) => (
                <tr
                  key={po.id}
                  className="group border-b border-border/30 transition hover:bg-card/40"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{po.id}</td>
                  <td className="px-4 py-3 font-medium">{po.supplier}</td>
                  <td className="px-4 py-3 text-muted-foreground">{po.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{po.expectedDate || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {po.items.reduce((s, i) => s + i.qty, 0)} items
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        statusStyles[po.status],
                      )}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{po.createdBy}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    UGX {po.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                      <button
                        onClick={() => setDetailOrder(po)}
                        className="rounded-lg border border-border/50 bg-card/40 p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="rounded-lg border border-border/50 bg-card/40 p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        title="Print"
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
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">{detailOrder.id}</h3>
                <p className="text-xs text-muted-foreground">
                  {detailOrder.date} · Expected: {detailOrder.expectedDate || "—"}
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

            <div className="mb-3 text-sm">
              <span className="text-muted-foreground">Supplier:</span>{" "}
              <span className="font-medium">{detailOrder.supplier}</span>
              <br />
              <span className="text-muted-foreground">Created by:</span>{" "}
              <span className="font-medium">{detailOrder.createdBy}</span>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/40 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <span>Item</span>
                <span className="flex gap-6">
                  <span>Qty</span>
                  <span>Cost</span>
                  <span>Total</span>
                </span>
              </div>
              <ul className="space-y-2">
                {detailOrder.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="flex-1">{it.name}</span>
                    <span className="flex items-center gap-4 tabular-nums">
                      <span className="w-10 text-center">{it.qty}</span>
                      <span className="w-20 text-right">UGX {it.unitCost.toLocaleString()}</span>
                      <span className="w-20 text-right font-medium">
                        UGX {(it.qty * it.unitCost).toLocaleString()}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="my-3 border-t border-border/40" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-gradient-primary">
                  UGX {detailOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <Printer className="h-4 w-4" /> Print
              </button>
              {detailOrder.status === "Pending" && (
                <button className="inline-flex items-center gap-1.5 rounded-xl bg-info px-4 py-2 text-sm font-semibold text-white">
                  <Check className="h-4 w-4" /> Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create LPO Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-2xl rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">New Purchase Order (LPO)</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Supplier
                  </label>
                  <Select value={supplier} onValueChange={setSupplier}>
                    <SelectTrigger className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60 focus:ring-0 shadow-none">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Expected Delivery
                  </label>
                  <DatePicker value={expectedDate} onChange={setExpectedDate} />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Items
                  </label>
                  <button
                    onClick={addPoItem}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>

                {poItems.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No items added yet. Click "Add Item" to add line items.
                  </p>
                )}

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/30 p-3"
                    >
                      <input
                        value={item.name}
                        onChange={(e) => updatePoItem(idx, "name", e.target.value)}
                        placeholder="Item name"
                        className="flex-1 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
                      />
                      <input
                        type="number"
                        value={item.qty || ""}
                        onChange={(e) => updatePoItem(idx, "qty", parseInt(e.target.value) || 0)}
                        placeholder="Qty"
                        min="1"
                        className="w-16 rounded-lg border border-border/60 bg-card/40 px-2 py-2 text-sm text-center outline-none focus:border-primary/60 tabular-nums"
                      />
                      <input
                        type="number"
                        value={item.unitCost || ""}
                        onChange={(e) =>
                          updatePoItem(idx, "unitCost", parseInt(e.target.value) || 0)
                        }
                        placeholder="Cost"
                        min="0"
                        className="w-24 rounded-lg border border-border/60 bg-card/40 px-2 py-2 text-sm text-right outline-none focus:border-primary/60 tabular-nums"
                      />
                      <span className="min-w-[80px] text-right text-sm font-medium tabular-nums">
                        UGX {(item.qty * item.unitCost).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removePoItem(idx)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {poItems.length > 0 && (
                  <div className="mt-4 flex justify-between border-t border-border/40 pt-3 text-lg font-bold">
                    <span>Estimated Total</span>
                    <span className="text-gradient-primary tabular-nums">
                      UGX {poItems.reduce((s, it) => s + it.qty * it.unitCost, 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-border/60 bg-card/40 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={createOrder}
                disabled={
                  poItems.filter((it) => it.name.trim() && it.qty > 0 && it.unitCost > 0).length ===
                  0
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Create LPO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
