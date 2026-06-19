import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Plus, Package, FileText, ClipboardCheck, Filter, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/inventory/list")({
  head: () => ({ meta: [{ title: "Inventory List — Jambo ERP" }] }),
  component: InventoryListPage,
});

type StockItem = {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  uom: string;
  quantity: number;
  unitCost: number;
  reorderQty: number;
};

const defaultItems: StockItem[] = [
  {
    id: "inv-001",
    name: "Coca Cola (Can)",
    category: "Soft Drinks",
    subCategory: "Carbonated",
    uom: "pcs",
    quantity: 240,
    unitCost: 2_500,
    reorderQty: 50,
  },
  {
    id: "inv-002",
    name: "Mineral Water 500ml",
    category: "Soft Drinks",
    subCategory: "Still",
    uom: "pcs",
    quantity: 480,
    unitCost: 1_200,
    reorderQty: 100,
  },
  {
    id: "inv-003",
    name: "Fresh Orange Juice",
    category: "Soft Drinks",
    subCategory: "Juice",
    uom: "liters",
    quantity: 18,
    unitCost: 4_000,
    reorderQty: 30,
  },
  {
    id: "inv-004",
    name: "Mango Smoothie",
    category: "Soft Drinks",
    subCategory: "Juice",
    uom: "liters",
    quantity: 12,
    unitCost: 5_000,
    reorderQty: 20,
  },
  {
    id: "inv-005",
    name: "Johnnie Walker Red",
    category: "Spirits",
    subCategory: "Whisky",
    uom: "btls",
    quantity: 24,
    unitCost: 22_000,
    reorderQty: 12,
  },
  {
    id: "inv-006",
    name: "Jameson Irish",
    category: "Spirits",
    subCategory: "Whisky",
    uom: "btls",
    quantity: 10,
    unitCost: 18_000,
    reorderQty: 8,
  },
  {
    id: "inv-007",
    name: "Smirnoff Vodka",
    category: "Spirits",
    subCategory: "Vodka",
    uom: "btls",
    quantity: 8,
    unitCost: 16_000,
    reorderQty: 15,
  },
  {
    id: "inv-008",
    name: "Beefeater Gin",
    category: "Spirits",
    subCategory: "Gin",
    uom: "btls",
    quantity: 15,
    unitCost: 18_000,
    reorderQty: 10,
  },
  {
    id: "inv-009",
    name: "Captain Morgan Rum",
    category: "Spirits",
    subCategory: "Rum",
    uom: "btls",
    quantity: 6,
    unitCost: 15_000,
    reorderQty: 10,
  },
  {
    id: "inv-010",
    name: "Grilled Chicken (prep)",
    category: "Food",
    subCategory: "Poultry",
    uom: "kg",
    quantity: 5,
    unitCost: 12_000,
    reorderQty: 20,
  },
  {
    id: "inv-011",
    name: "Beef (prep)",
    category: "Food",
    subCategory: "Meat",
    uom: "kg",
    quantity: 22,
    unitCost: 15_000,
    reorderQty: 15,
  },
  {
    id: "inv-012",
    name: "Fish (prep)",
    category: "Food",
    subCategory: "Seafood",
    uom: "kg",
    quantity: 3,
    unitCost: 14_000,
    reorderQty: 10,
  },
  {
    id: "inv-013",
    name: "Potatoes",
    category: "Food",
    subCategory: "Vegetables",
    uom: "kg",
    quantity: 60,
    unitCost: 3_000,
    reorderQty: 40,
  },
  {
    id: "inv-014",
    name: "Cooking Oil",
    category: "Food",
    subCategory: "Cooking",
    uom: "liters",
    quantity: 25,
    unitCost: 8_000,
    reorderQty: 20,
  },
  {
    id: "inv-015",
    name: "Toilet Paper (roll)",
    category: "Supplies",
    subCategory: "Sanitary",
    uom: "pcs",
    quantity: 200,
    unitCost: 1_500,
    reorderQty: 100,
  },
  {
    id: "inv-016",
    name: "Soap (liquid)",
    category: "Supplies",
    subCategory: "Cleaning",
    uom: "liters",
    quantity: 15,
    unitCost: 6_000,
    reorderQty: 20,
  },
  {
    id: "inv-017",
    name: "Light Bulbs",
    category: "Supplies",
    subCategory: "Electrical",
    uom: "pcs",
    quantity: 8,
    unitCost: 4_500,
    reorderQty: 25,
  },
  {
    id: "inv-018",
    name: "Towel (white)",
    category: "Linen",
    subCategory: "Bathroom",
    uom: "pcs",
    quantity: 120,
    unitCost: 18_000,
    reorderQty: 50,
  },
  {
    id: "inv-019",
    name: "Bedsheet (king)",
    category: "Linen",
    subCategory: "Bedroom",
    uom: "pcs",
    quantity: 45,
    unitCost: 35_000,
    reorderQty: 30,
  },
  {
    id: "inv-020",
    name: "Pillow (standard)",
    category: "Linen",
    subCategory: "Bedroom",
    uom: "pcs",
    quantity: 60,
    unitCost: 12_000,
    reorderQty: 20,
  },
];

