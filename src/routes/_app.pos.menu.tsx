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
  head: () => ({ meta: [{ title: "Menu Items \u2014 Jambo PMS" }] }),
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

const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; bar: string; iconBg: string; iconColor: string; badge: string; dot: string; border: string; blobFrom: string; blobTo: string; iconFrom: string; iconTo: string }> = {
  "Soft Drinks": {
    icon: CupSoda, bar: "bg-sky-500", iconBg: "bg-sky-500/10", iconColor: "text-sky-600",
    badge: "bg-sky-500/15 text-sky-600", dot: "bg-sky-500", border: "hover:border-sky-500/30",
    blobFrom: "from-sky-400/20", blobTo: "to-sky-600/10", iconFrom: "from-sky-500", iconTo: "to-sky-700",
  },
  Spirits: {
    icon: FlaskConical, bar: "bg-amber-500", iconBg: "bg-amber-500/10", iconColor: "text-amber-600",
    badge: "bg-amber-500/15 text-amber-600", dot: "bg-amber-500", border: "hover:border-amber-500/30",
    blobFrom: "from-amber-400/20", blobTo: "to-amber-600/10", iconFrom: "from-amber-500", iconTo: "to-amber-700",
  },
  Food: {
    icon: Pizza, bar: "bg-red-500", iconBg: "bg-red-500/10", iconColor: "text-red-600",
    badge: "bg-red-500/15 text-red-600", dot: "bg-red-500", border: "hover:border-red-500/30",
    blobFrom: "from-red-400/20", blobTo: "to-red-600/10", iconFrom: "from-red-500", iconTo: "to-red-700",
  },
  Snacks: {
    icon: Cookie, bar: "bg-emerald-500", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600",
    badge: "bg-emerald-500/15 text-emerald-600", dot: "bg-emerald-500", border: "hover:border-emerald-500/30",
    blobFrom: "from-emerald-400/20", blobTo: "to-emerald-600/10", iconFrom: "from-emerald-500", iconTo: "to-emerald-700",
  },
};

const currencies = ["UGX", "USD", "KES", "TZS", "RWF"];

