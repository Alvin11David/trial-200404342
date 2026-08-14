import { useState } from "react";
import {
  useStore,
  stockCategoryById,
  storageLocationById,
  quantityAtLocation,
  upsertStockItem,
  upsertStockCategory,
  upsertStorageLocation,
  deleteStockItem,
  deleteStockCategory,
  deleteStorageLocation,
  stockMovementsByItem,
  lowStockAlerts,
  nextStockItemId,
  nextStockCategoryId,
  nextStorageLocationId,
  type StockCategory,
  type StorageLocation,
} from "@/lib/pms-store";
import { Plus, Edit2, Trash2, History, AlertTriangle, X, Save, FolderOpen, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const UNIT_OPTIONS = [
  { value: "pcs", label: "Pieces" },
  { value: "bottles", label: "Bottles" },
  { value: "kg", label: "Kilograms" },
  { value: "liters", label: "Liters" },
  { value: "grams", label: "Grams" },
  { value: "bags", label: "Bags" },
  { value: "boxes", label: "Boxes" },
  { value: "rolls", label: "Rolls" },
  { value: "pairs", label: "Pairs" },
  { value: "sets", label: "Sets" },
  { value: "packs", label: "Packs" },
  { value: "reams", label: "Reams" },
];

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

export default function InventoryList() {
  const items = useStore((s) => s.stockItems);
  const categories = useStore((s) => s.stockCategories);
  const stores = useStore((s) => s.storageLocations);
  const lowStockAlertsList = lowStockAlerts();
  const lowStockIds = new Set(lowStockAlertsList.map((a) => a.stockItemId));
  const lowStockLocs = new Set(lowStockAlertsList.map((a) => `${a.stockItemId}:${a.storageLocationId}`));
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [movementItemId, setMovementItemId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", unit: "pcs", stockCategoryId: "", storageLocationId: "", location: "", reorderLevel: 0, currentQuantity: 0, unitCost: 0, unitPrice: 0, sku: "", isActive: true });

  const filtered = items.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== "all" && i.stockCategoryId !== catFilter) return false;
    if (storeFilter !== "all" && i.storageLocationId !== storeFilter && quantityAtLocation(i.id, storeFilter) <= 0) return false;
    return true;
  });

  function openNew() {
    setEditId(null);
    setForm({ name: "", unit: "pcs", stockCategoryId: categories[0]?.id ?? "", storageLocationId: stores.find((s) => s.isActive)?.id ?? "", location: "", reorderLevel: 0, currentQuantity: 0, unitCost: 0, unitPrice: 0, sku: "", isActive: true });
    setShowForm(true);
  }

  function openEdit(item: typeof items[0]) {
    setEditId(item.id);
    setForm({ name: item.name, unit: item.unit, stockCategoryId: item.stockCategoryId ?? "", storageLocationId: item.storageLocationId ?? "", location: item.location ?? "", reorderLevel: item.reorderLevel, currentQuantity: item.currentQuantity, unitCost: item.unitCost ?? 0, unitPrice: item.unitPrice ?? 0, sku: item.sku ?? "", isActive: item.isActive });
    setShowForm(true);
  }

  function save() {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    upsertStockItem({
      id: editId ?? nextStockItemId(),
      propertyId: "T001",
      name: form.name.trim(),
      unit: form.unit,
      stockCategoryId: form.stockCategoryId || undefined,
      storageLocationId: form.storageLocationId || undefined,
      location: form.location || undefined,
      reorderLevel: form.reorderLevel,
      currentQuantity: form.currentQuantity,
      unitCost: form.unitCost || undefined,
      unitPrice: form.unitPrice || undefined,
      sku: form.sku || undefined,
      isActive: form.isActive,
    });
    toast.success(editId ? "Item updated" : "Item created");
    setShowForm(false);
  }

  function confirmDelete(id: string, name: string) {
    if (window.confirm(`Delete "${name}"?`)) {
      deleteStockItem(id);
      toast.success("Item deleted");
    }
  }

  const movements = movementItemId ? stockMovementsByItem(movementItemId) : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventory List</h1>
          <p className="text-sm text-muted-foreground">Item master — SKUs for F&B, housekeeping, bar, maintenance & office stock</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCats(true)} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground">
            <FolderOpen size={16} /> Manage Categories
          </button>
          <button onClick={() => setShowStores(true)} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground">
            <Warehouse size={16} /> Manage Stores
          </button>
          <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(inputCls, "w-64")}
        />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={inputCls}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className={inputCls}>
          <option value="all">All Stores</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Reorder (min)</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className={cn("border-t border-border/40", lowStockIds.has(item.id) && "bg-destructive/10")}>
                <td className="px-4 py-3 font-mono text-xs">{item.sku ?? "—"}</td>
                <td className="px-4 py-3 font-medium">
                  <span className="flex items-center gap-2">
                    {item.name}
                    {lowStockIds.has(item.id) && (
                      <span title="Low stock">
                        <AlertTriangle size={14} className="text-destructive" />
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">{stockCategoryById(item.stockCategoryId)?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="text-sm">{storageLocationById(item.storageLocationId)?.name ?? "—"}</div>
                  {item.location && <div className="text-xs text-muted-foreground">{item.location}</div>}
                  {item.locationQuantities && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(item.locationQuantities)
                        .filter(([, q]) => q > 0)
                        .map(([locId, q]) => {
                          const loc = storageLocationById(locId);
                          if (!loc) return null;
                          const low = lowStockLocs.has(`${item.id}:${locId}`);
                          return (
                            <span
                              key={locId}
                              className={cn("rounded px-1.5 py-0.5 text-[10px]", low ? "bg-destructive/15 font-semibold text-destructive" : "bg-muted text-muted-foreground")}
                              title={low ? "Below par level" : undefined}
                            >
                              {loc.name.replace(" Store", "")} {q}
                            </span>
                          );
                        })}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className={cn("px-4 py-3 text-right font-bold", lowStockIds.has(item.id) && "text-destructive")}>{item.currentQuantity}</td>
                <td className="px-4 py-3 text-right">{item.reorderLevel}</td>
                <td className="px-4 py-3 text-right">{item.unitCost?.toLocaleString() ?? "—"}</td>
                <td className="px-4 py-3 text-right">{item.unitPrice?.toLocaleString() ?? "—"}</td>
                <td className="px-4 py-3 text-center">{item.isActive ? "✓" : "✗"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setMovementItemId(movementItemId === item.id ? null : item.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="View movements">
                      <History size={14} />
                    </button>
                    <button onClick={() => openEdit(item)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => confirmDelete(item.id, item.name)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground/70">No items found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {movementItemId && (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <div className="flex justify-between items-center border-b border-border p-4">
            <h2 className="font-semibold">Movement History — {items.find((i) => i.id === movementItemId)?.name}</h2>
            <button onClick={() => setMovementItemId(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="p-4">
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No movements recorded</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Before</th>
                    <th className="pb-2 text-right">After</th>
                    <th className="pb-2">Ref</th>
                    <th className="pb-2">By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-t border-border/40">
                      <td className="py-1 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
                      <td className="py-1">
                        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium",
                          m.type === "purchase_receipt" ? "bg-success/15 text-success" :
                          m.type === "pos_sale" ? "bg-primary/10 text-primary" :
                          m.type === "breakage" || m.type === "theft" ? "bg-destructive/15 text-destructive" :
                          m.type === "expiry" || m.type === "wastage" ? "bg-warning/15 text-warning" :
                          m.type === "internal_use" ? "bg-info/15 text-info" :
                          "bg-muted text-muted-foreground",
                        )}>{m.type}</span>
                      </td>
                      <td className={cn("py-1 text-right font-medium", m.quantity > 0 ? "text-success" : "text-destructive")}>{m.quantity > 0 ? "+" : ""}{m.quantity}</td>
                      <td className="py-1 text-right">{m.balanceBefore}</td>
                      <td className="py-1 text-right">{m.balanceAfter}</td>
                      <td className="py-1 text-xs">{m.referenceType ? `${m.referenceType}:${(m.referenceId ?? "").slice(0, 8)}` : "—"}</td>
                      <td className="py-1 text-xs">{m.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editId ? "Edit Item" : "New Stock Item"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={cn(inputCls, "w-full")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={cn(inputCls, "w-full")}>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Category</label>
                  <select value={form.stockCategoryId} onChange={(e) => setForm({ ...form, stockCategoryId: e.target.value })} className={cn(inputCls, "w-full")}>
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">SKU</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={cn(inputCls, "w-full")} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Store</label>
                  <select value={form.storageLocationId} onChange={(e) => setForm({ ...form, storageLocationId: e.target.value })} className={cn(inputCls, "w-full")}>
                    <option value="">None</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Qty On Hand</label>
                  <input type="number" value={form.currentQuantity} onChange={(e) => setForm({ ...form, currentQuantity: Number(e.target.value) })} className={cn(inputCls, "w-full")} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Default Reorder Level (min)</label>
                  <input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} className={cn(inputCls, "w-full")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Unit Cost</label>
                  <input type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} className={cn(inputCls, "w-full")} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Unit Price</label>
                  <input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} className={cn(inputCls, "w-full")} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Bin / Sub-location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Cold Room, Spirits Rack 1" className={cn(inputCls, "w-full")} />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
              <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                <Save size={16} /> {editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCats && (
        <CategoryManager onClose={() => setShowCats(false)} />
      )}

      {showStores && (
        <StoreManager onClose={() => setShowStores(false)} />
      )}
    </div>
  );
}

function StoreManager({ onClose }: { onClose: () => void }) {
  const stores = useStore((s) => s.storageLocations);
  const items = useStore((s) => s.stockItems);
  const outlets = useStore((s) => s.posOutlets);
  const [newName, setNewName] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [outletEdits, setOutletEdits] = useState<Record<string, string>>({});

  function addStore() {
    const name = newName.trim();
    if (!name) { toast.error("Store name is required"); return; }
    if (stores.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error("A store with that name already exists");
      return;
    }
    upsertStorageLocation({ id: nextStorageLocationId(), propertyId: "T001", name, isActive: true });
    toast.success("Store created");
    setNewName("");
  }

  function renameStore(s: StorageLocation) {
    const name = (edits[s.id] ?? "").trim();
    if (!name || name === s.name) return;
    if (stores.some((x) => x.id !== s.id && x.name.toLowerCase() === name.toLowerCase())) {
      toast.error("A store with that name already exists");
      return;
    }
    upsertStorageLocation({ ...s, name });
    toast.success("Store renamed");
  }

  function changeOutlet(s: StorageLocation) {
    const outletId = outletEdits[s.id] || undefined;
    if (outletId === s.outletId) return;
    upsertStorageLocation({ ...s, outletId });
    toast.success(outletId ? `Store linked to ${outlets.find((o) => o.id === outletId)?.name ?? "outlet"}` : "Store unlinked from outlet");
  }

  function toggleStore(s: StorageLocation) {
    upsertStorageLocation({ ...s, isActive: !s.isActive });
  }

  function removeStore(s: StorageLocation) {
    const count = items.filter((i) => i.storageLocationId === s.id).length;
    if (!window.confirm(`Delete "${s.name}"?${count ? ` ${count} item(s) will be moved to "No store".` : ""}`)) return;
    deleteStorageLocation(s.id);
    toast.success("Store deleted");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Manage Stores</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addStore()}
            placeholder="New store name..."
            className={cn(inputCls, "flex-1")}
          />
          <button onClick={addStore} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {stores.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground/70">No stores yet</p>
          )}
          {stores.map((s) => {
            const itemCount = items.filter((i) => i.storageLocationId === s.id).length;
            return (
              <div key={s.id} className={cn("flex items-center gap-2 rounded-lg border border-border px-3 py-2", !s.isActive && "opacity-50")}>
                <div className="flex-1">
                  <input
                    value={edits[s.id] ?? s.name}
                    onChange={(e) => setEdits((p) => ({ ...p, [s.id]: e.target.value }))}
                    onBlur={() => renameStore(s)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="w-full border-b border-transparent bg-transparent text-sm font-medium outline-none focus:border-primary"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/70">{itemCount} item{itemCount === 1 ? "" : "s"}</span>
                    <select
                      value={outletEdits[s.id] ?? s.outletId ?? ""}
                      onChange={(e) => {
                        setOutletEdits((p) => ({ ...p, [s.id]: e.target.value }));
                        changeOutlet({ ...s, outletId: e.target.value || undefined });
                      }}
                      title="Linked outlet (for larger properties)"
                      className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground outline-none"
                    >
                      <option value="">No outlet</option>
                      {outlets.filter((o) => o.isActive).map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={() => toggleStore(s)} title={s.isActive ? "Deactivate" : "Activate"} className="rounded p-1 hover:bg-muted">
                  <span className={cn("inline-block h-2.5 w-2.5 rounded-full", s.isActive ? "bg-success" : "bg-muted-foreground/40")} />
                </button>
                <button onClick={() => removeStore(s)} title="Delete" className="rounded p-1 text-destructive hover:bg-destructive/10">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CategoryManager({ onClose }: { onClose: () => void }) {
  const categories = useStore((s) => s.stockCategories);
  const items = useStore((s) => s.stockItems);
  const [newName, setNewName] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  function addCat() {
    const name = newName.trim();
    if (!name) { toast.error("Category name is required"); return; }
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("A category with that name already exists");
      return;
    }
    upsertStockCategory({ id: nextStockCategoryId(), propertyId: "T001", name, isActive: true });
    toast.success("Category created");
    setNewName("");
  }

  function renameCat(c: StockCategory) {
    const name = (edits[c.id] ?? "").trim();
    if (!name || name === c.name) return;
    if (categories.some((x) => x.id !== c.id && x.name.toLowerCase() === name.toLowerCase())) {
      toast.error("A category with that name already exists");
      return;
    }
    upsertStockCategory({ ...c, name });
    toast.success("Category renamed");
  }

  function toggleCat(c: StockCategory) {
    upsertStockCategory({ ...c, isActive: !c.isActive });
  }

  function removeCat(c: StockCategory) {
    const count = items.filter((i) => i.stockCategoryId === c.id).length;
    if (!window.confirm(`Delete "${c.name}"?${count ? ` ${count} item(s) will be moved to "No category".` : ""}`)) return;
    items
      .filter((i) => i.stockCategoryId === c.id)
      .forEach((i) => upsertStockItem({ ...i, stockCategoryId: undefined }));
    deleteStockCategory(c.id);
    toast.success("Category deleted");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Manage Categories</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCat()}
            placeholder="New category name..."
            className={cn(inputCls, "flex-1")}
          />
          <button onClick={addCat} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {categories.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground/70">No categories yet</p>
          )}
          {categories.map((c) => {
            const itemCount = items.filter((i) => i.stockCategoryId === c.id).length;
            return (
              <div key={c.id} className={cn("flex items-center gap-2 rounded-lg border border-border px-3 py-2", !c.isActive && "opacity-50")}>
                <input
                  value={edits[c.id] ?? c.name}
                  onChange={(e) => setEdits((p) => ({ ...p, [c.id]: e.target.value }))}
                  onBlur={() => renameCat(c)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="flex-1 border-b border-transparent bg-transparent text-sm font-medium outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground/70">{itemCount} item{itemCount === 1 ? "" : "s"}</span>
                <button onClick={() => toggleCat(c)} title={c.isActive ? "Deactivate" : "Activate"} className="rounded p-1 hover:bg-muted">
                  <span className={cn("inline-block h-2.5 w-2.5 rounded-full", c.isActive ? "bg-success" : "bg-muted-foreground/40")} />
                </button>
                <button onClick={() => removeCat(c)} title="Delete" className="rounded p-1 text-destructive hover:bg-destructive/10">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
