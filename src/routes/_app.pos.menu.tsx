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
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
          <div className="flex gap-1">
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  category === cat
                    ? "bg-primary/15 text-primary shadow-inner"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => (
          <div key={item.id} className="glass card-hover relative overflow-hidden rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-success/20">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(item)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDelete(item.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-lg font-semibold">{item.name}</h3>
              <span className="inline-block mt-1 rounded-full border border-border/50 bg-card/30 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.category}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
              <span className="text-xl font-bold text-gradient-primary tabular-nums">
                {item.currency} {item.price.toLocaleString()}
              </span>
            </div>

            {/* Delete confirmation */}
            {confirmDelete === item.id && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card/95 backdrop-blur-sm">
                <div className="text-center p-4">
                  <p className="text-sm font-medium mb-3">Delete "{item.name}"?</p>
                  <div className="flex gap-2 justify-center">
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
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-sm text-muted-foreground">
            No menu items found.
          </div>
        )}

        {/* Add card */}
        <button
          onClick={openNew}
          className="glass card-hover flex min-h-[180px] items-center justify-center rounded-2xl border-2 border-dashed border-border/60 transition hover:border-primary/50"
        >
          <div className="text-center">
            <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">Add Item</p>
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
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-card">
                      {c}
                    </option>
                  ))}
                </select>
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
                  <select
                    value={form.currency}
                    onChange={(e) => set("currency", e.target.value)}
                    className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c} className="bg-card">
                        {c}
                      </option>
                    ))}
                  </select>
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
