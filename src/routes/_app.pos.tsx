import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  BedDouble,
  ScrollText,
  ClipboardList,
  UtensilsCrossed,
  ChevronDown,
  X,
  TicketCheck,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/pos")({
  component: POSLayout,
});

function POSLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/pos") return <Outlet />;
  return <POSPage />;
}

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type CartEntry = {
  item: MenuItem;
  qty: number;
};

type PaymentMethod = "Cash" | "Card" | "Room Charge" | "Credit";

const categories = ["Soft Drinks", "Spirits", "Food", "Snacks"];

const menuItems: MenuItem[] = [
  { id: "sd1", name: "Coca Cola", price: 5_000, category: "Soft Drinks" },
  { id: "sd2", name: "Fanta Orange", price: 5_000, category: "Soft Drinks" },
  { id: "sd3", name: "Sprite", price: 5_000, category: "Soft Drinks" },
  { id: "sd4", name: "Mineral Water", price: 3_000, category: "Soft Drinks" },
  { id: "sd5", name: "Fresh Orange Juice", price: 8_000, category: "Soft Drinks" },
  { id: "sd6", name: "Mango Smoothie", price: 10_000, category: "Soft Drinks" },
  { id: "sp1", name: "Johnnie Walker Red", price: 35_000, category: "Spirits" },
  { id: "sp2", name: "Jameson Irish", price: 30_000, category: "Spirits" },
  { id: "sp3", name: "Smirnoff Vodka", price: 25_000, category: "Spirits" },
  { id: "sp4", name: "Beefeater Gin", price: 28_000, category: "Spirits" },
  { id: "sp5", name: "Captain Morgan Rum", price: 26_000, category: "Spirits" },
  { id: "sp6", name: "Local Waragi", price: 15_000, category: "Spirits" },
  { id: "fd1", name: "Grilled Chicken", price: 25_000, category: "Food" },
  { id: "fd2", name: "Beef Steak", price: 35_000, category: "Food" },
  { id: "fd3", name: "Fish & Chips", price: 22_000, category: "Food" },
  { id: "fd4", name: "Chicken Burger", price: 18_000, category: "Food" },
  { id: "fd5", name: "Vegetable Curry", price: 20_000, category: "Food" },
  { id: "fd6", name: "Pasta Bolognese", price: 22_000, category: "Food" },
  { id: "sn1", name: "French Fries", price: 8_000, category: "Snacks" },
  { id: "sn2", name: "Onion Rings", price: 7_000, category: "Snacks" },
  { id: "sn3", name: "Chicken Wings", price: 15_000, category: "Snacks" },
  { id: "sn4", name: "Samosas (4 pcs)", price: 6_000, category: "Snacks" },
  { id: "sn5", name: "Spring Rolls", price: 8_000, category: "Snacks" },
  { id: "sn6", name: "Nachos", price: 12_000, category: "Snacks" },
];

const tables = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "Bar", "Takeaway"];
const paymentMethods: PaymentMethod[] = ["Cash", "Card", "Room Charge", "Credit"];

const TAX_RATE = 0.18;

