import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShoppingCart,
  ClipboardList,
  X,
  Check,
  CupSoda,
  FlaskConical,
  Pizza,
  Cookie,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/pos/menu")({
  head: () => ({ meta: [{ title: "Menu Items — Jambo ERP" }] }),
  component: POSMenuPage,
});

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  currency: string;
};

const categories = ["Soft Drinks", "Spirits", "Food", "Snacks"];

const defaultItems: MenuItem[] = [
  { id: "sd1", name: "Coca Cola", price: 5_000, category: "Soft Drinks", currency: "UGX" },
  { id: "sd2", name: "Fanta Orange", price: 5_000, category: "Soft Drinks", currency: "UGX" },
  { id: "sd3", name: "Sprite", price: 5_000, category: "Soft Drinks", currency: "UGX" },
  { id: "sd4", name: "Mineral Water", price: 3_000, category: "Soft Drinks", currency: "UGX" },
  { id: "sd5", name: "Fresh Orange Juice", price: 8_000, category: "Soft Drinks", currency: "UGX" },
  { id: "sd6", name: "Mango Smoothie", price: 10_000, category: "Soft Drinks", currency: "UGX" },
  { id: "sp1", name: "Johnnie Walker Red", price: 35_000, category: "Spirits", currency: "UGX" },
  { id: "sp2", name: "Jameson Irish", price: 30_000, category: "Spirits", currency: "UGX" },
  { id: "sp3", name: "Smirnoff Vodka", price: 25_000, category: "Spirits", currency: "UGX" },
  { id: "sp4", name: "Beefeater Gin", price: 28_000, category: "Spirits", currency: "UGX" },
  { id: "sp5", name: "Captain Morgan Rum", price: 26_000, category: "Spirits", currency: "UGX" },
  { id: "sp6", name: "Local Waragi", price: 15_000, category: "Spirits", currency: "UGX" },
  { id: "fd1", name: "Grilled Chicken", price: 25_000, category: "Food", currency: "UGX" },
  { id: "fd2", name: "Beef Steak", price: 35_000, category: "Food", currency: "UGX" },
  { id: "fd3", name: "Fish & Chips", price: 22_000, category: "Food", currency: "UGX" },
  { id: "fd4", name: "Chicken Burger", price: 18_000, category: "Food", currency: "UGX" },
  { id: "fd5", name: "Vegetable Curry", price: 20_000, category: "Food", currency: "UGX" },
  { id: "fd6", name: "Pasta Bolognese", price: 22_000, category: "Food", currency: "UGX" },
  { id: "sn1", name: "French Fries", price: 8_000, category: "Snacks", currency: "UGX" },
  { id: "sn2", name: "Onion Rings", price: 7_000, category: "Snacks", currency: "UGX" },
  { id: "sn3", name: "Chicken Wings", price: 15_000, category: "Snacks", currency: "UGX" },
  { id: "sn4", name: "Samosas (4 pcs)", price: 6_000, category: "Snacks", currency: "UGX" },
  { id: "sn5", name: "Spring Rolls", price: 8_000, category: "Snacks", currency: "UGX" },
  { id: "sn6", name: "Nachos", price: 12_000, category: "Snacks", currency: "UGX" },
];

const categoryConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    bar: string;
    iconBg: string;
    iconColor: string;
    badge: string;
    dot: string;
    border: string;
  }
> = {
  "Soft Drinks": {
    icon: CupSoda,
    bar: "bg-sky-500",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-600",
    badge: "bg-sky-500/15 text-sky-600",
    dot: "bg-sky-500",
    border: "hover:border-sky-500/30",
  },
  Spirits: {
    icon: FlaskConical,
    bar: "bg-amber-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    badge: "bg-amber-500/15 text-amber-600",
    dot: "bg-amber-500",
    border: "hover:border-amber-500/30",
  },
  Food: {
    icon: Pizza,
    bar: "bg-red-500",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600",
    badge: "bg-red-500/15 text-red-600",
    dot: "bg-red-500",
    border: "hover:border-red-500/30",
  },
  Snacks: {
    icon: Cookie,
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    badge: "bg-emerald-500/15 text-emerald-600",
    dot: "bg-emerald-500",
    border: "hover:border-emerald-500/30",
  },
};

const currencies = ["UGX", "USD", "KES", "TZS", "RWF"];

type FormData = {
  name: string;
  category: string;
  price: string;
  currency: string;
};

const emptyForm: FormData = { name: "", category: categories[0], price: "", currency: "UGX" };

function POSMenuPage() {
  const [items, setItems] = useState<MenuItem[]>(defaultItems);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (m) =>
          (category === "All" || m.category === category) &&
          (!search || m.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [items, category, search],
  );

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      currency: item.currency,
    });
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim() || !form.price) return;
    const price = parseInt(form.price.replace(/,/g, ""), 10);
    if (isNaN(price) || price <= 0) return;

    if (editingId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                name: form.name.trim(),
                category: form.category,
                price,
                currency: form.currency,
              }
            : it,
        ),
      );
    } else {
      const newId = `new-${Date.now()}`;
      setItems((prev) => [
        ...prev,
        {
          id: newId,
          name: form.name.trim(),
          category: form.category,
          price,
          currency: form.currency,
        },
      ]);
    }
    setShowModal(false);
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setConfirmDelete(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Menu Items</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage food, drinks and other sellable items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/pos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <ShoppingCart className="h-4 w-4" />
            POS Sell
          </Link>
          <Link
            to="/pos/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <ClipboardList className="h-4 w-4" />
            Orders
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

      {/* Category tabs + Search */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All", ...categories].map((cat) => {
              const cfg = cat !== "All" ? categoryConfig[cat] : null;
              const Icon = cfg?.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    category === cat
                      ? "bg-primary/15 text-primary shadow-inner"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => {
          const cfg = categoryConfig[item.category];
          const Icon = cfg.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                cfg.border,
              )}
            >
              <div className={cn("absolute inset-x-0 top-0 h-1", cfg.bar)} />

              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    cfg.iconBg,
                  )}
                >
                  <Icon className={cn("h-6 w-6", cfg.iconColor)} />
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(item)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(item.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-display text-base font-semibold leading-tight">
                  {item.name}
                </h3>
                <span
                  className={cn(
                    "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium",
                    cfg.badge,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                  {item.category}
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.currency}
                </span>
                <span className="text-2xl font-bold tabular-nums tracking-tight">
                  {item.price.toLocaleString()}
                </span>
              </div>

              {/* Delete overlay */}
              {confirmDelete === item.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card/95 backdrop-blur-sm">
                  <div className="p-4 text-center">
                    <p className="mb-3 text-sm font-medium">
                      Delete &ldquo;{item.name}&rdquo;?
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="rounded-xl bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-sm text-muted-foreground">
            No menu items found.
          </div>
        )}

        {/* Add card */}
        <button
          onClick={openNew}
          className="flex min-h-[200px] items-center justify-center rounded-2xl border-2 border-dashed border-border/40 bg-card/50 transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-md"
        >
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">Add Item</p>
          </div>
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">
                {editingId ? "Edit Item" : "Add Menu Item"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  Item Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Grilled Chicken"
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
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Price
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Currency
                  </label>
                  <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                    <SelectTrigger className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60 focus:ring-0 shadow-none">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                disabled={!form.name.trim() || !form.price}
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