type FormData = { name: string; category: string; price: string; currency: string };
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
    () => items.filter(
      (m) => (category === "All" || m.category === category) && (!search || m.name.toLowerCase().includes(search.toLowerCase())),
    ),
    [items, category, search],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => { counts[item.category] = (counts[item.category] || 0) + 1; });
    return counts;
  }, [items]);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) { setForm((f) => ({ ...f, [k]: v })); }

  function openNew() { setEditingId(null); setForm(emptyForm); setShowModal(true); }

  function openEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({ name: item.name, category: item.category, price: String(item.price), currency: item.currency });
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim() || !form.price) return;
    const price = parseInt(form.price.replace(/,/g, ""), 10);
    if (isNaN(price) || price <= 0) return;
    if (editingId) {
      setItems((prev) => prev.map((it) => it.id === editingId ? { ...it, name: form.name.trim(), category: form.category, price, currency: form.currency } : it));
    } else {
      setItems((prev) => [...prev, { id: `new-${Date.now()}`, name: form.name.trim(), category: form.category, price, currency: form.currency }]);
    }
    setShowModal(false);
  }

  function remove(id: string) { setItems((prev) => prev.filter((it) => it.id !== id)); setConfirmDelete(null); }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="mx-auto max-w-7xl pb-24 relative" role="main" aria-label="Menu Items">
      {/* Header */}
      <header className="group/header relative mb-6 flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card/85 via-card/65 to-card/40 px-6 py-5 shadow-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-500 group-hover/header:before:opacity-100 before:bg-gradient-to-r before:from-primary/[0.03] before:via-transparent before:to-primary/[0.02]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent blur-3xl transition-all duration-700 group-hover/header:scale-110 group-hover/header:from-primary/[0.12]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-gradient-to-tr from-amber-500/[0.05] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-1 rounded-full bg-primary animate-accent-slide" />
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Point of Sale</p>
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-breathe" />
            <span className="h-1.5 w-px bg-border/60" />
            <span className="text-[10px] tabular-nums text-muted-foreground/60 font-medium">{dateStr}</span>
          </div>
          <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">Menu Items</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground/80 leading-relaxed">Manage food, drinks and other sellable items</p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <Link
            to="/pos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:text-foreground hover:bg-card/80"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            POS Sell
          </Link>
          <Link
            to="/pos/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:text-foreground hover:bg-card/80"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Orders
          </Link>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Items", value: String(items.length) },
          { label: "Categories", value: String(categories.length) },
          { label: "Min Price", value: Math.min(...items.map(i => i.price)).toLocaleString() },
          { label: "Max Price", value: Math.max(...items.map(i => i.price)).toLocaleString() },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/40 bg-gradient-to-br from-primary to-[oklch(0.68_0.22_255)] px-4 py-3 shadow-lg shadow-primary/25"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/60">{stat.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-primary-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-6 rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-xl border border-border/60 bg-card/60 py-2.5 pl-10 pr-10 text-sm outline-none backdrop-blur-xl transition-all duration-200 placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/15"
              aria-label="Search menu items"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/50 transition-colors hover:text-foreground hover:bg-muted/50"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Category filter">
            {["All", ...categories].map((cat) => {
              const cfg = cat !== "All" ? categoryConfig[cat] : null;
              const Icon = cfg?.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  role="tab"
                  aria-selected={category === cat}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200",
                    category === cat
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {cat}
                  {cfg && categoryCounts[cat] > 0 && (
                    <span className="ml-0.5 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">{categoryCounts[cat]}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item, idx) => {
          const cfg = categoryConfig[item.category];
          const Icon = cfg.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card/70 backdrop-blur-sm shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                cfg.border,
              )}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={cn("absolute inset-x-0 top-0 h-1 transition-all duration-500 group-hover:h-1.5", cfg.bar)} />
              <div className={cn("pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100", cfg.iconBg)} />

              <div className="relative px-5 pt-5">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-border/40", cfg.iconBg)}>
                    <Icon className={cn("h-6 w-6", cfg.iconColor)} />
                  </div>
                  <div className="flex gap-1 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted/40 hover:text-foreground"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-display text-base font-semibold leading-tight text-foreground">{item.name}</h3>
                  <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium", cfg.badge)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="relative mt-5 flex items-baseline gap-1.5 border-t border-border/40 px-5 py-4">
                <span className="text-[10px] font-medium text-muted-foreground/60">{item.currency}</span>
                <span className="text-2xl font-bold tabular-nums tracking-tight">{item.price.toLocaleString()}</span>
              </div>

              {confirmDelete === item.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card/90 backdrop-blur-sm">
                  <div className="p-5 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <p className="mb-1 text-sm font-semibold">Delete &ldquo;{item.name}&rdquo;?</p>
                    <p className="mb-4 text-[11px] text-muted-foreground/60">This action cannot be undone.</p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="rounded-xl bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground transition-all hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/30"
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
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 py-20 text-center backdrop-blur-sm">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-border/60">
              <Search className="h-7 w-7 text-muted-foreground/30" />
            </span>
            <h3 className="text-lg font-semibold text-muted-foreground/80">No menu items found</h3>
            <p className="mt-1 text-sm text-muted-foreground/50 max-w-xs">
              {search ? "No items match your search." : "Get started by adding your first menu item."}
            </p>
            {search ? (
              <button onClick={() => setSearch("")} className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <X className="h-3.5 w-3.5" /> Clear search
              </button>
            ) : (
              <button onClick={openNew} className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            )}
          </div>
        )}

        <button
          onClick={openNew}
          className="flex min-h-[220px] items-center justify-center rounded-2xl border-2 border-dashed border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-lg"
        >
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">Add Item</p>
            <p className="mt-0.5 text-xs text-muted-foreground/40">Create a new menu item</p>
          </div>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-2xl border border-border/50 bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={editingId ? "Edit menu item" : "Add menu item"}
            >
              <div className="relative overflow-hidden rounded-t-2xl border-b border-border/40 px-6 pb-4 pt-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary" />
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-primary/[0.05] to-transparent blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold">{editingId ? "Edit Item" : "Add Menu Item"}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">{editingId ? "Update item details below." : "Fill in the details for the new item."}</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted/30 hover:text-foreground"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Item Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Grilled Chicken"
                    className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/15"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Category</label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/15 shadow-none">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Price</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Currency</label>
                    <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                      <SelectTrigger className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/15 shadow-none">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/40 px-6 py-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-border/60 bg-card/60 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={!form.name.trim() || !form.price}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {editingId ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
