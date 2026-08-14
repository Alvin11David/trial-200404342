import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Store,
  ListTree,
  Percent,
  Table2,
  Package,
  ChefHat,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useStore,
  upsertPosOutlet,
  deletePosOutlet,
  upsertPosTable,
  deletePosTable,
  upsertMenuCategory,
  deleteMenuCategory,
  upsertMenuItem,
  deleteMenuItem,
  recipeLinesForMenuItem,
  saveMenuItemRecipe,
  deleteMenuItemRecipe,
  SERVICE_PERIOD_OPTIONS,
  menuItemStockStatus,
  type PosOutlet,
  type PosTable,
  type MenuCategory,
  type MenuItem,
  type VatTreatment,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TabId = "outlets" | "tables" | "categories" | "products" | "tax";

const tabs: { id: TabId; label: string; icon: typeof Store }[] = [
  { id: "outlets", label: "Outlets", icon: Store },
  { id: "tables", label: "Tables", icon: Table2 },
  { id: "categories", label: "Categories", icon: ListTree },
  { id: "products", label: "Products", icon: Package },
  { id: "tax", label: "Tax Classes", icon: Percent },
];

function PosSettingsPage() {
  const [tab, setTab] = useState<TabId>("outlets");

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600 ring-1 ring-amber-500/20">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">POS Configuration</h1>
          <p className="text-sm text-muted-foreground">Manage outlets, menu categories, products, and tax settings</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-2xl border border-border/50 bg-card/50 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "outlets" && <OutletsTab />}
      {tab === "tables" && <TablesTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "products" && <ProductsTab />}
      {tab === "tax" && <TaxTab />}
    </div>
  );
}

/* ===================== Outlets Tab ===================== */