function POSPage() {
  const [category, setCategory] = useState(categories[0]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [table, setTable] = useState("T1");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [search, setSearch] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);

  const filtered = useMemo(
    () =>
      menuItems.filter(
        (m) =>
          m.category === category &&
          (!search || m.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [category, search],
  );

  const subtotal = useMemo(() => cart.reduce((sum, e) => sum + e.item.price * e.qty, 0), [cart]);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  function addItem(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((e) => e.item.id === item.id);
      if (existing) {
        return prev.map((e) => (e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e));
      }
      return [...prev, { item, qty: 1 }];
    });
  }

  function updateQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((e) => (e.item.id === itemId ? { ...e, qty: Math.max(0, e.qty + delta) } : e))
        .filter((e) => e.qty > 0),
    );
  }

  function removeItem(itemId: string) {
    setCart((prev) => prev.filter((e) => e.item.id !== itemId));
  }

  function clearCart() {
    setCart([]);
  }

  function handleCharge() {
    setShowReceipt(true);
  }

  const itemCount = cart.reduce((s, e) => s + e.qty, 0);

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -mt-8 overflow-hidden">
      {/* Left: Menu Items */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar: table selector, search, sub-nav */}
        <div className="flex items-center gap-3 border-b border-border/60 bg-card/40 px-6 py-3 backdrop-blur">
          <div className="relative">
            <button
              onClick={() => setShowTablePicker((p) => !p)}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-4 py-2 text-sm font-medium hover:border-primary/50"
            >
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              {table}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {showTablePicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTablePicker(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl">
                  {tables.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTable(t);
                        setShowTablePicker(false);
                      }}
                      className={cn(
                        "flex w-full items-center rounded-lg px-3 py-2 text-sm transition",
                        t === table
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-popover-foreground/80 hover:bg-accent",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60"
            />
          </div>

          <div className="flex items-center gap-1">
            <Link
              to="/pos/orders"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Orders
            </Link>
            <Link
              to="/pos/menu"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Menu
            </Link>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 border-b border-border/40 bg-card/20 px-6 py-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                category === cat
                  ? "bg-primary/15 text-primary shadow-inner"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20"
              >
                <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-primary/20 to-success/20 mb-3 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gradient-primary">
                    UGX {item.price.toLocaleString()}
                  </span>
                </div>
                <div className="font-medium text-sm truncate">{item.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{item.category}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold">UGX {item.price.toLocaleString()}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center text-sm text-muted-foreground">
                No items found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex w-[380px] shrink-0 flex-col border-l border-border/60 bg-card/30 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Current Order</h2>
            <p className="text-xs text-muted-foreground">
              {table} · {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="rounded-lg border border-border/60 bg-card/40 p-1.5 text-muted-foreground hover:border-destructive/50 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Order is empty</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tap items on the left to add</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {cart.map((entry) => (
                <li
                  key={entry.item.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 p-3 transition hover:border-primary/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{entry.item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      UGX {entry.item.price.toLocaleString()} each
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(entry.item.id, -1)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-[24px] text-center text-sm font-semibold tabular-nums">
                      {entry.qty}
                    </span>
                    <button
                      onClick={() => updateQty(entry.item.id, 1)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="min-w-[72px] text-right text-sm font-semibold tabular-nums">
                    UGX {(entry.item.price * entry.qty).toLocaleString()}
                  </div>
                  <button
                    onClick={() => removeItem(entry.item.id)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground/50 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-border/60 px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">UGX {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (18%)</span>
            <span className="tabular-nums">UGX {tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-border/40 pt-2">
            <span className="text-base font-semibold">Total</span>
            <span className="text-xl font-bold text-gradient-primary tabular-nums">
              UGX {total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment & Actions */}
        <div className="border-t border-border/60 px-5 py-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {paymentMethods.map((pm) => (
              <button
                key={pm}
                onClick={() => setPaymentMethod(pm)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition",
                  paymentMethod === pm
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {pm === "Cash" && <Banknote className="h-3.5 w-3.5" />}
                {pm === "Card" && <CreditCard className="h-3.5 w-3.5" />}
                {pm === "Room Charge" && <BedDouble className="h-3.5 w-3.5" />}
                {pm === "Credit" && <ScrollText className="h-3.5 w-3.5" />}
                {pm}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCharge}
              disabled={cart.length === 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paymentMethod === "Cash" ? "Charge" : `Charge ${paymentMethod}`}
            </button>
            <button
              disabled={cart.length === 0}
              className="rounded-xl border border-border/60 bg-card/40 p-3 text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card p-8 shadow-2xl">
            <div className="text-center">
              <TicketCheck className="mx-auto h-10 w-10 text-success" />
              <h3 className="mt-3 font-display text-xl font-bold">Payment Complete</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {paymentMethod} · {table}
              </p>
            </div>

            <div className="my-6 space-y-2 text-sm">
              {cart.map((entry) => (
                <div key={entry.item.id} className="flex justify-between">
                  <span>
                    {entry.item.name} × {entry.qty}
                  </span>
                  <span className="tabular-nums">
                    UGX {(entry.item.price * entry.qty).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t border-border/40 pt-2 mt-4" />
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>UGX {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (18%)</span>
                <span>UGX {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-1">
                <span>Total</span>
                <span className="text-gradient-primary">UGX {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReceipt(false);
                  clearCart();
                }}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
              >
                New Order
              </button>
              <button className="rounded-xl border border-border/60 bg-card/40 p-3 text-muted-foreground hover:text-foreground">
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
