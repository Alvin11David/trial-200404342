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
  FileText,
  ChevronDown,
  Printer,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/inventory/requisitions")({
  head: () => ({ meta: [{ title: "Requisitions — Jambo ERP" }] }),
  component: RequisitionsPage,
});

type ReqStatus = "Pending" | "Approved" | "Processed" | "Rejected";

type ReqItem = {
  name: string;
  qty: number;
  uom: string;
};

type Requisition = {
  id: string;
  department: string;
  requestedBy: string;
  items: ReqItem[];
  total: number;
  status: ReqStatus;
  date: string;
  notes: string;
  approvedBy?: string;
};

const departments = [
  "Kitchen",
  "Housekeeping",
  "Front Desk",
  "Maintenance",
  "Bar",
  "Restaurant",
  "Events",
  "Administration",
];

const defaultReqs: Requisition[] = [
  {
    id: "REQ-0310",
    department: "Kitchen",
    requestedBy: "Chef David",
    items: [
      { name: "Beef (prep)", qty: 8, uom: "kg" },
      { name: "Cooking Oil", qty: 5, uom: "liters" },
    ],
    total: 160_000,
    status: "Processed",
    date: "Jun 10",
    notes: "Weekly kitchen restock",
    approvedBy: "Amani Kato",
  },
  {
    id: "REQ-0309",
    department: "Kitchen",
    requestedBy: "Chef David",
    items: [{ name: "Cooking Oil", qty: 5, uom: "liters" }],
    total: 40_000,
    status: "Approved",
    date: "Jun 09",
    notes: "Running low on oil",
    approvedBy: "Amani Kato",
  },
  {
    id: "REQ-0308",
    department: "Maintenance",
    requestedBy: "John Ssempijja",
    items: [{ name: "Light Bulbs", qty: 4, uom: "pcs" }],
    total: 18_000,
    status: "Processed",
    date: "Jun 08",
    notes: "Replace hallway bulbs",
    approvedBy: "Grace Achieng",
  },
  {
    id: "REQ-0307",
    department: "Housekeeping",
    requestedBy: "Sarah Nalongo",
    items: [{ name: "Soap (liquid)", qty: 3, uom: "liters" }],
    total: 18_000,
    status: "Processed",
    date: "Jun 07",
    notes: "Refill dispensers",
    approvedBy: "Amani Kato",
  },
  {
    id: "REQ-0306",
    department: "Bar",
    requestedBy: "Peter Wasswa",
    items: [
      { name: "Smirnoff Vodka", qty: 10, uom: "btls" },
      { name: "Beefeater Gin", qty: 6, uom: "btls" },
    ],
    total: 268_000,
    status: "Pending",
    date: "Jun 10",
    notes: "Weekend stock replenishment",
  },
  {
    id: "REQ-0305",
    department: "Restaurant",
    requestedBy: "Chef David",
    items: [
      { name: "Fish (prep)", qty: 8, uom: "kg" },
      { name: "Potatoes", qty: 20, uom: "kg" },
    ],
    total: 172_000,
    status: "Pending",
    date: "Jun 10",
    notes: "Friday dinner service prep",
  },
  {
    id: "REQ-0304",
    department: "Housekeeping",
    requestedBy: "Sarah Nalongo",
    items: [
      { name: "Towel (white)", qty: 20, uom: "pcs" },
      { name: "Toilet Paper", qty: 50, uom: "pcs" },
    ],
    total: 435_000,
    status: "Approved",
    date: "Jun 06",
    notes: "Monthly linen restock",
    approvedBy: "Grace Achieng",
  },
  {
    id: "REQ-0303",
    department: "Events",
    requestedBy: "Grace Achieng",
    items: [
      { name: "Mineral Water 500ml", qty: 100, uom: "pcs" },
      { name: "Coca Cola (Can)", qty: 60, uom: "pcs" },
    ],
    total: 270_000,
    status: "Rejected",
    date: "Jun 05",
    notes: "Conference supplies - budget exceeded",
  },
];

const statusStyles: Record<ReqStatus, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Approved: "bg-info/15 text-info border-info/30",
  Processed: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusIcons: Record<ReqStatus, typeof Clock> = {
  Pending: Clock,
  Approved: CheckCircle2,
  Processed: CheckCircle2,
  Rejected: XCircle,
};

