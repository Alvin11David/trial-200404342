import { useState } from "react";
import {
  useStore,
  createStocktake,
  updateStocktakeItem,
  finalizeStocktake,
  reconcileStocktake,
  cancelStocktake,
  deleteStocktake,
  stocktakeVarianceSummary,
  stockItemById,
  storageLocationById,
  type Stocktake,
  type StocktakeItem,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import { Plus, X, Eye, Trash2, ArrowLeft, Ban, CheckCircle2, PlayCircle, ClipboardList, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

const CAN_RECONCILE = ["Owner / GM", "Inventory Manager"];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    finalized: "bg-primary/15 text-primary",
    reconciled: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-muted text-muted-foreground"}`;
};

const fmt = (n: number) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n);

export default function StocktakePage() {
  const stocktakes = useStore((s) => s.stocktakes);
  const allItems = useStore((s) => s.stocktakeItems);
  const locations = useStore((s) => s.storageLocations);
  const { role } = useRole();
  const actor = ROLE_META[role].person;
  const canReconcile = CAN_RECONCILE.includes(role);

  const [showNew, setShowNew] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", storageLocationId: "", plannedDate: "", notes: "" });

  const activeLocations = locations.filter((l) => l.isActive);

  function openNew() {
    setForm({ name: "", storageLocationId: "", plannedDate: "", notes: "" });
    setShowNew(true);
  }

  function confirmCreate() {
    if (!form.name.trim()) { toast.error("Enter a stocktake name"); return; }
    if (!form.storageLocationId) { toast.error("Select a store to count"); return; }
    const id = createStocktake({
      name: form.name.trim(),
      storageLocationId: form.storageLocationId,
      plannedDate: form.plannedDate || undefined,
      notes: form.notes.trim() || undefined,
      createdBy: actor,
      createdByRole: role,
    });
    setShowNew(false);
    setDetailId(id);
    toast.success("Stocktake created — enter physical counts");
  }

  const detail = detailId ? stocktakes.find((t) => t.id === detailId) : undefined;
  const lines = detailId ? allItems.filter((i) => i.stocktakeId === detailId) : [];

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Stocktaking</h1>
            <p className="text-sm text-muted-foreground">Periodic physical counts per store — variance is calculated and reconciled to stock automatically</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> New Stocktake
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3">Stocktake</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Count Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-center">Variances</th>
                <th className="px-4 py-3">Counted By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocktakes.map((t) => {
                const itemCount = allItems.filter((i) => i.stocktakeId === t.id).length;
                const varianceCount = allItems.filter(
                  (i) => i.stocktakeId === t.id && (i.variance ?? 0) !== 0,
                ).length;
                return (
                  <tr key={t.id} className="border-t border-border/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/70">{t.id}</p>
                    </td>
                    <td className="px-4 py-3">{storageLocationById(t.storageLocationId)?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{t.plannedDate ? new Date(`${t.plannedDate}T00:00:00`).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3"><span className={statusBadge(t.status)}>{t.status}</span></td>
                    <td className="px-4 py-3 text-center tabular-nums">{itemCount}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{varianceCount}</td>
                    <td className="px-4 py-3">{t.createdBy}</td>
                    <td className="px-4 py-3 text-xs">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setDetailId(t.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="View">
                          <Eye size={14} />
                        </button>
                        {t.status === "draft" && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete draft ${t.name}?`)) {
                                deleteStocktake(t.id);
                                if (detailId === t.id) setDetailId(null);
                                toast.success("Stocktake deleted");
                              }
                            }}
                            className="rounded p-1 text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {(t.status === "draft" || t.status === "finalized") && canReconcile && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Cancel ${t.name}?`)) {
                                cancelStocktake(t.id);
                                setDetailId(null);
                                toast.success("Stocktake cancelled");
                              }
                            }}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Cancel"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {stocktakes.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground/70">No stocktakes yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">New Stocktake</h2>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Store August Count" className={cn(inputCls, "w-full")} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Store *</label>
                <select value={form.storageLocationId} onChange={(e) => setForm({ ...form, storageLocationId: e.target.value })} className={cn(inputCls, "w-full")}>
                  <option value="">Select store</option>
                  {activeLocations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Planned count date</label>
                <input type="date" value={form.plannedDate} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} className={cn(inputCls, "w-full")} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={cn(inputCls, "w-full")} />
              </div>
              <button onClick={confirmCreate} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                <ClipboardList size={16} /> Create Stocktake
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <StocktakeDetail
          t={detail}
          lines={lines}
          actor={actor}
          canReconcile={canReconcile}
          onClose={() => setDetailId(null)}
        />
      )}
    </>
  );
}

