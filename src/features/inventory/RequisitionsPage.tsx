import { useState } from "react";
import {
  useStore,
  upsertRequisition,
  upsertRequisitionItem,
  deleteRequisitionItem,
  deleteRequisition,
  approveRequisition,
  issueRequisition,
  requisitionItemsByReq,
  stockItemById,
  nextRequisitionId,
  nextRequisitionItemId,
  nextPurchaseOrderId,
  nextPurchaseOrderItemId,
  upsertPurchaseOrder,
  upsertPurchaseOrderItem,
  type Requisition,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import { Plus, X, Save, CheckCircle, PackageCheck, Eye, Edit2, Trash2, ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

const CAN_APPROVE = ["Owner / GM", "Inventory Manager", "Store Keeper"];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    approved: "bg-primary/15 text-primary",
    fulfilled: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-muted text-muted-foreground"}`;
};

export default function RequisitionsPage() {
  const navigate = useNavigate();
  const reqs = useStore((s) => s.requisitions);
  const outlets = useStore((s) => s.posOutlets);
  const stockItems = useStore((s) => s.stockItems);
  const suppliers = useStore((s) => s.suppliers);
  const { role } = useRole();
  const actor = ROLE_META[role].person;
  const canApprove = CAN_APPROVE.includes(role);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [issueReqId, setIssueReqId] = useState<string | null>(null);
  const [issueQtys, setIssueQtys] = useState<Record<string, number>>({});
  const [poReqId, setPoReqId] = useState<string | null>(null);
  const [form, setForm] = useState({ posOutletId: "", notes: "" });
  const [lineItems, setLineItems] = useState<{ stockItemId: string; quantityRequested: number }[]>([]);

  function openNew() {
    setEditId(null);
    setForm({ posOutletId: "", notes: "" });
    setLineItems([]);
    setShowForm(true);
  }

  function openEdit(r: Requisition) {
    setEditId(r.id);
    setForm({ posOutletId: r.posOutletId ?? "", notes: r.notes ?? "" });
    setLineItems(
      requisitionItemsByReq(r.id).map((i) => ({
        stockItemId: i.stockItemId,
        quantityRequested: i.quantityRequested,
      })),
    );
    setDetailId(null);
    setShowForm(true);
  }

  function addLine() {
    setLineItems([...lineItems, { stockItemId: "", quantityRequested: 1 }]);
  }

  function updateLine(index: number, field: string, value: string | number) {
    const updated = [...lineItems];
    (updated[index] as Record<string, unknown>)[field] = value;
    setLineItems(updated);
  }

  function removeLine(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function save() {
    if (!form.posOutletId) { toast.error("Select a department / outlet"); return; }
    if (lineItems.length === 0) { toast.error("Add at least one item"); return; }
    const now = new Date().toISOString();
    const reqId = editId ?? nextRequisitionId();
    const existing = editId ? reqs.find((r) => r.id === editId) : undefined;
    upsertRequisition({
      id: reqId,
      propertyId: "T001",
      posOutletId: form.posOutletId,
      requestedBy: existing?.requestedBy ?? "current-user",
      status: existing?.status ?? "pending",
      notes: form.notes || undefined,
      approvedBy: existing?.approvedBy,
      approvedAt: existing?.approvedAt,
      issuedBy: existing?.issuedBy,
      fulfilledAt: existing?.fulfilledAt,
      createdAt: existing?.createdAt,
      updatedAt: now,
    });
    if (editId) {
      for (const item of requisitionItemsByReq(reqId)) deleteRequisitionItem(item.id);
    }
    for (const li of lineItems) {
      upsertRequisitionItem({
        id: nextRequisitionItemId(),
        requisitionId: reqId,
        stockItemId: li.stockItemId,
        quantityRequested: li.quantityRequested,
      });
    }
    toast.success(editId ? "Requisition updated" : "Requisition created");
    setShowForm(false);
  }

  function cancelReq(r: Requisition) {
    if (!window.confirm(`Cancel requisition ${r.id}?`)) return;
    upsertRequisition({ ...r, status: "cancelled" });
    toast.success("Requisition cancelled");
  }

  function openIssue(r: Requisition) {
    const qtyMap: Record<string, number> = {};
    for (const i of requisitionItemsByReq(r.id)) {
      qtyMap[i.stockItemId] = i.quantityApproved ?? i.quantityRequested;
    }
    setIssueQtys(qtyMap);
    setIssueReqId(r.id);
  }

  function confirmIssue() {
    const issued = Object.entries(issueQtys)
      .filter(([, qty]) => qty > 0)
      .map(([stockItemId, quantity]) => ({ stockItemId, quantity }));
    if (issued.length === 0) { toast.error("Enter an issue quantity for at least one item"); return; }
    const result = issueRequisition(issueReqId!, issued, "current-user");
    if (!result.ok) {
      toast.error(result.errors?.join("; "));
      return;
    }
    toast.success("Stock issued to department");
    setIssueReqId(null);
  }

  const detailReq = detailId ? reqs.find((r) => r.id === detailId) : undefined;
  const issueReq = issueReqId ? reqs.find((r) => r.id === issueReqId) : undefined;

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Requisitions</h1>
            <p className="text-sm text-muted-foreground">Departments request stock from the store — store keeper approves and issues</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> New Requisition
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Department / Outlet</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reqs.map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3">{outlets.find((o) => o.id === r.posOutletId)?.name ?? r.departmentCode ?? "—"}</td>
                  <td className="px-4 py-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="px-4 py-3">{r.requestedBy}</td>
                  <td className="px-4 py-3 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDetailId(r.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="View">
                        <Eye size={14} />
                      </button>
                      {r.status === "pending" && (
                        <button onClick={() => openEdit(r)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {r.status === "pending" && canApprove && (
                        <button onClick={() => approveRequisition(r.id, actor)} className="rounded p-1 text-primary hover:bg-primary/10" title="Approve">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {r.status === "approved" && (
                        <button onClick={() => setPoReqId(r.id)} className="rounded p-1 text-info hover:bg-info/10" title="Create purchase order from requisition">
                          <ShoppingCart size={14} />
                        </button>
                      )}
                      {r.status === "approved" && (
                        <button onClick={() => openIssue(r)} className="rounded p-1 text-success hover:bg-success/10" title="Issue stock">
                          <PackageCheck size={14} />
                        </button>
                      )}
                      {r.status === "pending" && (
                        <button onClick={() => cancelReq(r)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Cancel">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {reqs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground/70">No requisitions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editId ? "Edit Requisition" : "New Requisition"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Requesting Department / Outlet</label>
                <select value={form.posOutletId} onChange={(e) => setForm({ ...form, posOutletId: e.target.value })} className={cn(inputCls, "w-full")}>
                  <option value="">Select outlet</option>
                  {outlets.filter((o) => o.isActive).map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={cn(inputCls, "w-full")} rows={2} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Items</label>
                  <button onClick={addLine} className="text-xs text-primary hover:underline">+ Add Item</button>
                </div>
                {lineItems.map((li, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <select value={li.stockItemId} onChange={(e) => updateLine(i, "stockItemId", e.target.value)} className={cn(inputCls, "flex-1")}>
                      <option value="">Select item</option>
                      {stockItems.filter((si) => si.isActive).map((si) => (
                        <option key={si.id} value={si.id}>{si.name} ({si.currentQuantity} in stock)</option>
                      ))}
                    </select>
                    <input type="number" placeholder="Qty" value={li.quantityRequested} onChange={(e) => updateLine(i, "quantityRequested", Number(e.target.value))} className={cn(inputCls, "w-20")} />
                    <button onClick={() => removeLine(i)} className="text-destructive hover:text-destructive/70"><X size={16} /></button>
                  </div>
                ))}
                {lineItems.length === 0 && <p className="text-xs text-muted-foreground">No items requested</p>}
              </div>
              <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                <Save size={16} /> {editId ? "Save Changes" : "Create Requisition"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailReq && (
        <RequisitionDetail
          req={detailReq}
          outlets={outlets}
          onClose={() => setDetailId(null)}
          onEdit={() => openEdit(detailReq)}
          onDelete={() => {
            if (window.confirm(`Delete requisition ${detailReq.id} permanently?`)) {
              deleteRequisition(detailReq.id);
              toast.success("Requisition deleted");
              setDetailId(null);
            }
          }}
        />
      )}

      {issueReq && (
        <IssueModal
          req={issueReq}
          outlets={outlets}
          qtys={issueQtys}
          setQty={(stockItemId, qty) => setIssueQtys((prev) => ({ ...prev, [stockItemId]: qty }))}
          onClose={() => setIssueReqId(null)}
          onConfirm={confirmIssue}
        />
      )}

      {poReqId && (
        <CreatePoFromRequisitionModal
          req={reqs.find((r) => r.id === poReqId)!}
          suppliers={suppliers}
          onClose={() => setPoReqId(null)}
          onCreated={(poId) => { setPoReqId(null); navigate("/inventory/purchase-orders"); toast.success(`Draft PO ${poId} created`); }}
        />
      )}
    </>
  );
}

function RequisitionDetail({
  req,
  outlets,
  onClose,
  onEdit,
  onDelete,
}: {
  req: Requisition;
  outlets: { id: string; name: string }[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const items = requisitionItemsByReq(req.id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back to requisitions
          </button>
          <span className={statusBadge(req.status)}>{req.status}</span>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Requisition</p>
              <p className="text-xl font-bold">{req.id}</p>
            </div>
            <div className="text-right text-sm">
              <p><span className="text-muted-foreground">Department:</span> <span className="font-medium">{outlets.find((o) => o.id === req.posOutletId)?.name ?? req.departmentCode ?? "—"}</span></p>
              <p><span className="text-muted-foreground">Requested by:</span> <span className="font-medium">{req.requestedBy}</span></p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2.5 text-left">Item</th>
                <th className="py-2.5 text-right">Requested</th>
                <th className="py-2.5 text-right">Approved</th>
                <th className="py-2.5 text-right">Issued</th>
                <th className="py-2.5 text-right">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items.map((i) => {
                const si = stockItemById(i.stockItemId);
                return (
                  <tr key={i.id}>
                    <td className="py-2.5">
                      {si?.name ?? i.stockItemId}
                      {si?.sku && <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">{si.sku}</span>}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{i.quantityRequested}</td>
                    <td className="py-2.5 text-right tabular-nums">{i.quantityApproved ?? "—"}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-success">{i.quantityIssued ?? "—"}</td>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">{si?.currentQuantity ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {req.notes && (
            <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Notes</p>
              <p className="mt-1 text-xs text-muted-foreground">{req.notes}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-border/50 pt-4 text-xs text-muted-foreground">
            {req.createdAt && <span>Requested: {new Date(req.createdAt).toLocaleString()}</span>}
            {req.approvedAt && <span>Approved by {req.approvedBy ?? "—"}: {new Date(req.approvedAt).toLocaleString()}</span>}
            {req.fulfilledAt && <span>Issued by {req.issuedBy ?? "—"}: {new Date(req.fulfilledAt).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border/40 p-4">
          {req.status === "pending" && (
            <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
              <Trash2 size={14} /> Delete
            </button>
          )}
          {req.status === "pending" && (
            <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Edit2 size={14} /> Edit
            </button>
          )}
          <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueModal({
  req,
  outlets,
  qtys,
  setQty,
  onClose,
  onConfirm,
}: {
  req: Requisition;
  outlets: { id: string; name: string }[];
  qtys: Record<string, number>;
  setQty: (stockItemId: string, qty: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const items = requisitionItemsByReq(req.id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <div>
            <h2 className="text-lg font-bold">Issue Stock</h2>
            <p className="text-sm text-muted-foreground">
              {req.id} · {outlets.find((o) => o.id === req.posOutletId)?.name ?? req.departmentCode ?? "—"}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2.5 text-left">Item</th>
                <th className="py-2.5 text-right">Available</th>
                <th className="py-2.5 text-right">Requested</th>
                <th className="py-2.5 text-right">Qty to issue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items.map((i) => {
                const si = stockItemById(i.stockItemId);
                const available = si?.currentQuantity ?? 0;
                const value = qtys[i.stockItemId] ?? 0;
                const overAvailable = value > available;
                const overRequested = value > i.quantityRequested;
                return (
                  <tr key={i.id}>
                    <td className="py-2.5">
                      {si?.name ?? i.stockItemId}
                      {si?.sku && <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">{si.sku}</span>}
                    </td>
                    <td className={cn("py-2.5 text-right tabular-nums", available <= 0 ? "text-destructive" : "text-muted-foreground")}>
                      {available}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{i.quantityRequested}</td>
                    <td className="py-2.5 text-right">
                      <input
                        type="number"
                        min={0}
                        max={Math.min(available, i.quantityRequested)}
                        value={value}
                        onChange={(e) => setQty(i.stockItemId, Math.max(0, Number(e.target.value)))}
                        className={cn(inputCls, "w-24 text-right", (overAvailable || overRequested) && "border-destructive/60 text-destructive")}
                      />
                      {(overAvailable || overRequested) && (
                        <p className="mt-0.5 text-[10px] text-destructive">Exceeds {overAvailable && overRequested ? "available & requested" : overAvailable ? "available stock" : "requested qty"}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-muted-foreground">
            Issuing moves stock out of the store and records an <span className="font-medium">internal use</span> movement against this requisition.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border/40 p-4">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
            Cancel
          </button>
          <button onClick={onConfirm} className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-semibold text-success-foreground transition hover:bg-success/90">
            <PackageCheck size={14} /> Confirm Issue
          </button>
        </div>
      </div>
    </div>
  );
}

function CreatePoFromRequisitionModal({
  req,
  suppliers,
  onClose,
  onCreated,
}: {
  req: Requisition;
  suppliers: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (poId: string) => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const reqItems = requisitionItemsByReq(req.id);
  const lines = reqItems.map((i) => ({
    stockItemId: i.stockItemId,
    quantityOrdered: i.quantityApproved ?? i.quantityRequested,
    unitCost: stockItemById(i.stockItemId)?.unitCost ?? 0,
  }));
  const total = lines.reduce((s, l) => s + l.quantityOrdered * l.unitCost, 0);

  function create() {
    if (!supplierId) { toast.error("Select a supplier"); return; }
    const now = new Date().toISOString();
    const poId = nextPurchaseOrderId();
    upsertPurchaseOrder({
      id: poId,
      propertyId: "T001",
      supplierId,
      requisitionId: req.id,
      orderNumber: `PO-${now.slice(0, 10)}-${poId}`,
      status: "draft",
      notes: notes.trim() || `Created from requisition ${req.id}`,
      createdBy: "current-user",
      totalAmount: total,
      createdAt: now,
      updatedAt: now,
    });
    for (const l of lines) {
      if (l.quantityOrdered <= 0) continue;
      upsertPurchaseOrderItem({
        id: nextPurchaseOrderItemId(),
        purchaseOrderId: poId,
        stockItemId: l.stockItemId,
        quantityOrdered: l.quantityOrdered,
        quantityReceived: 0,
        unitCost: l.unitCost,
        lineTotal: l.quantityOrdered * l.unitCost,
      });
    }
    onCreated(poId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold">Create Purchase Order</h2>
            <p className="text-sm text-muted-foreground">From requisition {req.id} · {req.requestedBy}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Supplier</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(inputCls, "w-full")} rows={2} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2 text-left">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Cost</th>
                <th className="py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {lines.map((l) => (
                <tr key={l.stockItemId}>
                  <td className="py-2">{stockItemById(l.stockItemId)?.name ?? l.stockItemId}</td>
                  <td className="py-2 text-right tabular-nums">{l.quantityOrdered}</td>
                  <td className="py-2 text-right tabular-nums">{l.unitCost.toLocaleString()}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{(l.quantityOrdered * l.unitCost).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-right text-sm font-bold tabular-nums">Total: UGX {total.toLocaleString()}</p>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted">Cancel</button>
            <button onClick={create} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
              <ShoppingCart size={15} /> Create Draft PO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
