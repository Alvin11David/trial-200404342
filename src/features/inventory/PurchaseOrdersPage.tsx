import { useState } from "react";
import {
  useStore,
  upsertPurchaseOrder,
  upsertPurchaseOrderItem,
  deletePurchaseOrderItem,
  deletePurchaseOrder,
  approvePurchaseOrder,
  sendPurchaseOrder,
  purchaseOrderItemsByPo,
  supplierById,
  stockItemById,
  requisitionById,
  fmtUGX,
  nextPurchaseOrderId,
  nextPurchaseOrderItemId,
  type PurchaseOrder,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import { Plus, X, Save, CheckCircle, Truck, Eye, Edit2, Printer, Smartphone, Mail, Trash2, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReceiveGoodsModal from "./receive-goods-modal";

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pending: "bg-warning/15 text-warning",
    approved: "bg-primary/15 text-primary",
    sent: "bg-info/15 text-info",
    partially_received: "bg-warning/15 text-warning",
    received: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-muted text-muted-foreground"}`;
};

const CAN_APPROVE = ["Owner / GM", "Inventory Manager"];

export default function PurchaseOrdersPage() {
  const pos = useStore((s) => s.purchaseOrders);
  const suppliers = useStore((s) => s.suppliers);
  const stockItems = useStore((s) => s.stockItems);
  const tenant = useStore((s) => s.tenant);
  const { role } = useRole();
  const actor = ROLE_META[role].person;
  const canApprove = CAN_APPROVE.includes(role);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [receiveId, setReceiveId] = useState<string | null>(null);
  const [form, setForm] = useState({ supplierId: "", notes: "" });
  const [lineItems, setLineItems] = useState<{ stockItemId: string; quantityOrdered: number; unitCost: number }[]>([]);

  function openNew() {
    setEditId(null);
    setForm({ supplierId: "", notes: "" });
    setLineItems([]);
    setShowForm(true);
  }

  function openEdit(po: PurchaseOrder) {
    setEditId(po.id);
    setForm({ supplierId: po.supplierId ?? "", notes: po.notes ?? "" });
    setLineItems(
      purchaseOrderItemsByPo(po.id).map((i) => ({
        stockItemId: i.stockItemId,
        quantityOrdered: i.quantityOrdered,
        unitCost: i.unitCost,
      })),
    );
    setDetailId(null);
    setShowForm(true);
  }

  function addLine() {
    setLineItems([...lineItems, { stockItemId: "", quantityOrdered: 1, unitCost: 0 }]);
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
    if (!form.supplierId) { toast.error("Select a supplier"); return; }
    if (lineItems.length === 0) { toast.error("Add at least one line item"); return; }
    const total = lineItems.reduce((s, li) => s + li.quantityOrdered * li.unitCost, 0);
    const now = new Date().toISOString();
    const poId = editId ?? nextPurchaseOrderId();
    const existing = editId ? pos.find((p) => p.id === editId) : undefined;
    upsertPurchaseOrder({
      id: poId,
      propertyId: "T001",
      supplierId: form.supplierId,
      orderNumber: existing?.orderNumber ?? `PO-${now.slice(0, 10)}-${poId}`,
      status: existing?.status ?? "draft",
      notes: form.notes || undefined,
      createdBy: existing?.createdBy ?? "current-user",
      approvedBy: existing?.approvedBy,
      approvedAt: existing?.approvedAt,
      receivedAt: existing?.receivedAt,
      totalAmount: total,
      createdAt: existing?.createdAt,
      updatedAt: now,
    });
    if (editId) {
      for (const item of purchaseOrderItemsByPo(poId)) deletePurchaseOrderItem(item.id);
    }
    for (const li of lineItems) {
      upsertPurchaseOrderItem({
        id: nextPurchaseOrderItemId(),
        purchaseOrderId: poId,
        stockItemId: li.stockItemId,
        quantityOrdered: li.quantityOrdered,
        quantityReceived: 0,
        unitCost: li.unitCost,
        lineTotal: li.quantityOrdered * li.unitCost,
      });
    }
    toast.success(editId ? "PO updated" : "PO created");
    setShowForm(false);
  }

  function cancelPo(po: PurchaseOrder) {
    if (!window.confirm(`Cancel ${po.orderNumber}?`)) return;
    upsertPurchaseOrder({ ...po, status: "cancelled" });
    toast.success("PO cancelled");
  }

  const detailPo = detailId ? pos.find((p) => p.id === detailId) : undefined;

  return (
    <>
      <div className="space-y-6 p-6 print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <p className="text-sm text-muted-foreground">Raise, approve and send orders to suppliers — linked to the vendor master</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> New PO
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-mono text-xs">{po.orderNumber}</td>
                  <td className="px-4 py-3">{supplierById(po.supplierId)?.name ?? "—"}</td>
                  <td className="px-4 py-3"><span className={statusBadge(po.status)}>{po.status}</span></td>
                  <td className="px-4 py-3 text-right">{fmtUGX(po.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs">{po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDetailId(po.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="View">
                        <Eye size={14} />
                      </button>
                      {po.status === "draft" && (
                        <button onClick={() => openEdit(po)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {po.status === "draft" && (
                        <button onClick={() => { upsertPurchaseOrder({ ...po, status: "pending" }); toast.success("Submitted"); }} className="rounded p-1 text-warning hover:bg-warning/10" title="Submit for approval">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {po.status === "pending" && canApprove && (
                        <button onClick={() => approvePurchaseOrder(po.id, actor)} className="rounded p-1 text-primary hover:bg-primary/10" title="Approve">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {po.status === "approved" && (
                        <button onClick={() => sendPurchaseOrder(po.id, "whatsapp")} className="rounded p-1 text-info hover:bg-info/10" title="Mark as sent to supplier">
                          <Send size={14} />
                        </button>
                      )}
                      {(po.status === "approved" || po.status === "sent" || po.status === "partially_received") && (
                        <button onClick={() => setReceiveId(po.id)} className="rounded p-1 text-success hover:bg-success/10" title="Receive goods">
                          <Truck size={14} />
                        </button>
                      )}
                      {(po.status === "draft" || po.status === "pending") && (
                        <button onClick={() => cancelPo(po)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Cancel">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pos.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground/70">No purchase orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editId ? "Edit Purchase Order" : "New Purchase Order"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Supplier</label>
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className={cn(inputCls, "w-full")}>
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={cn(inputCls, "w-full")} rows={2} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Line Items</label>
                  <button onClick={addLine} className="text-xs text-primary hover:underline">+ Add Item</button>
                </div>
                {lineItems.map((li, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <select value={li.stockItemId} onChange={(e) => updateLine(i, "stockItemId", e.target.value)} className={cn(inputCls, "flex-1")}>
                      <option value="">Select item</option>
                      {stockItems.map((si) => (
                        <option key={si.id} value={si.id}>{si.name}</option>
                      ))}
                    </select>
                    <input type="number" placeholder="Qty" value={li.quantityOrdered} onChange={(e) => updateLine(i, "quantityOrdered", Number(e.target.value))} className={cn(inputCls, "w-20")} />
                    <input type="number" placeholder="Cost" value={li.unitCost} onChange={(e) => updateLine(i, "unitCost", Number(e.target.value))} className={cn(inputCls, "w-24")} />
                    <button onClick={() => removeLine(i)} className="text-destructive hover:text-destructive/70"><X size={16} /></button>
                  </div>
                ))}
                {lineItems.length === 0 && <p className="text-xs text-muted-foreground">No line items yet</p>}
              </div>
              <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                <Save size={16} /> {editId ? "Save Changes" : "Create PO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailPo && (
        <PODetail
          po={detailPo}
          tenant={tenant}
          canApprove={canApprove}
          onSend={(via) => { sendPurchaseOrder(detailPo.id, via); toast.success(`PO marked as sent via ${via}`); }}
          onApprove={() => approvePurchaseOrder(detailPo.id, actor)}
          onReceive={() => { setDetailId(null); setReceiveId(detailPo.id); }}
          onClose={() => setDetailId(null)}
          onEdit={() => openEdit(detailPo)}
          onCancel={() => { cancelPo(detailPo); setDetailId(null); }}
          onDelete={() => {
            if (window.confirm(`Delete ${detailPo.orderNumber} permanently?`)) {
              deletePurchaseOrder(detailPo.id);
              toast.success("PO deleted");
              setDetailId(null);
            }
          }}
        />
      )}

      {receiveId && <ReceiveGoodsModal poId={receiveId} onClose={() => setReceiveId(null)} />}
    </>
  );
}

function PODetail({
  po,
  tenant,
  canApprove,
  onSend,
  onApprove,
  onReceive,
  onClose,
  onEdit,
  onCancel,
  onDelete,
}: {
  po: PurchaseOrder;
  tenant: { name: string; address?: string; phone?: string; email?: string; tin?: string };
  canApprove: boolean;
  onSend: (via: "whatsapp" | "email" | "print") => void;
  onApprove: () => void;
  onReceive: () => void;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const supplier = supplierById(po.supplierId);
  const items = purchaseOrderItemsByPo(po.id);
  const req = requisitionById(po.requisitionId);

  const summaryText = [
    `PURCHASE ORDER ${po.orderNumber} — ${tenant.name}`,
    ...items.map((i) => {
      const si = stockItemById(i.stockItemId);
      return `${si?.name ?? i.stockItemId}: ${i.quantityOrdered} x ${fmtUGX(i.unitCost)} = ${fmtUGX(i.lineTotal)}`;
    }),
    `Total: ${fmtUGX(po.totalAmount)}`,
    supplier?.paymentTerms ? `Payment terms: ${supplier.paymentTerms}` : "",
  ].filter(Boolean).join("\n");

  const waPhone = supplier?.phone?.replace(/[^0-9]/g, "");
  const mailBody = [
    `Dear ${supplier?.contactPerson ?? supplier?.name ?? "Supplier"},`,
    "",
    `Please find our purchase order ${po.orderNumber}.`,
    "",
    ...items.map((i) => {
      const si = stockItemById(i.stockItemId);
      return `${si?.name ?? i.stockItemId}: ${i.quantityOrdered} x ${fmtUGX(i.unitCost)} = ${fmtUGX(i.lineTotal)}`;
    }),
    `Total: ${fmtUGX(po.totalAmount)}`,
    supplier?.paymentTerms ? `Payment terms: ${supplier.paymentTerms}` : "",
    "",
    `Thank you,`,
    tenant.name,
  ].join("\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:static print:block print:bg-transparent print:p-0">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl print:max-h-none print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-border/40 p-4 print:hidden">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back to purchase orders
          </button>
          <div className="flex items-center gap-2">
            {waPhone && (
              <button
                onClick={() => { onSend("whatsapp"); window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(summaryText)}`, "_blank"); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Smartphone size={14} /> WhatsApp
              </button>
            )}
            {supplier?.email && (
              <a
                href={`mailto:${supplier.email}?subject=Purchase Order ${po.orderNumber} from ${tenant.name}&body=${encodeURIComponent(mailBody)}`}
                onClick={() => onSend("email")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Mail size={14} /> Email
              </a>
            )}
            <button
              onClick={() => { onSend("print"); window.print(); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:from-primary/90 hover:to-primary/70"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between border-b border-border/50 pb-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
              {tenant.address && <p className="text-xs text-muted-foreground/70">{tenant.address}</p>}
              {tenant.phone && tenant.email && <p className="text-xs text-muted-foreground/70">{tenant.phone} · {tenant.email}</p>}
              {tenant.tin && <p className="text-xs text-muted-foreground/60">TIN: {tenant.tin}</p>}
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Purchase Order</p>
              <p className="text-xl font-bold">{po.orderNumber}</p>
              <p className="text-[10px] text-muted-foreground/60">
                {po.createdAt ? `Issued: ${new Date(po.createdAt).toLocaleDateString()}` : ""}
              </p>
              <span className={cn("mt-1 inline-block", statusBadge(po.status))}>{po.status}</span>
            </div>
          </div>

          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Order from</p>
              <p className="mt-1 text-sm font-semibold">{supplier?.name ?? "—"}</p>
              {supplier?.contactPerson && <p className="text-xs text-muted-foreground/70">Attn: {supplier.contactPerson}</p>}
              {supplier?.phone && <p className="text-xs text-muted-foreground/70">{supplier.phone}</p>}
              {supplier?.email && <p className="text-xs text-muted-foreground/70">{supplier.email}</p>}
              {supplier?.address && <p className="text-xs text-muted-foreground/70">{supplier.address}</p>}
              {supplier?.taxId && <p className="text-xs text-muted-foreground/70">TIN: {supplier.taxId}</p>}
              {supplier?.paymentTerms && <p className="text-xs text-muted-foreground/70">Terms: {supplier.paymentTerms}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Deliver to</p>
              <p className="mt-1 text-sm font-semibold">{tenant.name}</p>
              {tenant.address && <p className="text-xs text-muted-foreground/70">{tenant.address}</p>}
              {tenant.phone && <p className="text-xs text-muted-foreground/70">{tenant.phone}</p>}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2.5 text-left">Item</th>
                <th className="py-2.5 text-right">Qty</th>
                <th className="py-2.5 text-right">Unit Cost</th>
                <th className="py-2.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items.length > 0 ? (
                items.map((i) => {
                  const si = stockItemById(i.stockItemId);
                  return (
                    <tr key={i.id}>
                      <td className="py-2.5 text-sm">
                        {si?.name ?? i.stockItemId}
                        {si?.sku && <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">{si.sku}</span>}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{i.quantityOrdered}</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtUGX(i.unitCost)}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{fmtUGX(i.lineTotal)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">No line items.</td></tr>
              )}
            </tbody>
          </table>

          <div className="ml-auto mt-6 w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold tabular-nums">{fmtUGX(po.totalAmount)}</span>
            </div>
          </div>

          {po.notes && (
            <div className="mt-6 rounded-lg border border-border/50 bg-muted/20 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Notes</p>
              <p className="mt-1 text-xs text-muted-foreground">{po.notes}</p>
            </div>
          )}
          {req && (
            <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-primary/70">Linked Requisition</p>
              <p className="mt-1 text-xs text-foreground">{req.id} · {req.requestedBy} · <span className="capitalize">{req.status}</span></p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-border/50 pt-4 text-xs text-muted-foreground">
            {po.createdAt && <span>Created: {new Date(po.createdAt).toLocaleString()}</span>}
            {po.approvedAt && <span>Approved by {po.approvedBy ?? "—"}: {new Date(po.approvedAt).toLocaleString()}</span>}
            {po.sentAt && <span>Sent to supplier via {po.sentVia ?? "—"}: {new Date(po.sentAt).toLocaleString()}</span>}
            {po.receivedAt && <span>Received: {new Date(po.receivedAt).toLocaleString()}</span>}
          </div>

          <p className="mt-8 text-center text-[10px] text-muted-foreground/50">
            Thank you for supplying {tenant.name}. This is a system-generated purchase order.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/40 p-4 print:hidden">
          {(po.status === "draft" || po.status === "pending") && (
            <button onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10">
              <X size={14} /> Cancel PO
            </button>
          )}
          {po.status === "draft" && (
            <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
              <Trash2 size={14} /> Delete
            </button>
          )}
          {po.status === "draft" && (
            <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Edit2 size={14} /> Edit
            </button>
          )}
          {po.status === "pending" && canApprove && (
            <button onClick={onApprove} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">
              <CheckCircle size={14} /> Approve
            </button>
          )}
          {po.status === "approved" && (
            <button onClick={() => onSend("whatsapp")} className="inline-flex items-center gap-1.5 rounded-xl border border-info/40 px-4 py-2 text-xs font-semibold text-info transition hover:bg-info/10">
              <Send size={14} /> Mark as Sent
            </button>
          )}
          {(po.status === "approved" || po.status === "sent" || po.status === "partially_received") && (
            <button onClick={onReceive} className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-semibold text-success-foreground transition hover:bg-success/90">
              <Truck size={14} /> Receive Goods
            </button>
          )}
          <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">
            Close
          </button>
        </div>
      </div>
      <style>{`@media print { body { background: white; } header, aside, nav { display: none !important; } main { padding: 0 !important; } .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
}