function StocktakeDetail({
  t,
  lines,
  actor,
  canReconcile,
  onClose,
}: {
  t: Stocktake;
  lines: StocktakeItem[];
  actor: string;
  canReconcile: boolean;
  onClose: () => void;
}) {
  const [counts, setCounts] = useState<Record<string, string>>(
    Object.fromEntries(lines.map((l) => [l.stockItemId, l.physicalQuantity?.toString() ?? ""])),
  );

  const isDraft = t.status === "draft";
  const isFinalized = t.status === "finalized";
  const isReconciled = t.status === "reconciled";

  const display = (l: StocktakeItem) => {
    if (isDraft) {
      const raw = counts[l.stockItemId] ?? "";
      return raw === "" ? 0 : Number(raw);
    }
    return l.physicalQuantity ?? 0;
  };

  const summary = stocktakeVarianceSummary(t.id);
  const shortageValue = summary.shortageValue;
  const surplusValue = summary.surplusValue;
  const varianceCount = summary.varianceCount;
  const netValue = summary.netValue;

  function confirmFinalize() {
    const result = finalizeStocktake(t.id, actor);
    if (!result.ok) { toast.error(result.errors?.join("; ")); return; }
    toast.success("Count finalized — ready to reconcile");
  }

  function confirmReconcile() {
    if (!window.confirm(`Post ${varianceCount} variance movement(s) to stock for ${t.name}? This adjusts inventory and is audited.`)) return;
    const result = reconcileStocktake(t.id, actor);
    if (!result.ok) { toast.error(result.errors?.join("; ")); return; }
    toast.success("Variances posted — stock reconciled");
  }

  function exportCsv() {
    const rows = [
      ["Item", "SKU", "System", "Physical", "Variance", "Value (UGX)"],
      ...lines.map((l) => {
        const si = stockItemById(l.stockItemId);
        const variance = (l.physicalQuantity ?? 0) - l.systemQuantity;
        return [
          si?.name ?? l.stockItemId,
          si?.sku ?? "",
          String(l.systemQuantity),
          String(l.physicalQuantity ?? 0),
          String(variance),
          String(variance * (l.unitCost ?? 0)),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.id}-variance-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back to stocktakes
          </button>
          <span className={statusBadge(t.status)}>{t.status}</span>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Physical Count</p>
              <p className="text-xl font-bold">{t.name}</p>
              <p className="font-mono text-xs text-muted-foreground/70">{t.id}</p>
            </div>
            <div className="text-right text-sm">
              <p><span className="text-muted-foreground">Store:</span> <span className="font-medium">{storageLocationById(t.storageLocationId)?.name ?? "—"}</span></p>
              {t.plannedDate && <p><span className="text-muted-foreground">Planned date:</span> <span className="font-medium">{new Date(`${t.plannedDate}T00:00:00`).toLocaleDateString()}</span></p>}
              <p><span className="text-muted-foreground">Counted by:</span> <span className="font-medium">{t.createdBy}</span></p>
            </div>
          </div>

          {(isFinalized || isReconciled) && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-destructive">Shortage</p>
                <p className="mt-1 text-lg font-bold text-destructive tabular-nums">UGX {fmt(shortageValue)}</p>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-success">Surplus</p>
                <p className="mt-1 text-lg font-bold text-success tabular-nums">UGX {fmt(surplusValue)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Net variance</p>
                <p className={cn("mt-1 text-lg font-bold tabular-nums", netValue < 0 ? "text-destructive" : netValue > 0 ? "text-success" : "text-muted-foreground")}>
                  UGX {fmt(netValue)}
                </p>
              </div>
            </div>
          )}

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2.5 text-left">Item</th>
                <th className="py-2.5 text-right">System (store)</th>
                <th className="py-2.5 text-right">Physical</th>
                <th className="py-2.5 text-right">Variance</th>
                <th className="py-2.5 text-right">Value (UGX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {lines.map((l) => {
                const si = stockItemById(l.stockItemId);
                const physical = display(l);
                const variance = physical - l.systemQuantity;
                return (
                  <tr key={l.id}>
                    <td className="py-2.5">
                      {si?.name ?? l.stockItemId}
                      {si?.sku && <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">{si.sku}</span>}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">{l.systemQuantity}</td>
                    <td className="py-2.5 text-right">
                      {isDraft ? (
                        <input
                          type="number"
                          min={0}
                          value={counts[l.stockItemId] ?? ""}
                          placeholder="0"
                          onChange={(e) => {
                            setCounts({ ...counts, [l.stockItemId]: e.target.value });
                            updateStocktakeItem(t.id, l.stockItemId, Number(e.target.value) || 0);
                          }}
                          className={cn(inputCls, "w-24 text-right tabular-nums")}
                        />
                      ) : (
                        <span className="tabular-nums">{l.physicalQuantity ?? 0}</span>
                      )}
                    </td>
                    <td className={cn("py-2.5 text-right font-semibold tabular-nums", variance > 0 ? "text-success" : variance < 0 ? "text-destructive" : "text-muted-foreground")}>
                      {variance > 0 ? `+${variance}` : variance}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">{fmt(variance * (l.unitCost ?? 0))}</td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No items found at this store.</td></tr>
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
            {t.createdAt && <span>Created by {t.createdBy}: {new Date(t.createdAt).toLocaleString()}</span>}
            {t.finalizedAt && <span>Finalized by {t.finalizedBy ?? "—"}: {new Date(t.finalizedAt).toLocaleString()}</span>}
            {t.reconciledAt && <span>Reconciled by {t.reconciledBy ?? "—"}: {new Date(t.reconciledAt).toLocaleString()}</span>}
            {t.cancelledAt && <span>Cancelled: {new Date(t.cancelledAt).toLocaleString()}</span>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/40 p-4">
          {isDraft && (
            <>
              {canReconcile && (
                <button
                  onClick={() => { cancelStocktake(t.id); toast.success("Stocktake cancelled"); }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Ban size={14} /> Cancel
                </button>
              )}
              <button
                onClick={confirmFinalize}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <CheckCircle2 size={14} /> Finalize Count
              </button>
            </>
          )}
          {(isFinalized || isReconciled) && (
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Download size={14} /> Export Variance CSV
            </button>
          )}
          {isFinalized && canReconcile && (
            <>
              <button
                onClick={() => { cancelStocktake(t.id); toast.success("Stocktake cancelled"); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Ban size={14} /> Void
              </button>
              <button
                onClick={confirmReconcile}
                className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-semibold text-success-foreground transition hover:bg-success/90"
              >
                <PlayCircle size={14} /> Reconcile & Post
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