function RequisitionsPage() {
  const [reqs, setReqs] = useState<Requisition[]>(defaultReqs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReqStatus | "All">("All");
  const [showCreate, setShowCreate] = useState(false);
  const [detailReq, setDetailReq] = useState<Requisition | null>(null);

  const [department, setDepartment] = useState(departments[0]);
  const [requestedBy, setRequestedBy] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [reqItems, setReqItems] = useState<ReqItem[]>([]);

  const filtered = useMemo(
    () =>
      reqs.filter((r) => {
        if (statusFilter !== "All" && r.status !== statusFilter) return false;
        if (
          search &&
          !`${r.id} ${r.department} ${r.requestedBy}`.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [reqs, search, statusFilter],
  );

  function addReqItem() {
    setReqItems((prev) => [...prev, { name: "", qty: 1, uom: "pcs" }]);
  }

  function updateReqItem(idx: number, field: keyof ReqItem, value: string | number) {
    setReqItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function removeReqItem(idx: number) {
    setReqItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function createRequisition() {
    const validItems = reqItems.filter((it) => it.name.trim() && it.qty > 0);
    if (validItems.length === 0 || !requestedBy.trim()) return;
    const total = 0;
    const newReq: Requisition = {
      id: `REQ-${String(reqs.length + 310).padStart(4, "0")}`,
      department,
      requestedBy: requestedBy.trim(),
      items: validItems,
      total,
      status: "Pending",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      notes: reqNotes,
    };
    setReqs((prev) => [newReq, ...prev]);
    setShowCreate(false);
    setDepartment(departments[0]);
    setRequestedBy("");
    setReqNotes("");
    setReqItems([]);
  }

  function updateStatus(id: string, status: ReqStatus) {
    setReqs((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              approvedBy:
                status === "Pending" ? undefined : status === "Rejected" ? undefined : "Amani Kato",
            }
          : r,
      ),
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Requisitions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Internal stock requests with approval workflow.
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
            New Requisition
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Requests", value: String(reqs.length) },
          { label: "Pending", value: String(reqs.filter((r) => r.status === "Pending").length) },
          { label: "Approved", value: String(reqs.filter((r) => r.status === "Approved").length) },
          {
            label: "Processed",
            value: String(reqs.filter((r) => r.status === "Processed").length),
          },
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, department, requester…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ReqStatus | "All")}
          >
            <SelectTrigger className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {(["Pending", "Approved", "Processed", "Rejected"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline / Table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Req #</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Requested By</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Approved By</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const StatusIcon = statusIcons[r.status];
                return (
                  <tr
                    key={r.id}
                    className="group border-b border-border/30 transition hover:bg-card/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                    <td className="px-4 py-3 font-medium">{r.department}</td>
                    <td className="px-4 py-3">{r.requestedBy}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.items.reduce((s, i) => s + i.qty, 0)} items
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          statusStyles[r.status],
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.approvedBy || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailReq(r)}
                          className="rounded-lg border border-border/50 bg-card/40 p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {r.status === "Pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(r.id, "Approved")}
                              className="rounded-lg border border-border/50 bg-card/40 p-1.5 text-info hover:border-info/40 hover:bg-info/10"
                              title="Approve"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, "Rejected")}
                              className="rounded-lg border border-border/50 bg-card/40 p-1.5 text-destructive hover:border-destructive/40 hover:bg-destructive/10"
                              title="Reject"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {r.status === "Approved" && (
                          <button
                            onClick={() => updateStatus(r.id, "Processed")}
                            className="rounded-lg border border-border/50 bg-card/40 p-1.5 text-success hover:border-success/40 hover:bg-success/10"
                            title="Mark processed"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No requisitions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">{detailReq.id}</h3>
                <p className="text-xs text-muted-foreground">
                  {detailReq.date} · {detailReq.department}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    statusStyles[detailReq.status],
                  )}
                >
                  {detailReq.status}
                </span>
                <button
                  onClick={() => setDetailReq(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-3 text-sm text-muted-foreground">
              Requested by:{" "}
              <span className="font-medium text-foreground">{detailReq.requestedBy}</span>
              {detailReq.approvedBy && (
                <>
                  {" "}
                  · Approved by:{" "}
                  <span className="font-medium text-foreground">{detailReq.approvedBy}</span>
                </>
              )}
            </div>

            {detailReq.notes && (
              <div className="mb-3 rounded-xl border border-border/50 bg-card/40 px-4 py-2 text-sm">
                {detailReq.notes}
              </div>
            )}

            <div className="rounded-xl border border-border/50 bg-card/40 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <span>Item</span>
                <span className="flex gap-6">
                  <span>Qty</span>
                  <span>UOM</span>
                </span>
              </div>
              <ul className="space-y-2">
                {detailReq.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span>{it.name}</span>
                    <span className="flex items-center gap-4 tabular-nums">
                      <span className="w-10 text-center">{it.qty}</span>
                      <span className="w-16 text-right text-muted-foreground">{it.uom}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {detailReq.status === "Pending" && (
                <>
                  <button
                    onClick={() => {
                      updateStatus(detailReq.id, "Approved");
                      setDetailReq(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-info px-4 py-2 text-sm font-semibold text-white shadow-lg"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      updateStatus(detailReq.id, "Rejected");
                      setDetailReq(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </>
              )}
              {detailReq.status === "Approved" && (
                <button
                  onClick={() => {
                    updateStatus(detailReq.id, "Processed");
                    setDetailReq(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Processed
                </button>
              )}
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Requisition Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-xl rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">New Requisition</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Department
                  </label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60 focus:ring-0 shadow-none">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Requested By
                  </label>
                  <input
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Notes
                  </label>
                  <textarea
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    rows={2}
                    placeholder="Reason for requisition…"
                    className="w-full resize-none rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Items
                  </label>
                  <button
                    onClick={addReqItem}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>

                {reqItems.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No items added.</p>
                )}

                <div className="space-y-2">
                  {reqItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/30 p-3"
                    >
                      <input
                        value={item.name}
                        onChange={(e) => updateReqItem(idx, "name", e.target.value)}
                        placeholder="Item name"
                        className="flex-1 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
                      />
                      <input
                        type="number"
                        value={item.qty || ""}
                        onChange={(e) => updateReqItem(idx, "qty", parseInt(e.target.value) || 0)}
                        placeholder="Qty"
                        min="1"
                        className="w-16 rounded-lg border border-border/60 bg-card/40 px-2 py-2 text-sm text-center outline-none focus:border-primary/60 tabular-nums"
                      />
                      <Select value={item.uom} onValueChange={(v) => updateReqItem(idx, "uom", v)}>
                        <SelectTrigger className="w-20 rounded-lg border border-border/60 bg-card/40 px-2 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                          <SelectValue placeholder="UOM" />
                        </SelectTrigger>
                        <SelectContent>
                          {["pcs", "kg", "liters", "btls", "boxes", "packs"].map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => removeReqItem(idx)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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
                onClick={createRequisition}
                disabled={
                  !requestedBy.trim() ||
                  reqItems.filter((it) => it.name.trim() && it.qty > 0).length === 0
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Submit Requisition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
