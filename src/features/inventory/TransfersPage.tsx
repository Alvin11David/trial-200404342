import { useState } from "react";
import {
  useStore,
  upsertStockTransfer,
  upsertStockTransferItem,
  deleteStockTransfer,
  cancelStockTransfer,
  receiveStockTransfer,
  stockTransferItemsByTransfer,
  quantityAtLocation,
  stockItemById,
  storageLocationById,
  nextStockTransferId,
  nextStockTransferItemId,
  type StockTransfer,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import { Plus, X, Save, ArrowLeftRight, Eye, Trash2, ArrowLeft, CheckCircle, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

const CAN_RECEIVE = ["Owner / GM", "Inventory Manager", "Store Keeper"];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    completed: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-muted text-muted-foreground"}`;
};

export default function TransfersPage() {
  const transfers = useStore((s) => s.stockTransfers);
  const locations = useStore((s) => s.storageLocations);
  const stockItems = useStore((s) => s.stockItems);
  const { role } = useRole();
  const actor = ROLE_META[role].person;
  const canReceive = CAN_RECEIVE.includes(role);
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [receiveId, setReceiveId] = useState<string | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ fromLocationId: "", toLocationId: "", notes: "" });
  const [lineItems, setLineItems] = useState<{ stockItemId: string; quantity: number }[]>([]);

  const activeLocations = locations.filter((l) => l.isActive);

  function openNew() {
    setForm({ fromLocationId: "", toLocationId: "", notes: "" });
    setLineItems([]);
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
    return quantityAtLocation(stockItemId, form.fromLocationId);
  }

  function save() {
    if (!form.fromLocationId) { toast.error("Select a source store"); return; }
    if (!form.toLocationId) { toast.error("Select a destination store"); return; }
    if (form.fromLocationId === form.toLocationId) { toast.error("Source and destination must differ"); return; }
    if (lineItems.length === 0) { toast.error("Add at least one item"); return; }
    const now = new Date().toISOString();
    const transferId = nextStockTransferId();
    upsertStockTransfer({
      id: transferId,
      propertyId: "T001",
      fromStorageLocationId: form.fromLocationId,
      toStorageLocationId: form.toLocationId,
      status: "pending",
      notes: form.notes || undefined,
      createdBy: "current-user",
      createdAt: now,
    });
    for (const li of lineItems) {
      if (!li.stockItemId || li.quantity <= 0) continue;
      upsertStockTransferItem({
        id: nextStockTransferItemId(),
        transferId,
        stockItemId: li.stockItemId,
        quantity: li.quantity,
      });
    }
    toast.success("Transfer created — pending store keeper confirmation");
    setShowForm(false);
  }

  function openReceive(t: StockTransfer) {
    const qtyMap: Record<string, number> = {};
    for (const i of stockTransferItemsByTransfer(t.id)) qtyMap[i.stockItemId] = i.quantity;
    setReceiveQtys(qtyMap);
    setReceiveId(t.id);
  }

  function confirmReceive() {
    const received = Object.entries(receiveQtys)
      .filter(([, qty]) => qty > 0)
      .map(([stockItemId, quantity]) => ({ stockItemId, quantity }));
    if (received.length === 0) { toast.error("Enter a received quantity for at least one item"); return; }
    const result = receiveStockTransfer(receiveId!, received, actor);
    if (!result.ok) {
      toast.error(result.errors?.join("; "));
      return;
    }
    toast.success("Receipt confirmed — stock moved between stores");
    setReceiveId(null);
    setDetailId(null);
  }

  const detail = detailId ? transfers.find((t) => t.id === detailId) : undefined;
  const receive = receiveId ? transfers.find((t) => t.id === receiveId) : undefined;

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Transfers</h1>
            <p className="text-sm text-muted-foreground">Move stock between stores (e.g. Main Store → Bar Store) — confirmed by the store keeper</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> New Transfer
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{storageLocationById(t.fromStorageLocationId)?.name ?? t.fromStorageLocationId}</span>
                    <ArrowLeftRight className="mx-2 inline h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{storageLocationById(t.toStorageLocationId)?.name ?? t.toStorageLocationId}</span>
                  </td>
                  <td className="px-4 py-3"><span className={statusBadge(t.status)}>{t.status}</span></td>
                  <td className="px-4 py-3">{t.createdBy}</td>
                  <td className="px-4 py-3 text-xs">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDetailId(t.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="View">
                        <Eye size={14} />
                      </button>
                      {t.status === "pending" && canReceive && (
                        <button onClick={() => openReceive(t)} className="rounded p-1 text-success hover:bg-success/10" title="Confirm receipt at destination store">
                          <PackageCheck size={14} />
                        </button>
                      )}
                      {t.status === "pending" && canReceive && (
                        <button onClick={() => { cancelStockTransfer(t.id); toast.success("Transfer cancelled"); }} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Cancel">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground/70">No transfers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">New Transfer</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">From Store</label>
                  <select value={form.fromLocationId} onChange={(e) => { setForm({ ...form, fromLocationId: e.target.value }); }} className={cn(inputCls, "w-full")}>
                    <option value="">Select store</option>
                    {activeLocations.map((l) => (
                      <option key={l.id} value={l.id} disabled={l.id === form.toLocationId}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">To Store</label>
                  <select value={form.toLocationId} onChange={(e) => setForm({ ...form, toLocationId: e.target.value })} className={cn(inputCls, "w-full")}>
                    <option value="">Select store</option>
                    {activeLocations.map((l) => (
                      <option key={l.id} value={l.id} disabled={l.id === form.fromLocationId}>{l.name}</option>
                    ))}
                  </select>
                </div>
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
                {lineItems.map((li, i) => {
                  const avail = availableAt(li.stockItemId);
                  const over = avail > 0 && li.quantity > avail;
                  return (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <select
                        value={li.stockItemId}
                        onChange={(e) => updateLine(i, "stockItemId", e.target.value)}
                        className={cn(inputCls, "flex-1")}
                      >
                        <option value="">Select item</option>
                        {stockItems
                          .filter((si) => si.isActive && quantityAtLocation(si.id, form.fromLocationId) > 0)
                          .map((si) => (
                            <option key={si.id} value={si.id}>
                              {si.name} ({quantityAtLocation(si.id, form.fromLocationId)} at source)
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
                {lineItems.length === 0 && <p className="text-xs text-muted-foreground">No items to transfer</p>}
                {form.fromLocationId && lineItems.length > 0 && (
                  <p className="text-xs text-muted-foreground">Only items stocked at the source store are shown.</p>
                )}
              </div>
              <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                <Save size={16} /> Create Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <TransferDetail
          t={detail}
          canReceive={canReceive}
          onClose={() => setDetailId(null)}
          onReceive={() => openReceive(detail)}
          onDelete={() => {
            if (window.confirm(`Delete transfer ${detail.id}?`)) {
              deleteStockTransfer(detail.id);
              toast.success("Transfer deleted");
              setDetailId(null);
            }
          }}
        />
      )}

      {receive && (
        <ReceiveModal
          t={receive}
          locations={locations}
          qtys={receiveQtys}
          setQty={(stockItemId, qty) => setReceiveQtys((prev) => ({ ...prev, [stockItemId]: qty }))}
          onClose={() => setReceiveId(null)}
          onConfirm={confirmReceive}
        />
      )}
    </>
  );
}

function TransferDetail({
  t,
  canReceive,
  onClose,
  onReceive,
  onDelete,
}: {
  t: StockTransfer;
  canReceive: boolean;
  onClose: () => void;
  onReceive: () => void;
  onDelete: () => void;
}) {
  const items = stockTransferItemsByTransfer(t.id);
  const fromName = storageLocationById(t.fromStorageLocationId)?.name ?? t.fromStorageLocationId;
  const toName = storageLocationById(t.toStorageLocationId)?.name ?? t.toStorageLocationId;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back to transfers
          </button>
          <span className={statusBadge(t.status)}>{t.status}</span>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Stock Transfer</p>
              <p className="text-xl font-bold">{t.id}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">{fromName} <ArrowLeftRight className="mx-1 inline h-3.5 w-3.5 text-muted-foreground" /> {toName}</p>
              <p className="text-muted-foreground">Requested by {t.createdBy}</p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2.5 text-left">Item</th>
                <th className="py-2.5 text-right">Requested</th>
                <th className="py-2.5 text-right">Received</th>
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
                    <td className="py-2.5 text-right tabular-nums">{i.quantity}</td>
                    <td className={cn("py-2.5 text-right font-semibold tabular-nums", (i.quantityReceived ?? 0) < i.quantity ? "text-warning" : "text-success")}>
                      {i.quantityReceived ?? "—"}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No line items.</td></tr>
              )}
            </tbody>
          </table>

          {t.notes && (
            <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Notes</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.notes}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-border/50 pt-4 text-xs text-muted-foreground">
            {t.createdAt && <span>Created: {new Date(t.createdAt).toLocaleString()}</span>}
            {t.completedAt && <span>Received by {t.completedBy ?? "—"}: {new Date(t.completedAt).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border/40 p-4">
          {t.status === "pending" && canReceive && (
            <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
              <Trash2 size={14} /> Delete
            </button>
          )}
          {t.status === "pending" && canReceive && (
            <button onClick={onReceive} className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-semibold text-success-foreground transition hover:bg-success/90">
              <CheckCircle size={14} /> Confirm Receipt
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

function ReceiveModal({
  t,
  locations,
  qtys,
  setQty,
  onClose,
  onConfirm,
}: {
  t: StockTransfer;
  locations: { id: string; name: string }[];
  qtys: Record<string, number>;
  setQty: (stockItemId: string, qty: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const items = stockTransferItemsByTransfer(t.id);
  const toName = locations.find((l) => l.id === t.toStorageLocationId)?.name ?? t.toStorageLocationId;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <div>
            <h2 className="text-lg font-bold">Confirm Receipt</h2>
            <p className="text-sm text-muted-foreground">
              {t.id} · receiving at <span className="font-medium">{toName}</span>
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
                <th className="py-2.5 text-right">Qty to receive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items.map((i) => {
                const si = stockItemById(i.stockItemId);
                const available = quantityAtLocation(i.stockItemId, t.fromStorageLocationId);
                const value = qtys[i.stockItemId] ?? 0;
                const overAvailable = value > available;
                const overRequested = value > i.quantity;
                return (
                  <tr key={i.id}>
                    <td className="py-2.5">
                      {si?.name ?? i.stockItemId}
                      {si?.sku && <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">{si.sku}</span>}
                    </td>
                    <td className={cn("py-2.5 text-right tabular-nums", available <= 0 ? "text-destructive" : "text-muted-foreground")}>
                      {available}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{i.quantity}</td>
                    <td className="py-2.5 text-right">
                      <input
                        type="number"
                        min={0}
                        max={Math.min(available, i.quantity)}
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
            Receiving moves stock from the source store to {toName} and updates both store ledgers. You may receive less than requested (partial receipt).
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border/40 p-4">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
            Cancel
          </button>
          <button onClick={onConfirm} className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-semibold text-success-foreground transition hover:bg-success/90">
            <PackageCheck size={14} /> Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
