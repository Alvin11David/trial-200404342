import { useState } from "react";
import {
  useStore,
  createGoodsReceipt,
  purchaseOrderItemsByPo,
  supplierById,
  stockItemById,
  fmtUGX,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import { X, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

export default function ReceiveGoodsModal({ poId, onClose }: { poId: string; onClose: () => void }) {
  const po = useStore((s) => s.purchaseOrders.find((p) => p.id === poId));
  const poItems = purchaseOrderItemsByPo(poId);
  const { role } = useRole();
  const actor = ROLE_META[role].person;
  const [qtys, setQtys] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const i of poItems) map[i.stockItemId] = i.quantityOrdered - i.quantityReceived;
    return map;
  });
  const [costs, setCosts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const i of poItems) map[i.stockItemId] = i.unitCost;
    return map;
  });
  const [notes, setNotes] = useState("");
  const supplier = supplierById(po?.supplierId);

  if (!po) return null;

  const submit = () => {
    const lines = poItems
      .map((i) => ({ stockItemId: i.stockItemId, quantity: qtys[i.stockItemId] ?? 0, unitCost: costs[i.stockItemId] ?? i.unitCost }))
      .filter((l) => l.quantity > 0);
    const res = createGoodsReceipt({ poId, receivedBy: actor, notes: notes.trim() || undefined, lines });
    if (!res.ok) {
      toast.error(res.error ?? "Receiving failed");
      return;
    }
    toast.success(`Goods receipt ${res.grn?.id} created for ${po.orderNumber}`);
    onClose();
  }

  const total = poItems.reduce((s, i) => s + (qtys[i.stockItemId] ?? 0) * (costs[i.stockItemId] ?? i.unitCost), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold">Receive Goods</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {po.orderNumber} · {supplier?.name ?? "—"} — creates a Goods Receipt (GRN), matches against the PO and updates stock
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-right">Ordered</th>
              <th className="py-2 text-right">Received</th>
              <th className="py-2 text-right">Outstanding</th>
              <th className="py-2 text-right">Qty to receive</th>
              <th className="py-2 text-right">Unit cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {poItems.map((i) => {
              const si = stockItemById(i.stockItemId);
              const outstanding = i.quantityOrdered - i.quantityReceived;
              const qty = qtys[i.stockItemId] ?? 0;
              const over = qty > outstanding;
              return (
                <tr key={i.id}>
                  <td className="py-2">
                    {si?.name ?? i.stockItemId}
                    {si?.sku && <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">{si.sku}</span>}
                  </td>
                  <td className="py-2 text-right tabular-nums">{i.quantityOrdered}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{i.quantityReceived}</td>
                  <td className="py-2 text-right tabular-nums">{outstanding}</td>
                  <td className="py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      max={outstanding}
                      value={qty}
                      onChange={(e) => setQtys((m) => ({ ...m, [i.stockItemId]: Math.max(0, Number(e.target.value)) }))}
                      className={cn(inputCls, "w-24 text-right", over && "border-destructive/60 text-destructive")}
                    />
                    {over && <p className="mt-0.5 text-[10px] text-destructive">Exceeds outstanding</p>}
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      value={costs[i.stockItemId] ?? i.unitCost}
                      onChange={(e) => setCosts((m) => ({ ...m, [i.stockItemId]: Math.max(0, Number(e.target.value)) }))}
                      className={cn(inputCls, "w-24 text-right")}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 flex items-start justify-between gap-4">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Receiving notes (optional)" className={cn(inputCls, "w-full max-w-xs")} rows={2} />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Receipt value</p>
            <p className="text-xl font-bold tabular-nums">{fmtUGX(total)}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted">Cancel</button>
          <button onClick={submit} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <ArrowDownToLine size={16} /> Create GRN
          </button>
        </div>
      </div>
    </div>
  );
}
