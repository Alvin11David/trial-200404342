import { useMemo, useState } from "react";
import {
  useStore,
  upsertStockParLevel,
  deleteStockParLevel,
  nextStockParLevelId,
  quantityAtLocation,
  parLevelFor,
  parStatusAt,
  stockItemById,
  lowStockAlerts,
  overStockAlerts,
  outOfStockAlerts,
  nextPurchaseOrderId,
  nextPurchaseOrderItemId,
  upsertPurchaseOrder,
  upsertPurchaseOrderItem,
  type StockItem,
  type StorageLocation,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import { Plus, X, Edit2, Trash2, ShoppingCart, Gauge } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    low: "bg-destructive/15 text-destructive",
    out: "bg-destructive/15 text-destructive",
    ok: "bg-success/15 text-success",
    over: "bg-warning/15 text-warning",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-muted text-muted-foreground"}`;
};

type Row = {
  item: StockItem;
  location: StorageLocation;
  current: number;
  min: number;
  max?: number;
  status: "out" | "low" | "ok" | "over";
  shortfall: number;
  parId?: string;
};

type PoLine = { stockItemId: string; name: string; unitCost: number; shortfall: number; quantity: number; include: boolean };

export default function ParLevelsPage() {
  const navigate = useNavigate();
  const items = useStore((s) => s.stockItems);
  const parLevels = useStore((s) => s.stockParLevels);
  const locations = useStore((s) => s.storageLocations);
  const suppliers = useStore((s) => s.suppliers);
  const { role } = useRole();
  const actor = ROLE_META[role].person;

  const lowCount = lowStockAlerts().length;
  const overCount = overStockAlerts().length;
  const outCount = outOfStockAlerts().length;

  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [parModal, setParModal] = useState<{ editId?: string; stockItemId?: string; storageLocationId?: string } | null>(null);
  const [poModal, setPoModal] = useState(false);
  const [poSupplier, setPoSupplier] = useState("");
  const [poNotes, setPoNotes] = useState("");

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (!item.isActive) continue;
      const locs = new Set<string>(Object.keys(item.locationQuantities ?? {}));
      for (const p of parLevels) {
        if (p.stockItemId === item.id) locs.add(p.storageLocationId);
      }
      if (item.storageLocationId) locs.add(item.storageLocationId);
      for (const locId of locs) {
        const key = `${item.id}:${locId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const location = locations.find((l) => l.id === locId);
        if (!location) continue;
        const current = quantityAtLocation(item.id, locId);
        const par = parLevelFor(item.id, locId);
        out.push({
          item,
          location,
          current,
          min: par.minLevel,
          max: par.maxLevel,
          status: parStatusAt(item.id, locId),
          shortfall: Math.max(0, par.minLevel - current),
          parId: parLevels.find((p) => p.stockItemId === item.id && p.storageLocationId === locId)?.id,
        });
      }
    }
    return out;
  }, [items, parLevels, locations]);

  const filtered = rows.filter((r) => {
    if (storeFilter && r.location.id !== storeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches = r.item.name.toLowerCase().includes(q) || (r.item.sku ?? "").toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const lowRows = rows.filter((r) => r.status === "low");
  const [poLines, setPoLines] = useState<PoLine[]>([]);

  function openPoModal() {
    setPoLines(
      lowRows.map((r) => ({
        stockItemId: r.item.id,
        name: r.item.name,
        unitCost: r.item.unitCost ?? 0,
        shortfall: r.shortfall,
        quantity: r.shortfall,
        include: true,
      })),
    );
    setPoSupplier(suppliers[0]?.id ?? "");
    setPoNotes("");
    setPoModal(true);
  }

  function createPoFromLow() {
    if (!poSupplier) { toast.error("Select a supplier"); return; }
    const selected = poLines.filter((l) => l.include && l.quantity > 0);
    if (selected.length === 0) { toast.error("Select at least one item"); return; }
    const now = new Date().toISOString();
    const poId = nextPurchaseOrderId();
    const total = selected.reduce((s, l) => s + l.quantity * l.unitCost, 0);
    upsertPurchaseOrder({
      id: poId,
      propertyId: "T001",
      supplierId: poSupplier,
      orderNumber: `PO-${now.slice(0, 10)}-${poId}`,
      status: "draft",
      notes: poNotes.trim() || "Auto-created from low stock reorder",
      createdBy: actor,
      totalAmount: total,
      createdAt: now,
      updatedAt: now,
    });
    for (const l of selected) {
      upsertPurchaseOrderItem({
        id: nextPurchaseOrderItemId(),
        purchaseOrderId: poId,
        stockItemId: l.stockItemId,
        quantityOrdered: l.quantity,
        quantityReceived: 0,
        unitCost: l.unitCost,
        lineTotal: l.quantity * l.unitCost,
      });
    }
    toast.success(`PO ${poId} created for ${selected.length} item(s)`);
    setPoModal(false);
    navigate("/inventory/purchase-orders");
  }

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Reorder / Par Levels</h1>
            <p className="text-sm text-muted-foreground">Minimum & maximum stock thresholds per item per store — low stock is flagged automatically</p>
          </div>
          <div className="flex gap-2">
            <button onClick={openPoModal} disabled={lowRows.length === 0} className="flex items-center gap-2 rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary transition hover:bg-primary/10 disabled:opacity-40">
              <ShoppingCart size={16} /> Create PO from low stock
            </button>
            <button onClick={() => setParModal({})} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
              <Plus size={16} /> Set Par Level
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => setStatusFilter(statusFilter === "low" ? "all" : "low")} className={cn("rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left transition", statusFilter === "low" && "ring-2 ring-destructive/40")}>
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Low Stock</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{lowCount}</p>
          </button>
          <button onClick={() => setStatusFilter(statusFilter === "out" ? "all" : "out")} className={cn("rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left transition", statusFilter === "out" && "ring-2 ring-destructive/40")}>
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Out of Stock</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{outCount}</p>
          </button>
          <button onClick={() => setStatusFilter(statusFilter === "over" ? "all" : "over")} className={cn("rounded-lg border border-warning/30 bg-warning/5 p-4 text-left transition", statusFilter === "over" && "ring-2 ring-warning/40")}>
            <p className="text-xs font-semibold uppercase tracking-wider text-warning">Overstock</p>
            <p className="mt-1 text-2xl font-bold text-warning">{overCount}</p>
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item or SKU…" className={cn(inputCls, "w-64")} />
          <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className={cn(inputCls, "w-56")}>
            <option value="">All stores</option>
            {locations.filter((l) => l.isActive).map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3 text-right">Current</th>
                <th className="px-4 py-3 text-right">Min</th>
                <th className="px-4 py-3 text-right">Max</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Reorder Qty</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={`${r.item.id}:${r.location.id}`} className="border-t border-border/40">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.item.name}</p>
                    {r.item.sku && <span className="font-mono text-[10px] text-muted-foreground/60">{r.item.sku}</span>}
                  </td>
                  <td className="px-4 py-3">{r.location.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.current}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.min}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.max ?? "—"}</td>
                  <td className="px-4 py-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", r.shortfall > 0 ? "text-destructive" : "text-muted-foreground")}>
                    {r.shortfall > 0 ? r.shortfall : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setParModal({ editId: r.parId, stockItemId: r.item.id, storageLocationId: r.location.id })}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={r.parId ? "Edit par" : "Set par"}
                      >
                        <Edit2 size={14} />
                      </button>
                      {r.parId && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove par level for ${r.item.name} at ${r.location.name}?`)) {
                              deleteStockParLevel(r.parId!);
                              toast.success("Par level removed");
                            }
                          }}
                          className="rounded p-1 text-destructive hover:bg-destructive/10"
                          title="Delete par"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground/70">No par levels match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {parModal && (
        <ParModal
          key={`${parModal.editId ?? "new"}-${parModal.stockItemId ?? ""}-${parModal.storageLocationId ?? ""}`}
          parId={parModal.editId}
          initialItem={parModal.stockItemId}
          initialLocation={parModal.storageLocationId}
          onClose={() => setParModal(null)}
        />
      )}

      {poModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPoModal(false)}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Create PO from Low Stock</h2>
              <button onClick={() => setPoModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            {poLines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No low stock items to reorder.</p>
            ) : (
              <div className="space-y-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                      <th className="py-2 text-left"></th>
                      <th className="py-2 text-left">Item</th>
                      <th className="py-2 text-right">Shortfall</th>
                      <th className="py-2 text-right">Order Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {poLines.map((l, i) => (
                      <tr key={l.stockItemId}>
                        <td className="py-2"><input type="checkbox" checked={l.include} onChange={(e) => setPoLines(poLines.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))} /></td>
                        <td className="py-2">{l.name}</td>
                        <td className="py-2 text-right tabular-nums text-destructive">{l.shortfall}</td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) => setPoLines(poLines.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) || 0 } : x)))}
                            className={cn(inputCls, "w-20 text-right tabular-nums")}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Supplier *</label>
                    <select value={poSupplier} onChange={(e) => setPoSupplier(e.target.value)} className={cn(inputCls, "w-full")}>
                      <option value="">Select supplier</option>
                      {suppliers.filter((s) => s.isActive).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Notes</label>
                    <input value={poNotes} onChange={(e) => setPoNotes(e.target.value)} className={cn(inputCls, "w-full")} placeholder="Auto-created from low stock reorder" />
                  </div>
                </div>
                <button onClick={createPoFromLow} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                  <ShoppingCart size={16} /> Create Draft PO
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ParModal({
  parId,
  initialItem,
  initialLocation,
  onClose,
}: {
  parId?: string;
  initialItem?: string;
  initialLocation?: string;
  onClose: () => void;
}) {
  const stockItems = useStore((s) => s.stockItems);
  const locations = useStore((s) => s.storageLocations);
  const parLevels = useStore((s) => s.stockParLevels);
  const existing = parId ? parLevels.find((p) => p.id === parId) : undefined;
  const [form, setForm] = useState({
    stockItemId: existing?.stockItemId ?? initialItem ?? "",
    storageLocationId: existing?.storageLocationId ?? initialLocation ?? "",
    minLevel: existing?.minLevel?.toString() ?? "0",
    maxLevel: existing?.maxLevel?.toString() ?? "",
    notes: existing?.notes ?? "",
  });

  const activeItems = stockItems.filter((i) => i.isActive);
  const currentQty = quantityAtLocation(form.stockItemId, form.storageLocationId);

  function save() {
    if (!form.stockItemId) { toast.error("Select an item"); return; }
    if (!form.storageLocationId) { toast.error("Select a store"); return; }
    const min = Math.max(0, Math.floor(Number(form.minLevel) || 0));
    const maxRaw = form.maxLevel.trim() === "" ? undefined : Math.floor(Number(form.maxLevel));
    const max = maxRaw !== undefined && maxRaw > 0 ? maxRaw : undefined;
    if (max !== undefined && max <= min) { toast.error("Max must be greater than min"); return; }
    upsertStockParLevel({
      id: parId ?? nextStockParLevelId(),
      propertyId: "T001",
      stockItemId: form.stockItemId,
      storageLocationId: form.storageLocationId,
      minLevel: min,
      maxLevel: max,
      notes: form.notes.trim() || undefined,
    });
    toast.success(parId ? "Par level updated" : "Par level set");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{parId ? "Edit Par Level" : "Set Par Level"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium block mb-1">Item *</label>
              <select value={form.stockItemId} onChange={(e) => setForm({ ...form, stockItemId: e.target.value })} className={cn(inputCls, "w-full")}>
                <option value="">Select item</option>
                {activeItems.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium block mb-1">Store *</label>
              <select value={form.storageLocationId} onChange={(e) => setForm({ ...form, storageLocationId: e.target.value })} className={cn(inputCls, "w-full")}>
                <option value="">Select store</option>
                {locations.filter((l) => l.isActive).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Min level *</label>
              <input type="number" min={0} value={form.minLevel} onChange={(e) => setForm({ ...form, minLevel: e.target.value })} className={cn(inputCls, "w-full")} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Max level</label>
              <input type="number" min={0} value={form.maxLevel} onChange={(e) => setForm({ ...form, maxLevel: e.target.value })} placeholder="Optional" className={cn(inputCls, "w-full")} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={cn(inputCls, "w-full")} />
          </div>
          <p className="text-xs text-muted-foreground">
            Current stock: <span className="font-semibold text-foreground">{currentQty}</span> {form.stockItemId ? `· ${stockItemById(form.stockItemId)?.unit ?? ""}` : ""}
          </p>
          <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Gauge size={16} /> {parId ? "Save Changes" : "Set Par Level"}
          </button>
        </div>
      </div>
    </div>
  );
}
