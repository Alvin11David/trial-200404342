import { useState } from "react";
import {
  useStore,
  upsertStockAdjustment,
  upsertStockAdjustmentItem,
  deleteStockAdjustment,
  deleteStockAdjustmentItem,
  approveStockAdjustment,
  rejectStockAdjustment,
  stockAdjustmentItemsByAdjustment,
  quantityAtLocation,
  stockItemById,
  storageLocationById,
  nextStockAdjustmentId,
  nextStockAdjustmentItemId,
  type StockAdjustment,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import { Plus, X, Save, Eye, Edit2, Trash2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

const ADJUSTMENT_TYPES = [
  { value: "wastage", label: "Wastage" },
  { value: "breakage", label: "Breakage" },
  { value: "theft", label: "Theft" },
  { value: "expiry", label: "Expiry" },
  { value: "adjustment", label: "Adjustment (count correction)" },
] as const;

const REASON_CODES: Record<string, { code: string; label: string }[]> = {
  wastage: [
    { code: "WS-01", label: "Spoiled / rotten" },
    { code: "WS-02", label: "Overproduction / leftovers" },
    { code: "WS-03", label: "Spillage" },
  ],
  breakage: [
    { code: "BR-01", label: "Broken container / bottle" },
    { code: "BR-02", label: "Broken glass / ware" },
    { code: "BR-03", label: "Damaged packaging" },
  ],
  theft: [
    { code: "TH-01", label: "Stolen stock" },
    { code: "TH-02", label: "Missing stock" },
    { code: "TH-03", label: "Suspected employee theft" },
  ],
  expiry: [
    { code: "EX-01", label: "Expired product" },
    { code: "EX-02", label: "Near expiry write-off" },
  ],
  adjustment: [
    { code: "AD-01", label: "Count correction (overstated)" },
    { code: "AD-02", label: "Count correction (understated)" },
  ],
};

const typeBadge = (t: string) => {
  const map: Record<string, string> = {
    wastage: "bg-warning/15 text-warning",
    breakage: "bg-destructive/15 text-destructive",
    theft: "bg-destructive/15 text-destructive",
    expiry: "bg-warning/15 text-warning",
    adjustment: "bg-primary/15 text-primary",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${map[t] ?? "bg-muted text-muted-foreground"}`;
};

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    approved: "bg-success/15 text-success",
    rejected: "bg-destructive/15 text-destructive",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-muted text-muted-foreground"}`;
};

export default function AdjustmentsPage() {
  const adjustments = useStore((s) => s.stockAdjustments);
  const locations = useStore((s) => s.storageLocations);
  const stockItems = useStore((s) => s.stockItems);
  const { role } = useRole();
  const actor = ROLE_META[role].person;
  const canApprove = role === "Owner / GM" || role === "Inventory Manager";
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [form, setForm] = useState({ type: "wastage", reasonCode: "", storageLocationId: "", notes: "" });
  const [lineItems, setLineItems] = useState<{ stockItemId: string; quantity: number }[]>([]);

  const activeLocations = locations.filter((l) => l.isActive);

  function openNew() {
    setEditId(null);
    setForm({ type: "wastage", reasonCode: "", storageLocationId: "", notes: "" });
    setLineItems([]);
    setShowForm(true);
  }

  function openEdit(a: StockAdjustment) {
    setEditId(a.id);
    setForm({ type: a.type, reasonCode: a.reasonCode ?? "", storageLocationId: a.storageLocationId ?? "", notes: a.notes ?? "" });
    setLineItems(
      stockAdjustmentItemsByAdjustment(a.id).map((i) => ({ stockItemId: i.stockItemId, quantity: i.quantity })),
    );
    setDetailId(null);
    setShowForm(true);
  }

  function addLine() {
    setLineItems([...lineItems, { stockItemId: "", quantity: 1 }]);
  }

  function updateLine(index: number, field: string, value: string | number) {
    const updated = [...lineItems];
    (updated[index] as Record<string, unknown>)[field] = value;
    setLineItems(updated);
  }

  function removeLine(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function availableAt(stockItemId: string) {
    return quantityAtLocation(stockItemId, form.storageLocationId);
  }

  function save() {
    if (!form.storageLocationId) { toast.error("Select a store"); return; }
    if (lineItems.length === 0) { toast.error("Add at least one item"); return; }
    const now = new Date().toISOString();
    const adjId = editId ?? nextStockAdjustmentId();
    const existing = editId ? adjustments.find((a) => a.id === editId) : undefined;
    upsertStockAdjustment({
      id: adjId,
      propertyId: "T001",
      type: form.type as StockAdjustment["type"],
      reasonCode: form.reasonCode || undefined,
      storageLocationId: form.storageLocationId,
      notes: form.notes || undefined,
      status: existing?.status ?? "pending",
      createdBy: existing?.createdBy ?? actor,
      createdByRole: existing?.createdByRole ?? role,
      approvedBy: existing?.approvedBy,
      approvedByRole: existing?.approvedByRole,
      approvedAt: existing?.approvedAt,
      rejectionReason: existing?.rejectionReason,
      createdAt: existing?.createdAt,
      updatedAt: now,
    });
    if (editId) {
      for (const item of stockAdjustmentItemsByAdjustment(adjId)) deleteStockAdjustmentItem(item.id);
    }
    for (const li of lineItems) {
      if (!li.stockItemId || li.quantity <= 0) continue;
      upsertStockAdjustmentItem({
        id: nextStockAdjustmentItemId(),
        adjustmentId: adjId,
        stockItemId: li.stockItemId,
        quantity: li.quantity,
      });
    }
    toast.success(editId ? "Adjustment updated" : "Adjustment created — awaiting approval");
    setShowForm(false);
  }

  function confirmApprove(a: StockAdjustment) {
    const result = approveStockAdjustment(a.id, actor, role);
    if (!result.ok) {
      toast.error(result.errors?.join("; "));
      return;
    }
    toast.success("Write-off approved & stock adjusted");
    setDetailId(null);
  }

  function confirmReject() {
    if (!rejectReason.trim()) { toast.error("Enter a rejection reason"); return; }
    rejectStockAdjustment(rejectId!, actor, rejectReason.trim());
    toast.success("Adjustment rejected");
    setRejectId(null);
    setRejectReason("");
  }

  const detail = detailId ? adjustments.find((a) => a.id === detailId) : undefined;

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Adjustments & Write-offs</h1>
            <p className="text-sm text-muted-foreground">Record wastage, breakage, theft & expiry — every write-off needs approval and is audited</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> New Adjustment
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-mono text-xs">{a.id}</td>
                  <td className="px-4 py-3"><span className={typeBadge(a.type)}>{a.type}</span></td>
                  <td className="px-4 py-3">{storageLocationById(a.storageLocationId)?.name ?? "—"}</td>
                  <td className="px-4 py-3"><span className={statusBadge(a.status)}>{a.status}</span></td>
                  <td className="px-4 py-3">{a.createdBy}</td>
                  <td className="px-4 py-3 text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDetailId(a.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="View">
                        <Eye size={14} />
                      </button>
                      {a.status === "pending" && (
                        <button onClick={() => openEdit(a)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {a.status === "pending" && canApprove && (
                        <button onClick={() => confirmApprove(a)} className="rounded p-1 text-success hover:bg-success/10" title="Approve">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {a.status === "pending" && canApprove && (
                        <button onClick={() => { setRejectId(a.id); setRejectReason(""); }} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Reject">
                          <XCircle size={14} />
                        </button>
                      )}
                      {a.status === "pending" && !canApprove && (
                        <button onClick={() => { deleteStockAdjustment(a.id); toast.success("Adjustment deleted"); }} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {adjustments.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground/70">No adjustments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editId ? "Edit Adjustment" : "New Adjustment"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={cn(inputCls, "w-full")}>
                    {ADJUSTMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Store</label>
                  <select value={form.storageLocationId} onChange={(e) => setForm({ ...form, storageLocationId: e.target.value })} className={cn(inputCls, "w-full")}>
                    <option value="">Select store</option>
                    {activeLocations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Reason code</label>
                <select value={form.reasonCode} onChange={(e) => setForm({ ...form, reasonCode: e.target.value })} className={cn(inputCls, "w-full")}>
                  <option value="">Select a reason code</option>
                  {(REASON_CODES[form.type] ?? []).map((rc) => (
                    <option key={rc.code} value={rc.code}>{rc.code} — {rc.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notes / Details</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={cn(inputCls, "w-full")} rows={2} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Items to write off</label>
                  <button onClick={addLine} className="text-xs text-primary hover:underline">+ Add Item</button>
                </div>
                {lineItems.map((li, i) => {
                  const avail = availableAt(li.stockItemId);
                  const over = avail > 0 && li.quantity > avail;
                  return (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <select value={li.stockItemId} onChange={(e) => updateLine(i, "stockItemId", e.target.value)} className={cn(inputCls, "flex-1")}>
                        <option value="">Select item</option>
                        {stockItems
                          .filter((si) => si.isActive && quantityAtLocation(si.id, form.storageLocationId) > 0)
                          .map((si) => (
                            <option key={si.id} value={si.id}>
                              {si.name} ({quantityAtLocation(si.id, form.storageLocationId)} at store)
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        min={0}
                        max={avail || undefined}
                        value={li.quantity}
                        onChange={(e) => updateLine(i, "quantity", Number(e.target.value))}
                        className={cn(inputCls, "w-24", over && "border-destructive/60 text-destructive")}
                      />
                      <button onClick={() => removeLine(i)} className="text-destructive hover:text-destructive/70"><X size={16} /></button>
                    </div>
                  );
                })}
                {lineItems.length === 0 && <p className="text-xs text-muted-foreground">No items to write off</p>}
              </div>
              <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                <Save size={16} /> {editId ? "Save Changes" : "Create Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <AdjustmentDetail
          a={detail}
          canApprove={canApprove}
          onClose={() => setDetailId(null)}
          onEdit={() => openEdit(detail)}
          onApprove={() => confirmApprove(detail)}
          onReject={() => { setRejectId(detail.id); setRejectReason(""); }}
          onDelete={() => {
            if (window.confirm(`Delete adjustment ${detail.id}?`)) {
              deleteStockAdjustment(detail.id);
              toast.success("Adjustment deleted");
              setDetailId(null);
            }
          }}
        />
      )}

      {rejectId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setRejectId(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Reject Adjustment</h2>
              <button onClick={() => setRejectId(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <label className="text-sm font-medium block mb-1">Rejection reason *</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className={cn(inputCls, "w-full")} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRejectId(null)} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
                Cancel
              </button>
              <button onClick={confirmReject} className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground transition hover:bg-destructive/90">
                <XCircle size={14} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdjustmentDetail({
  a,
  canApprove,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: {
  a: StockAdjustment;
  canApprove: boolean;
  onClose: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const items = stockAdjustmentItemsByAdjustment(a.id);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back to adjustments
          </button>
          <span className={statusBadge(a.status)}>{a.status}</span>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Write-off</p>
              <p className="text-xl font-bold">{a.id}</p>
              <span className={cn("mt-1 inline-block", typeBadge(a.type))}>{a.type}</span>
              {a.reasonCode && <p className="mt-1 text-xs text-muted-foreground">Reason code: <span className="font-mono font-medium">{a.reasonCode}</span></p>}
            </div>
            <div className="text-right text-sm">
              <p><span className="text-muted-foreground">Store:</span> <span className="font-medium">{storageLocationById(a.storageLocationId)?.name ?? "—"}</span></p>
              <p><span className="text-muted-foreground">Requested by:</span> <span className="font-medium">{a.createdBy}</span></p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2.5 text-left">Item</th>
                <th className="py-2.5 text-right">Write-off Qty</th>
                <th className="py-2.5 text-right">Available at store</th>
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
                    <td className="py-2.5 text-right font-semibold tabular-nums text-destructive">−{i.quantity}</td>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                      {quantityAtLocation(i.stockItemId, a.storageLocationId)}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No line items.</td></tr>
              )}
            </tbody>
          </table>

          {a.notes && (
            <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Reason</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>
            </div>
          )}

          {a.status === "rejected" && a.rejectionReason && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-destructive">Rejection reason</p>
              <p className="mt-1 text-xs text-destructive">{a.rejectionReason}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-border/50 pt-4 text-xs text-muted-foreground">
            {a.createdAt && <span>Requested by {a.createdBy}: {new Date(a.createdAt).toLocaleString()}</span>}
            {a.approvedAt && <span>Reviewed by {a.approvedBy ?? "—"}: {new Date(a.approvedAt).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border/40 p-4">
          {a.status === "pending" && (
            <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
              <Trash2 size={14} /> Delete
            </button>
          )}
          {a.status === "pending" && !canApprove && (
            <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Edit2 size={14} /> Edit
            </button>
          )}
          {a.status === "pending" && canApprove && (
            <>
              <button onClick={onReject} className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10">
                <XCircle size={14} /> Reject
              </button>
              <button onClick={onApprove} className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-semibold text-success-foreground transition hover:bg-success/90">
                <CheckCircle size={14} /> Approve & Write Off
              </button>
            </>
          )}
          <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