const categories = [...new Set(defaultItems.map((i) => i.category))];

type FormData = {
  name: string;
  category: string;
  subCategory: string;
  uom: string;
  quantity: string;
  unitCost: string;
  reorderQty: string;
};

const emptyForm: FormData = {
  name: "",
  category: categories[0],
  subCategory: "",
  uom: "pcs",
  quantity: "0",
  unitCost: "0",
  reorderQty: "0",
};

function getStatus(item: StockItem): "good" | "low" | "critical" {
  if (item.quantity <= 0) return "critical";
  if (item.quantity <= item.reorderQty * 0.5) return "critical";
  if (item.quantity <= item.reorderQty) return "low";
  return "good";
}

function InventoryListPage() {
  const [items, setItems] = useState<StockItem[]>(defaultItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "good" | "low" | "critical">("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const filtered = useMemo(
    () =>
      items.filter((it) => {
        if (categoryFilter !== "All" && it.category !== categoryFilter) return false;
        const s = getStatus(it);
        if (statusFilter !== "All" && s !== statusFilter) return false;
        if (
          search &&
          !`${it.name} ${it.category} ${it.subCategory} ${it.id}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [items, search, categoryFilter, statusFilter],
  );

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(item: StockItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      subCategory: item.subCategory,
      uom: item.uom,
      quantity: String(item.quantity),
      unitCost: String(item.unitCost),
      reorderQty: String(item.reorderQty),
    });
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim()) return;
    const qty = parseInt(form.quantity) || 0;
    const cost = parseInt(form.unitCost) || 0;
    const reorder = parseInt(form.reorderQty) || 0;

    if (editingId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                name: form.name.trim(),
                category: form.category,
                subCategory: form.subCategory,
                uom: form.uom,
                quantity: qty,
                unitCost: cost,
                reorderQty: reorder,
              }
            : it,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: `inv-${Date.now()}`,
          name: form.name.trim(),
          category: form.category,
          subCategory: form.subCategory,
          uom: form.uom,
          quantity: qty,
          unitCost: cost,
          reorderQty: reorder,
        },
      ]);
    }
    setShowModal(false);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Inventory List</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All stock items with quantities and valuations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Package className="h-4 w-4" />
            Dashboard
          </Link>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Item Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Sub-Category</th>
                <th className="px-4 py-3 font-medium">UOM</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Unit Cost</th>
                <th className="px-4 py-3 text-right font-medium">Total Value</th>
                <th className="px-4 py-3 text-right font-medium">Reorder Qty</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = getStatus(item);
                const totalVal = item.quantity * item.unitCost;
                return (
                  <tr
                    key={item.id}
                    onClick={() => openEdit(item)}
                    className="group cursor-pointer border-b border-border/30 transition hover:bg-card/40"
                  >
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.subCategory}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.uom}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      UGX {item.unitCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      UGX {totalVal.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {item.reorderQty}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          status === "good" && "border-success/30 bg-success/10 text-success",
                          status === "low" && "border-warning/30 bg-warning/10 text-warning",
                          status === "critical" &&
                            "border-destructive/30 bg-destructive/10 text-destructive",
                        )}
                      >
                        {status === "good" && "Good"}
                        {status === "low" && "Low"}
                        {status === "critical" && "Critical"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No items match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">
                {editingId ? "Edit Item" : "Add Inventory Item"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  Item Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Item name"
                  className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  Category
                </label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60 focus:ring-0 shadow-none">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  Sub-Category
                </label>
                <input
                  value={form.subCategory}
                  onChange={(e) => set("subCategory", e.target.value)}
                  placeholder="e.g. Carbonated"
                  className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  UOM
                </label>
                <Select value={form.uom} onValueChange={(v) => set("uom", v)}>
                  <SelectTrigger className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60 focus:ring-0 shadow-none">
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {["pcs", "kg", "liters", "btls", "boxes", "packs"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  Quantity
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  min="0"
                  className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  Unit Cost (UGX)
                </label>
                <input
                  type="number"
                  value={form.unitCost}
                  onChange={(e) => set("unitCost", e.target.value)}
                  min="0"
                  className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  Reorder Quantity
                </label>
                <input
                  type="number"
                  value={form.reorderQty}
                  onChange={(e) => set("reorderQty", e.target.value)}
                  min="0"
                  className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-border/60 bg-card/40 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!form.name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {editingId ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
