import { Link } from "react-router-dom";
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
  EyeOff,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useStore,
  upsertMenuItem,
  deleteMenuItem,
  type MenuItem as StoreMenuItem,
  type VatTreatment,
} from "@/lib/pms-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const unsplashImg = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&h=400&q=80`;

const categoryImages: Record<string, string> = {
  starters: unsplashImg("1546069901-ba9599a7e63c"),
  mains: unsplashImg("1559847844-5315695dadae"),
  beverages: unsplashImg("1554866585-cd94860890b7"),
  cocktails: unsplashImg("1569529465841-dfecdab7503b"),
  snacks: unsplashImg("1567620832903-9fc6debc209f"),
};

const fallbackImage = unsplashImg("1546069901-ba9599a7e63c");

const categoryIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; dot: string; from: string; to: string }> = {};

const taxLabels: Record<VatTreatment, string> = {
  inclusive: "VAT Inclusive",
  exclusive: "VAT Exclusive",
  exempt: "VAT Exempt",
  not_applicable: "N/A",
};

const taxColors: Record<VatTreatment, string> = {
  inclusive: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  exclusive: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  exempt: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  not_applicable: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

interface FormData {
  name: string;
  menuCategoryId: string;
  posOutletId: string;
  unitPrice: string;
  vatTreatment: VatTreatment;
  description: string;
}

const emptyForm: FormData = {
  name: "",
  menuCategoryId: "",
  posOutletId: "",
  unitPrice: "",
  vatTreatment: "inclusive",
  description: "",
};

function POSMenuPage() {
  const storeItems = useStore((s) => s.menuItems);
  const storeCategories = useStore((s) => s.menuCategories);
  const storeOutlets = useStore((s) => s.posOutlets);
  const storeModifiers = useStore((s) => s.menuModifiers);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const activeCategories = storeCategories.filter((c) => c.isActive);

  const filtered = useMemo(
    () => storeItems.filter(
      (m) => (category === "All" || m.menuCategoryId === category) && (!search || m.name.toLowerCase().includes(search.toLowerCase())),
    ),
    [storeItems, category, search],
  );

  const outletName = (id: string) => storeOutlets.find((o) => o.id === id)?.name ?? id;
  const categoryName = (id: string) => storeCategories.find((c) => c.id === id)?.name ?? id;
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    storeItems.forEach((item) => { counts[item.menuCategoryId] = (counts[item.menuCategoryId] || 0) + 1; });
    return counts;
  }, [storeItems]);

  function openNew() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      posOutletId: storeOutlets[0]?.id ?? "",
      menuCategoryId: activeCategories[0]?.id ?? "",
    });
    setShowModal(true);
  }

  function openEdit(item: StoreMenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      menuCategoryId: item.menuCategoryId,
      posOutletId: item.posOutletId,
      unitPrice: String(item.unitPrice),
      vatTreatment: item.vatTreatment,
      description: item.description ?? "",
    });
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim() || !form.unitPrice || !form.menuCategoryId) return;
    const price = parseInt(form.unitPrice.replace(/,/g, ""), 10);
    if (isNaN(price) || price <= 0) return;
    upsertMenuItem({
      id: editingId ?? `MI${Date.now()}`,
      posOutletId: form.posOutletId,
      menuCategoryId: form.menuCategoryId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      unitPrice: price,
      vatTreatment: form.vatTreatment,
      isActive: true,
    });
    toast.success(editingId ? "Item updated" : "Item created");
    setShowModal(false);
  }

  function remove(id: string) {
    deleteMenuItem(id);
    setConfirmDelete(null);
    toast.success("Item deleted");
  }

  function toggleActive(item: StoreMenuItem) {
    upsertMenuItem({ ...item, isActive: !item.isActive });
    toast.success(item.isActive ? "Item marked out of stock" : "Item back in stock");
  }

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
          <Link
            to="/settings/pos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:text-foreground hover:bg-card/80"
          >
            <Settings className="h-3.5 w-3.5" />
            Config
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
          { label: "Total Items", value: String(storeItems.length) },
          { label: "Active", value: String(storeItems.filter((i) => i.isActive).length) },
          { label: "Categories", value: String(activeCategories.length) },
          { label: "Out of Stock", value: String(storeItems.filter((i) => !i.isActive).length) },
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
            <button
              key="all"
              onClick={() => setCategory("All")}
              role="tab"
              aria-selected={category === "All"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200",
                category === "All"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
              )}
            >
              All
              <span className="ml-0.5 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">{storeItems.length}</span>
            </button>
            {activeCategories.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  role="tab"
                  aria-selected={category === cat.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200",
                    category === cat.id
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  )}
                >
                  {cat.name}
                  {count > 0 && (
                    <span className="ml-0.5 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item, idx) => (
          <div
            key={item.id}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
              item.isActive ? "border-border/50" : "border-dashed border-muted-foreground/30 opacity-70",
            )}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Top accent bar */}
            <div className={cn(
              "absolute inset-x-0 top-0 h-1 transition-all duration-500 group-hover:h-1.5 z-10",
              item.isActive ? "bg-primary" : "bg-muted-foreground/30",
            )} />

            {/* OOS badge */}
            {!item.isActive && (
              <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                <EyeOff className="h-3 w-3" />
                Out of Stock
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute right-3 top-3 z-20 flex gap-1 opacity-0 -translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              <button
                onClick={() => toggleActive(item)}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl backdrop-blur-sm border shadow-sm transition-all",
                  item.isActive
                    ? "bg-card/80 border-border/40 text-muted-foreground/70 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 dark:hover:bg-amber-950/30"
                    : "bg-emerald-500/20 border-emerald-400/40 text-emerald-600 hover:bg-emerald-500/30",
                )}
                title={item.isActive ? "Mark out of stock" : "Mark in stock"}
              >
                {item.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => openEdit(item)}
                className="grid h-8 w-8 place-items-center rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-sm text-muted-foreground/70 transition-all hover:bg-card hover:text-foreground hover:border-border/60"
                aria-label={`Edit ${item.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setConfirmDelete(item.id)}
                className="grid h-8 w-8 place-items-center rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-sm text-muted-foreground/70 transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Art zone */}
            <div className="px-4 pt-4">
              <div className="relative h-44 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-muted/30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent opacity-50 blur-2xl" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06]" />
                <div className="relative flex h-full items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.68_0.22_255)] shadow-lg">
                    <span className="text-2xl font-bold text-white">{item.name.charAt(0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info zone */}
            <div className="px-4 mt-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-bold leading-snug text-foreground">{item.name}</h3>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", taxColors[item.vatTreatment])}>
                  {taxLabels[item.vatTreatment]}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-1">{item.description}</p>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                <span className="text-xs text-muted-foreground/70">{categoryName(item.menuCategoryId)}</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground/70">{outletName(item.posOutletId)}</span>
              </div>
            </div>

            {/* Price bar */}
            <div className="mt-3.5 mx-4 mb-4 flex items-baseline gap-1.5 rounded-xl bg-muted/30 px-4 py-3.5 border border-border/40">
              <span className="text-[11px] font-medium text-muted-foreground/50">UGX</span>
              <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{item.unitPrice.toLocaleString()}</span>
            </div>

            {/* Delete overlay */}
            {confirmDelete === item.id && (
              <div className="absolute inset-0 z-30 flex items-end rounded-2xl bg-gradient-to-t from-card/95 via-card/80 to-card/60 backdrop-blur-sm">
                <div className="w-full p-5 animate-slide-up-fade">
                  <div className="text-center mb-5">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
                      <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                    <p className="text-base font-bold">Delete &ldquo;{item.name}&rdquo;?</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">This action cannot be undone.</p>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 rounded-xl border border-border/50 bg-card/80 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-card hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="flex-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:bg-destructive/90 hover:shadow-xl hover:shadow-destructive/30"
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
          className="flex min-h-[240px] items-center justify-center rounded-2xl border-2 border-dashed border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-lg"
        >
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Plus className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">Add Item</p>
            <p className="mt-0.5 text-xs text-muted-foreground/40">Create a new menu item</p>
          </div>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={editingId ? "Edit menu item" : "Add menu item"}
            >
              <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-2xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-amber-500 to-primary" />

                <div className="grid gap-0 md:grid-cols-5">
                  <div className="md:col-span-3 p-7 md:pr-4">
                    <div className="flex items-start justify-between mb-7">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                            {editingId ? "Edit Item" : "New Item"}
                          </span>
                        </div>
                        <h3 className="font-display text-xl font-bold">{editingId ? "Edit Menu Item" : "Add Menu Item"}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground/50">{editingId ? "Update item details below." : "Fill in the details for the new item."}</p>
                      </div>
                      <button
                        onClick={() => setShowModal(false)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/50 bg-card/50 text-muted-foreground/50 shadow-sm transition-all hover:border-destructive/30 hover:text-destructive hover:bg-destructive/5 active:scale-90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Item Name</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g. Grilled Chicken"
                          className="w-full rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-sm outline-none focus:border-primary/50 focus:bg-background/60 focus:ring-2 focus:ring-primary/15"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Description</label>
                        <input
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          placeholder="Optional description..."
                          className="w-full rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-sm outline-none focus:border-primary/50 focus:bg-background/60 focus:ring-2 focus:ring-primary/15"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Outlet</label>
                          <Select value={form.posOutletId} onValueChange={(v) => setForm({ ...form, posOutletId: v })}>
                            <SelectTrigger className="w-full rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-sm shadow-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15">
                              <SelectValue placeholder="Select outlet" />
                            </SelectTrigger>
                            <SelectContent>
                              {storeOutlets.filter((o) => o.isActive).map((o) => (
                                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Category</label>
                          <Select value={form.menuCategoryId} onValueChange={(v) => setForm({ ...form, menuCategoryId: v })}>
                            <SelectTrigger className="w-full rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-sm shadow-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15">
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

                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3">
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Price (UGX)</label>
                          <input
                            type="number"
                            value={form.unitPrice}
                            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                            placeholder="0"
                            min="0"
                            className="w-full rounded-2xl border border-border/50 bg-background/40 py-3 px-4 text-sm font-semibold tabular-nums outline-none focus:border-primary/50 focus:bg-background/60 focus:ring-2 focus:ring-primary/15"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Tax Class</label>
                          <Select value={form.vatTreatment} onValueChange={(v) => setForm({ ...form, vatTreatment: v as VatTreatment })}>
                            <SelectTrigger className="w-full rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-sm shadow-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15">
                              <SelectValue placeholder="Tax class" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(taxLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-border/30 pt-5">
                      <button
                        onClick={() => setShowModal(false)}
                        className="rounded-xl border border-border/50 bg-card/60 px-5 py-2.5 text-sm font-medium text-muted-foreground/70 shadow-sm hover:border-border/80 hover:text-foreground active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={save}
                        disabled={!form.name.trim() || !form.unitPrice || !form.menuCategoryId}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        {editingId ? "Save Changes" : "Add Item"}
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="hidden md:block md:col-span-2 border-l border-border/30 bg-gradient-to-br from-muted/20 via-card to-muted/10 p-7">
                    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
                      <div className="absolute inset-x-0 top-0 h-1 z-10 bg-primary" />
                      <div className="px-4 pt-4">
                        <div className="relative h-32 overflow-hidden rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/10 via-card to-muted/30">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent opacity-60 blur-2xl" />
                          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06]" />
                          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.68_0.22_255)] shadow-lg">
                            <span className="text-xl font-bold text-white">{(form.name || "?").charAt(0)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 mt-3">
                        <h4 className="font-display text-base font-bold leading-snug text-foreground">{form.name || "Item Name"}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                          <span className="text-xs text-muted-foreground/70">{categoryName(form.menuCategoryId) || "Category"}</span>
                        </div>
                      </div>
                      <div className="mt-2.5 mx-4 mb-4 flex items-baseline gap-1.5 rounded-xl bg-muted/30 px-4 py-3 border border-border/40">
                        <span className="text-[11px] font-medium text-muted-foreground/50">UGX</span>
                        <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
                          {parseInt(form.unitPrice) > 0 ? parseInt(form.unitPrice).toLocaleString() : "—"}
                        </span>
                      </div>
                      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-600 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {editingId ? "Editing" : "New"}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 rounded-xl border border-border/30 bg-card/40 px-4 py-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground/50">Tax</span>
                        <span className="font-medium text-foreground/70">{taxLabels[form.vatTreatment]}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground/50">Outlet</span>
                        <span className="font-medium text-foreground/70">{outletName(form.posOutletId) || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default POSMenuPage;
