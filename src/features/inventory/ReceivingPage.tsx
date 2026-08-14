import { useState } from "react";
import {
  useStore,
  goodsReceiptItemsFor,
  supplierById,
  purchaseOrderById,
  stockItemById,
  fmtUGX,
  type GoodsReceipt,
  type PurchaseOrder,
} from "@/lib/pms-store";
import { Plus, X, Eye, Truck, ArrowDownToLine } from "lucide-react";
import ReceiveGoodsModal from "./receive-goods-modal";

const awaitable = (s: string) => s === "approved" || s === "sent" || s === "partially_received";

export default function ReceivingPage() {
  const grns = useStore((s) => s.goodsReceipts);
  const pos = useStore((s) => s.purchaseOrders);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const awaiting = pos.filter((p) => awaitable(p.status));
  const detailGrn = detailId ? grns.find((g) => g.id === detailId) : undefined;

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Goods Receipts / Receiving</h1>
            <p className="text-sm text-muted-foreground">Receive goods against a purchase order — creates a GRN, updates stock and feeds the 3-way match</p>
          </div>
          <button onClick={() => setPickerOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> New Receipt
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Receipt</p>
            <p className="mt-1 text-2xl font-bold text-warning">{awaiting.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goods Receipts</p>
            <p className="mt-1 text-2xl font-bold">{grns.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fully Received POs</p>
            <p className="mt-1 text-2xl font-bold">{pos.filter((p) => p.status === "received").length}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3">GRN #</th>
                <th className="px-4 py-3">PO</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Lines</th>
                <th className="px-4 py-3">Received By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grns.map((g) => {
                const po = purchaseOrderById(g.poId);
                const items = goodsReceiptItemsFor(g.id);
                return (
                  <tr key={g.id} className="border-t border-border/40">
                    <td className="px-4 py-3 font-mono text-xs">{g.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{po?.orderNumber ?? g.poId}</td>
                    <td className="px-4 py-3">{supplierById(po?.supplierId)?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{items.reduce((s, i) => s + i.quantityReceived, 0)}</td>
                    <td className="px-4 py-3">{g.receivedBy}</td>
                    <td className="px-4 py-3 text-xs">{new Date(g.receivedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDetailId(g.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="View">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {grns.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground/70">No goods receipts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pickerOpen && (
        <PoPicker
          pos={awaiting}
          onPick={(poId) => {
            setPickerOpen(false);
            setReceivePoId(poId);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {receivePoId && <ReceiveGoodsModal poId={receivePoId} onClose={() => setReceivePoId(null)} />}

      {detailGrn && <GrnDetail grn={detailGrn} onClose={() => setDetailId(null)} />}
    </>
  );
}

function PoPicker({ pos, onPick, onClose }: { pos: PurchaseOrder[]; onPick: (poId: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Select Purchase Order</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        {pos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approved or sent purchase orders awaiting receipt.</p>
        ) : (
          <div className="space-y-2">
            {pos.map((po) => (
              <button
                key={po.id}
                onClick={() => onPick(po.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border/60 p-3 text-left transition hover:bg-muted/40"
              >
                <div>
                  <p className="text-sm font-semibold">{po.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{supplierById(po.supplierId)?.name ?? "—"} · <span className="capitalize">{po.status.replace("_", " ")}</span></p>
                </div>
                <span className="text-xs font-medium text-primary">{fmtUGX(po.totalAmount)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GrnDetail({ grn, onClose }: { grn: GoodsReceipt; onClose: () => void }) {
  const po = purchaseOrderById(grn.poId);
  const items = goodsReceiptItemsFor(grn.id);
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <div>
            <h2 className="text-lg font-bold">Goods Receipt {grn.id}</h2>
            <p className="text-sm text-muted-foreground">{po?.orderNumber} · {supplierById(po?.supplierId)?.name ?? "—"}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-right">Qty Received</th>
              <th className="py-2 text-right">Unit Cost</th>
              <th className="py-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {items.map((i) => (
              <tr key={i.id}>
                <td className="py-2">{stockItemById(i.stockItemId)?.name ?? i.stockItemId}</td>
                <td className="py-2 text-right tabular-nums">{i.quantityReceived}</td>
                <td className="py-2 text-right tabular-nums">{fmtUGX(i.unitCost)}</td>
                <td className="py-2 text-right font-semibold tabular-nums">{fmtUGX(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Truck size={13} /> Received by {grn.receivedBy} · {new Date(grn.receivedAt).toLocaleString()}
          </p>
          <p className="text-sm font-bold tabular-nums">{fmtUGX(total)}</p>
        </div>
        {grn.notes && <p className="mt-3 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">{grn.notes}</p>}
        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <ArrowDownToLine size={15} /> Close
          </button>
        </div>
      </div>
    </div>
  );
}