function OutletsTab() {
  const outlets = useStore((s) => s.posOutlets);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PosOutlet | null>(null);
  const [form, setForm] = useState({ name: "", serviceChargePct: 0, inventoryEnabled: true, isActive: true });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () => outlets.filter((o) => !search || o.name.toLowerCase().includes(search.toLowerCase())),
    [outlets, search],
  );

  function openNew() {
    setEditing(null);
    setForm({ name: "", serviceChargePct: 0, inventoryEnabled: true, isActive: true });
    setShowModal(true);
  }

  function openEdit(o: PosOutlet) {
    setEditing(o);
    setForm({ name: o.name, serviceChargePct: o.serviceChargePct, inventoryEnabled: o.inventoryEnabled ?? true, isActive: o.isActive });
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim()) return;
    upsertPosOutlet({
      id: editing?.id ?? `PO${Date.now()}`,
      name: form.name.trim(),
      propertyId: undefined,
      departmentCode: editing?.departmentCode,
      serviceChargePct: form.serviceChargePct,
      inventoryEnabled: form.inventoryEnabled,
      isActive: form.isActive,
      legacyRef: editing?.legacyRef,
    });
    toast.success(editing ? "Outlet updated" : "Outlet created");
    setShowModal(false);
  }

  function remove(id: string) {
    const res = deletePosOutlet(id);
    setConfirmDelete(null);
    if (!res.ok) {
      toast.error(res.errors?.join(", ") ?? "Cannot delete this outlet");
    } else {
      toast.success("Outlet deleted");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search outlets..."
            className="w-full rounded-xl border border-border/50 bg-background/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
          />
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Outlet
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{o.name}</span>
                  {!o.isActive && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Service charge: {o.serviceChargePct}%</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(o)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/30">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setConfirmDelete(o.id)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {confirmDelete === o.id && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-2xl w-80" onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-bold text-lg">Delete &ldquo;{o.name}&rdquo;?</h3>
                  <p className="text-sm text-muted-foreground mt-1">This cannot be undone.</p>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
                    <button onClick={() => remove(o.id)} className="flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No outlets found.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">{editing ? "Edit Outlet" : "New Outlet"}</h3>
              <button onClick={() => setShowModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Outlet Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Main Restaurant"
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Service Charge (%)</label>
                <input
                  type="number"
                  value={form.serviceChargePct}
                  onChange={(e) => setForm({ ...form, serviceChargePct: Number(e.target.value) })}
                  min={0}
                  max={100}
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="outlet-active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="outlet-active" className="text-sm">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="outlet-inventory"
                  checked={form.inventoryEnabled}
                  onChange={(e) => setForm({ ...form, inventoryEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="outlet-inventory" className="text-sm">Inventory enabled (deduct stock on sales)</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
              <button onClick={save} disabled={!form.name.trim()} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                <Check className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                {editing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Tables Tab ===================== */

function TablesTab() {
  const tables = useStore((s) => s.posTables);
  const outlets = useStore((s) => s.posOutlets);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PosTable | null>(null);
  const [form, setForm] = useState({ tableName: "", posOutletId: "", seatingCapacity: 4, isActive: true });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () => tables.filter((t) => !search || t.tableName.toLowerCase().includes(search.toLowerCase())),
    [tables, search],
  );

  function openNew() {
    setEditing(null);
    setForm({ tableName: "", posOutletId: outlets[0]?.id ?? "", seatingCapacity: 4, isActive: true });
    setShowModal(true);
  }

  function openEdit(t: PosTable) {
    setEditing(t);
    setForm({ tableName: t.tableName, posOutletId: t.posOutletId, seatingCapacity: t.seatingCapacity, isActive: t.isActive });
    setShowModal(true);
  }

  function save() {
    if (!form.tableName.trim() || !form.posOutletId) return;
    upsertPosTable({
      id: editing?.id ?? `PT${Date.now()}`,
      posOutletId: form.posOutletId,
      tableName: form.tableName.trim(),
      seatingCapacity: form.seatingCapacity,
      isActive: form.isActive,
      legacyRef: editing?.legacyRef,
    });
    toast.success(editing ? "Table updated" : "Table created");
    setShowModal(false);
  }

  function remove(id: string) {
    deletePosTable(id);
    setConfirmDelete(null);
    toast.success("Table deleted");
  }

  const outletName = (id: string) => outlets.find((o) => o.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tables..."
            className="w-full rounded-xl border border-border/50 bg-background/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
          />
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm">
          <Plus className="h-4 w-4" /> Add Table
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Table2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t.tableName}</span>
                  {!t.isActive && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{outletName(t.posOutletId)} · Seats {t.seatingCapacity}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(t)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/30">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setConfirmDelete(t.id)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {confirmDelete === t.id && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-2xl w-80" onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-bold text-lg">Delete &ldquo;{t.tableName}&rdquo;?</h3>
                  <p className="text-sm text-muted-foreground mt-1">This cannot be undone.</p>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
                    <button onClick={() => remove(t.id)} className="flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No tables found.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">{editing ? "Edit Table" : "New Table"}</h3>
              <button onClick={() => setShowModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Table Name</label>
                <input
                  value={form.tableName}
                  onChange={(e) => setForm({ ...form, tableName: e.target.value })}
                  placeholder="e.g. Table 10, VIP Lounge"
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Outlet</label>
                <Select value={form.posOutletId} onValueChange={(v) => setForm({ ...form, posOutletId: v })}>
                  <SelectTrigger className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm shadow-none">
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.filter((o) => o.isActive).map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Seating Capacity</label>
                <input
                  type="number"
                  value={form.seatingCapacity}
                  onChange={(e) => setForm({ ...form, seatingCapacity: Number(e.target.value) })}
                  min={1}
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="table-active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="table-active" className="text-sm">Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
              <button onClick={save} disabled={!form.tableName.trim() || !form.posOutletId} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                <Check className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                {editing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Categories Tab ===================== */

function CategoriesTab() {
  const categories = useStore((s) => s.menuCategories);
  const outlets = useStore((s) => s.posOutlets);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [form, setForm] = useState({ name: "", posOutletId: "", displayOrder: 0, isActive: true });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () => categories.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search],
  );

  function openNew() {
    setEditing(null);
    setForm({ name: "", posOutletId: outlets[0]?.id ?? "", displayOrder: categories.length + 1, isActive: true });
    setShowModal(true);
  }

  function openEdit(c: MenuCategory) {
    setEditing(c);
    setForm({ name: c.name, posOutletId: c.posOutletId, displayOrder: c.displayOrder, isActive: c.isActive });
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim()) return;
    upsertMenuCategory({
      id: editing?.id ?? `MC${Date.now()}`,
      posOutletId: form.posOutletId,
      name: form.name.trim(),
      displayOrder: form.displayOrder,
      isActive: form.isActive,
    });
    toast.success(editing ? "Category updated" : "Category created");
    setShowModal(false);
  }

  function remove(id: string) {
    deleteMenuCategory(id);
    setConfirmDelete(null);
    toast.success("Category deleted");
  }

  const outletName = (id: string) => outlets.find((o) => o.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-xl border border-border/50 bg-background/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
          />
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-600">
                <ListTree className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{c.name}</span>
                  {!c.isActive && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{outletName(c.posOutletId)} · Order: {c.displayOrder}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(c)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/30">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setConfirmDelete(c.id)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {confirmDelete === c.id && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-2xl w-80" onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-bold text-lg">Delete &ldquo;{c.name}&rdquo;?</h3>
                  <p className="text-sm text-muted-foreground mt-1">This cannot be undone.</p>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
                    <button onClick={() => remove(c.id)} className="flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No categories found.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">{editing ? "Edit Category" : "New Category"}</h3>
              <button onClick={() => setShowModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Starters"
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Outlet</label>
                <Select value={form.posOutletId} onValueChange={(v) => setForm({ ...form, posOutletId: v })}>
                  <SelectTrigger className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm shadow-none">
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.filter((o) => o.isActive).map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Display Order</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                  min={0}
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="cat-active" className="text-sm">Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
              <button onClick={save} disabled={!form.name.trim() || !form.posOutletId} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                <Check className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                {editing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Products Tab ===================== */

function ProductsTab() {
  const products = useStore((s) => s.menuItems);
  const stockItems = useStore((s) => s.stockItems);
  const outlets = useStore((s) => s.posOutlets);
  const categories = useStore((s) => s.menuCategories);
  const { role } = useRole();
  const actor = ROLE_META[role].person;
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [recipeFor, setRecipeFor] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    posOutletId: "",
    menuCategoryId: "",
    stockItemId: "",
    unitPrice: 0,
    vatTreatment: "inclusive" as VatTreatment,
    availabilityPeriods: ["all_day"] as string[],
    isActive: true,
    isSoldOut: false,
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () => products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive),
    [categories],
  );

  function openNew() {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      posOutletId: outlets[0]?.id ?? "",
      menuCategoryId: "",
      stockItemId: "",
      unitPrice: 0,
      vatTreatment: "inclusive",
      availabilityPeriods: ["all_day"],
      isActive: true,
      isSoldOut: false,
    });
    setShowModal(true);
  }

  function openEdit(p: MenuItem) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      posOutletId: p.posOutletId,
      menuCategoryId: p.menuCategoryId,
      stockItemId: p.stockItemId ?? "",
      unitPrice: p.unitPrice,
      vatTreatment: p.vatTreatment,
      availabilityPeriods: p.availabilityPeriods?.length ? p.availabilityPeriods : ["all_day"],
      isActive: p.isActive,
      isSoldOut: p.isSoldOut ?? false,
    });
    setShowModal(true);
  }

  function togglePeriod(period: string) {
    setForm((f) => {
      const has = f.availabilityPeriods.includes(period);
      const next = has ? f.availabilityPeriods.filter((p) => p !== period) : [...f.availabilityPeriods, period];
      return { ...f, availabilityPeriods: next.length ? next : ["all_day"] };
    });
  }

  function save() {
    if (!form.name.trim() || !form.posOutletId || !form.menuCategoryId) return;
    upsertMenuItem({
      id: editing?.id ?? `MI${Date.now()}`,
      posOutletId: form.posOutletId,
      menuCategoryId: form.menuCategoryId,
      stockItemId: form.stockItemId && form.stockItemId !== "__none__" ? form.stockItemId : undefined,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      unitPrice: form.unitPrice,
      vatTreatment: form.vatTreatment,
      availabilityPeriods: form.availabilityPeriods,
      isActive: form.isActive,
      isSoldOut: form.isSoldOut,
    });
    toast.success(editing ? "Product updated" : "Product created");
    setShowModal(false);
  }

  function remove(id: string) {
    deleteMenuItem(id);
    setConfirmDelete(null);
    toast.success("Product deleted");
  }

  const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const outletLabel = (id: string) => outlets.find((o) => o.id === id)?.name ?? id;

  const TAX_LABEL: Record<VatTreatment, string> = {
    inclusive: "VAT Inclusive",
    exclusive: "VAT Exclusive",
    exempt: "VAT Exempt",
    not_applicable: "N/A",
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-border/50 bg-background/40 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No products found</p>
        )}
        {filtered.map((p) => {
          const DeletIcon = confirmDelete === p.id ? Check : Trash2;
          return (
            <div key={p.id} className="group relative flex items-center gap-4 rounded-xl border border-border/40 bg-card/30 px-4 py-3 transition hover:border-border/60 hover:bg-card/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{p.name}</span>
                  {(p.isSoldOut || menuItemStockStatus(p).soldOut) && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">86</span>
                  )}
                  {!p.isActive && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Inactive</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{outletLabel(p.posOutletId)}</span>
                  <span>{categoryLabel(p.menuCategoryId)}</span>
                  <span className="font-medium text-foreground/70">UGX {p.unitPrice.toLocaleString()}</span>
                  <span>{TAX_LABEL[p.vatTreatment]}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {confirmDelete === p.id ? (
                  <>
                    <button onClick={() => remove(p.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted/50">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setRecipeFor(p)}
                      className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground/70 hover:bg-primary/10 hover:text-primary"
                      title="Recipe / BOM"
                    >
                      <ChefHat className="h-4 w-4" />
                      Recipe
                    </button>
                    <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{editing ? "Edit Product" : "New Product"}</h3>
              <button onClick={() => setShowModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Product Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Grilled Chicken"
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description (optional)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description..."
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Outlet</label>
                  <Select value={form.posOutletId} onValueChange={(v) => setForm({ ...form, posOutletId: v, menuCategoryId: "" })}>
                    <SelectTrigger className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm shadow-none">
                      <SelectValue placeholder="Select outlet" />
                    </SelectTrigger>
                    <SelectContent>
                      {outlets.filter((o) => o.isActive).map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
                  <Select value={form.menuCategoryId} onValueChange={(v) => setForm({ ...form, menuCategoryId: v })}>
                    <SelectTrigger className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm shadow-none">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCategories.filter((c) => c.posOutletId === form.posOutletId).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Price (UGX)</label>
                <input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: Math.max(0, Number(e.target.value)) })}
                  min={0}
                  step={100}
                  placeholder="e.g. 25000"
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tax Class</label>
                <Select value={form.vatTreatment} onValueChange={(v) => setForm({ ...form, vatTreatment: v as VatTreatment })}>
                  <SelectTrigger className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {([
                      { value: "inclusive" as VatTreatment, label: "VAT Inclusive (18% tax in price)" },
                      { value: "exclusive" as VatTreatment, label: "VAT Exclusive (18% added on top)" },
                      { value: "exempt" as VatTreatment, label: "VAT Exempt (zero-rated)" },
                      { value: "not_applicable" as VatTreatment, label: "Not Applicable" },
                    ]).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Linked Stock Item (optional — auto-86 when out of stock)</label>
                <Select value={form.stockItemId} onValueChange={(v) => setForm({ ...form, stockItemId: v })}>
                  <SelectTrigger className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm shadow-none">
                    <SelectValue placeholder="No stock link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No stock link</SelectItem>
                    {stockItems.filter((s) => s.isActive).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.currentQuantity} in stock)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Availability Periods</label>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_PERIOD_OPTIONS.map((opt) => {
                    const active = form.availabilityPeriods.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => togglePeriod(opt.value)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                          active ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="product-active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="product-active" className="text-sm">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="product-86"
                  checked={form.isSoldOut}
                  onChange={(e) => setForm({ ...form, isSoldOut: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="product-86" className="text-sm">
                  <span className="font-semibold text-destructive">86 — sold out</span> (hide from ordering)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
              <button onClick={save} disabled={!form.name.trim() || !form.posOutletId || !form.menuCategoryId} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                <Check className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                {editing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {recipeFor && <RecipeModal product={recipeFor} actor={actor} onClose={() => setRecipeFor(null)} />}
    </div>
  );
}

/* ===================== Recipe / BOM Modal ===================== */

function RecipeModal({ product, actor, onClose }: { product: MenuItem; actor: string; onClose: () => void }) {
  const _recipes = useStore((s) => s.menuItemRecipes);
  const stockItems = useStore((s) => s.stockItems);
  const [newStockItemId, setNewStockItemId] = useState("");
  const [newQty, setNewQty] = useState("1");

  const lines = recipeLinesForMenuItem(product.id);
  const totalCost = lines.reduce((s, l) => s + l.cost, 0);
  const margin = product.unitPrice - totalCost;
  const marginPct = product.unitPrice > 0 ? (margin / product.unitPrice) * 100 : 0;

  function currentLines() {
    return lines.map((l) => ({ stockItemId: l.stockItemId, quantity: l.quantity }));
  }

  function addLine() {
    const qty = Number(newQty);
    if (!newStockItemId || !(qty > 0)) {
      toast.error("Select an ingredient and enter a quantity");
      return;
    }
    if (currentLines().some((l) => l.stockItemId === newStockItemId)) {
      toast.error("Ingredient already in the recipe");
      return;
    }
    const res = saveMenuItemRecipe(product.id, [...currentLines(), { stockItemId: newStockItemId, quantity: qty }], actor);
    if (!res.ok) {
      toast.error(res.errors?.[0] ?? "Failed to save recipe");
      return;
    }
    toast.success("Ingredient added");
    setNewStockItemId("");
    setNewQty("1");
  }

  function removeLine(stockItemId: string) {
    saveMenuItemRecipe(
      product.id,
      currentLines().filter((l) => l.stockItemId !== stockItemId),
      actor,
    );
    toast.success("Ingredient removed");
  }

  function clearRecipe() {
    deleteMenuItemRecipe(product.id);
    toast.success("Recipe cleared — this dish will not deduct inventory");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Recipe / BOM — {product.name}</h3>
            <p className="text-xs text-muted-foreground">Raw ingredients consumed from the Kitchen Store per dish sold at the POS</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Ingredient cost / dish</p>
            <p className="text-lg font-bold">UGX {Math.round(totalCost).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Selling price</p>
            <p className="text-lg font-bold">UGX {product.unitPrice.toLocaleString()}</p>
          </div>
          <div className={cn("rounded-xl border p-3", margin >= 0 ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5")}>
            <p className="text-xs text-muted-foreground">Gross margin / dish</p>
            <p className={cn("text-lg font-bold", margin >= 0 ? "text-success" : "text-destructive")}>
              {marginPct >= 0 ? "" : "-"}UGX {Math.abs(Math.round(margin)).toLocaleString()} ({Math.round(Math.abs(marginPct))}%)
            </p>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <select
            value={newStockItemId}
            onChange={(e) => setNewStockItemId(e.target.value)}
            className="flex-1 rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
          >
            <option value="">— Select ingredient (stock item) —</option>
            {stockItems.filter((s) => s.isActive).map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
            ))}
          </select>
          <input
            type="number"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            min={0}
            step="any"
            placeholder="Qty"
            className="w-24 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
          />
          <button onClick={addLine} className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2">Ingredient</th>
                <th className="px-4 py-2 text-right">Per dish</th>
                <th className="px-4 py-2 text-right">Unit cost</th>
                <th className="px-4 py-2 text-right">Cost / dish</th>
                <th className="px-4 py-2 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {lines.map((l) => (
                <tr key={l.stockItemId}>
                  <td className="px-4 py-2 font-medium">{l.name}<span className="ml-1 text-xs text-muted-foreground">({l.unit})</span></td>
                  <td className="px-4 py-2 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-4 py-2 text-right tabular-nums">UGX {l.unitCost.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">UGX {Math.round(l.cost).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => removeLine(l.stockItemId)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No recipe yet — this dish will fall back to its linked stock item (if any).
                </td></tr>
              )}
            </tbody>
            {lines.length > 0 && (
              <tfoot className="bg-muted/20">
                <tr className="font-semibold">
                  <td className="px-4 py-2">Total ingredient cost / dish</td>
                  <td />
                  <td />
                  <td className="px-4 py-2 text-right tabular-nums">UGX {Math.round(totalCost).toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button onClick={clearRecipe} className="text-xs text-destructive hover:underline">Clear recipe</button>
          <button onClick={onClose} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Done</button>
        </div>
      </div>
    </div>
  );
}

/* ===================== Tax Tab ===================== */

const TAX_CLASSES: { value: VatTreatment; label: string; desc: string }[] = [
  { value: "inclusive", label: "VAT Inclusive", desc: "Tax included in the listed price" },
  { value: "exclusive", label: "VAT Exclusive", desc: "Tax added on top of the listed price" },
  { value: "exempt", label: "VAT Exempt", desc: "Zero-rated, no tax applied" },
  { value: "not_applicable", label: "Not Applicable", desc: "No tax treatment" },
];

function TaxTab() {
  const menuItems = useStore((s) => s.menuItems);
  const [search, setSearch] = useState("");

  const items = useMemo(
    () => menuItems.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase())),
    [menuItems, search],
  );

  function setTax(itemId: string, vatTreatment: VatTreatment) {
    const item = menuItems.find((i) => i.id === itemId);
    if (item) {
      upsertMenuItem({ ...item, vatTreatment });
      toast.success(`Tax updated for ${item.name}`);
    }
  }

  const countByTax: Record<string, number> = {};
  menuItems.forEach((i) => { countByTax[i.vatTreatment] = (countByTax[i.vatTreatment] || 0) + 1; });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {TAX_CLASSES.map((t) => (
          <div key={t.value} className="rounded-xl border border-border/50 bg-card p-4">
            <p className="font-semibold text-sm">{t.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
            <p className="text-lg font-bold mt-2 tabular-nums">{countByTax[t.value] || 0} items</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu items..."
          className="w-full rounded-xl border border-border/50 bg-background/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
        />
      </div>

      <div className="rounded-2xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Current Tax</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Change To</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/30 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">UGX {item.unitPrice.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    item.vatTreatment === "inclusive" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" :
                    item.vatTreatment === "exclusive" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    item.vatTreatment === "exempt" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                  )}>
                    {TAX_CLASSES.find((t) => t.value === item.vatTreatment)?.label ?? item.vatTreatment}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={item.vatTreatment}
                    onChange={(e) => setTax(item.id, e.target.value as VatTreatment)}
                    className="rounded-lg border border-border/50 bg-background/40 px-3 py-1.5 text-xs outline-none focus:border-primary/50"
                  >
                    {TAX_CLASSES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No items found.</div>
        )}
      </div>
    </div>
  );
}

export default PosSettingsPage;
