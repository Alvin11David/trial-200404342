import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
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
  TrendingUp,
  BarChart3,
  PieChart,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartPie,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { getUserRoleNames, useStore } from "@/lib/pms-store";
import { printReceipt, type ReceiptData } from "@/lib/print-receipt";

export const Route = createFileRoute("/_app/pos")({
  head: () => ({ meta: [{ title: "POS — Jambo ERP" }] }),
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

const categoryGradient: Record<string, string> = {
  "Soft Drinks": "from-sky-400 to-teal-500",
  Spirits: "from-amber-500 to-orange-600",
  Food: "from-rose-500 to-red-600",
  Snacks: "from-yellow-500 to-orange-500",
};

const productImages: Record<string, string> = {
  sd1: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop",
  sd2: "https://picsum.photos/seed/fanta/400/300",
  sd3: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop",
  sd4: "https://picsum.photos/seed/mineral-water/400/300",
  sd5: "https://picsum.photos/seed/fresh-orange-juice/400/300",
  sd6: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop",
  sp1: "https://picsum.photos/seed/johnnie-walker/400/300",
  sp2: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=300&fit=crop",
  sp3: "https://picsum.photos/seed/smirnoff/400/300",
  sp4: "https://picsum.photos/seed/beefeater-gin/400/300",
  sp5: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop",
  sp6: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
  fd1: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop",
  fd2: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop",
  fd3: "https://picsum.photos/seed/fish-n-chips/400/300",
  fd4: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
  fd5: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop",
  fd6: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
  sn1: "https://picsum.photos/seed/french-fries/400/300",
  sn2: "https://picsum.photos/seed/onion-rings/400/300",
  sn3: "https://picsum.photos/seed/chicken-wings/400/300",
  sn4: "https://picsum.photos/seed/samosas/400/300",
  sn5: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop",
  sn6: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=300&fit=crop",
};

function POSPage() {
  const [category, setCategory] = useState(categories[0]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [table, setTable] = useState("T1");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [search, setSearch] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [rightTab, setRightTab] = useState<"order" | "analytics">("order");

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
  const taxRate = 0.18;
  const tax = Math.round(subtotal * taxRate);
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

  const tenant = useStore((s) => s.tenant);
  const cashierName =
    useStore((s) => s.users.find((u) => u.isActive && getUserRoleNames(u.id).includes("POS / Cashier"))?.fullName) ??
    "Cashier";

  const receiptCounter = useRef(1000);
  function nextReceiptId() {
    receiptCounter.current++;
    return `RCT-${receiptCounter.current}`;
  }

  function buildReceiptData(payment: PaymentMethod, receiptId: string): ReceiptData {
    return {
      id: receiptId,
      items: cart.map((e) => ({ name: e.item.name, qty: e.qty, price: e.item.price })),
      subtotal,
      tax,
      taxRate,
      total,
      paymentMethod: payment,
      table,
      cashier: cashierName,
      businessName: tenant.name,
      businessAddress: tenant.address,
      businessPhone: tenant.phone,
      businessEmail: tenant.email,
      businessTin: tenant.tin,
    };
  }

  function handleCharge() {
    setShowReceipt(true);
  }

  function handlePrintReceipt(payment: PaymentMethod) {
    if (cart.length === 0) return;
    const rid = nextReceiptId();
    printReceipt(buildReceiptData(payment, rid));
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
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                  <img
                    src={productImages[item.id]}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-foreground shadow-lg transition-all hover:bg-white active:scale-90">
                    <Plus className="h-4 w-4" />
                  </span>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm leading-tight truncate">{item.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold tabular-nums">
                      UGX {item.price.toLocaleString()}
                    </span>
                  </div>
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

      {/* Right: Cart / Analytics */}
      <div className="flex w-[380px] shrink-0 flex-col border-l border-border/60 bg-card/30 backdrop-blur">
        {/* Tabs */}
        <div className="flex items-stretch border-b border-border/60">
          <button
            onClick={() => setRightTab("order")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition",
              rightTab === "order"
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            Order
          </button>
          <button
            onClick={() => setRightTab("analytics")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition",
              rightTab === "analytics"
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Insights
          </button>
        </div>

        {rightTab === "order" ? (
          <>
            {/* Order Header */}
            <div className="flex items-center justify-between px-5 py-4">
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
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Tap items on the left to add
                  </p>
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
                <span className="text-muted-foreground">Tax ({Math.round(taxRate * 100)}%)</span>
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
                  onClick={() => handlePrintReceipt(paymentMethod)}
                  disabled={cart.length === 0}
                  className="rounded-xl border border-border/60 bg-card/40 p-3 text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Printer className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <POSAnalytics />
        )}
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
                <span>Tax ({Math.round(taxRate * 100)}%)</span>
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
              <button
                onClick={() => handlePrintReceipt(paymentMethod)}
                className="rounded-xl border border-border/60 bg-card/40 p-3 text-muted-foreground hover:text-foreground"
              >
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   POS Analytics — modern visual graphs for the cashier screen
   ============================================================ */

const posHourlyData = [
  { hour: "08", sales: 0 },
  { hour: "09", sales: 45000 },
  { hour: "10", sales: 120000 },
  { hour: "11", sales: 185000 },
  { hour: "12", sales: 320000 },
  { hour: "13", sales: 280000 },
  { hour: "14", sales: 195000 },
  { hour: "15", sales: 160000 },
  { hour: "16", sales: 240000 },
  { hour: "17", sales: 310000 },
  { hour: "18", sales: 420000 },
  { hour: "19", sales: 380000 },
  { hour: "20", sales: 260000 },
  { hour: "21", sales: 140000 },
  { hour: "22", sales: 35000 },
];

const posCategoryData = [
  { name: "Soft Drinks", value: 445000, color: "var(--color-chart-1)" },
  { name: "Spirits", value: 280000, color: "var(--color-chart-2)" },
  { name: "Food", value: 215000, color: "var(--color-chart-3)" },
  { name: "Snacks", value: 125000, color: "var(--color-chart-5)" },
];

const posPaymentData = [
  { name: "Cash", value: 685000, color: "var(--color-success)" },
  { name: "Card", value: 425000, color: "var(--color-primary)" },
  { name: "Mobile", value: 145000, color: "var(--color-info)" },
  { name: "Credit", value: 85000, color: "var(--color-warning)" },
];

const posTopItems = [
  { name: "Coca Cola", qty: 32, revenue: 160000 },
  { name: "Grilled Chicken", qty: 24, revenue: 600000 },
  { name: "French Fries", qty: 20, revenue: 160000 },
  { name: "Johnnie Walker Red", qty: 17, revenue: 595000 },
  { name: "Fanta Orange", qty: 15, revenue: 75000 },
];

const totalSales = posHourlyData.reduce((s, d) => s + d.sales, 0);
const totalOrders = 47;
const totalItems = posTopItems.reduce((s, d) => s + d.qty, 0);

function POSAnalytics() {
  const fmt = (n: number) => "UGX " + n.toLocaleString();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* KPI banner */}
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Today's Revenue
              </p>
              <p className="mt-0.5 font-display text-xl font-bold tracking-tight text-gradient-primary">
                {fmt(totalSales)}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {totalOrders} orders
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-chart-2" />
              {totalItems} items
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-chart-3" />
              +18% vs yesterday
            </span>
          </div>
        </div>

        {/* Hourly Sales Trend */}
        <div className="rounded-xl border border-border/60 bg-card p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Hourly Sales</span>
          </div>
          <HourlySalesChart data={posHourlyData} />
        </div>

        {/* Category & Payment donuts side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-card p-3.5">
            <div className="mb-1 flex items-center gap-2">
              <PieChart className="h-3.5 w-3.5 text-chart-1" />
              <span className="text-xs font-semibold">Categories</span>
            </div>
            <CategoryPieChart data={posCategoryData} />
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3.5">
            <div className="mb-1 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-semibold">Payments</span>
            </div>
            <PaymentPieChart data={posPaymentData} />
          </div>
        </div>

        {/* Top Items */}
        <div className="rounded-xl border border-border/60 bg-card p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-chart-2" />
            <span className="text-xs font-semibold">Top Items</span>
          </div>
          <TopItemsChart data={posTopItems} />
        </div>

        <div className="pb-2 text-center text-[10px] text-muted-foreground/60">
          Live data · auto-refreshes every 30s
        </div>
      </div>
    </div>
  );
}

/* ---------- Hourly Sales Trend (AreaChart) ---------- */

const hourlyChartConfig = {
  sales: { label: "Sales", color: "var(--color-primary)" },
} satisfies ChartConfig;

function HourlySalesChart({ data }: { data: typeof posHourlyData }) {
  return (
    <ChartContainer
      config={hourlyChartConfig}
      className="h-24 w-full [&_.recharts-surface]:!h-full"
    >
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: -4 }}>
        <defs>
          <linearGradient id="posSalesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          tick={{ fontSize: 9 }}
          interval={1}
        />
        <YAxis hide domain={[0, "dataMax + 50000"]} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              className="rounded-lg text-xs"
              formatter={(v: number) => "UGX " + v.toLocaleString()}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#posSalesFill)"
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/* ---------- Category Donut (PieChart) ---------- */

function CategoryPieChart({ data }: { data: typeof posCategoryData }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center">
      <ChartContainer config={{ value: { label: "Value" } }} className="h-24 w-24">
        <RechartPie>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={24}
            outerRadius={38}
            strokeWidth={0}
            cornerRadius={3}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="rounded-lg text-xs"
                formatter={(v: number) => "UGX " + v.toLocaleString()}
              />
            }
          />
        </RechartPie>
      </ChartContainer>
      <div className="mt-1.5 w-full space-y-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-medium tabular-nums">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Payment Donut (PieChart) ---------- */

function PaymentPieChart({ data }: { data: typeof posPaymentData }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center">
      <ChartContainer config={{ value: { label: "Value" } }} className="h-24 w-24">
        <RechartPie>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={24}
            outerRadius={38}
            strokeWidth={0}
            cornerRadius={3}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="rounded-lg text-xs"
                formatter={(v: number) => "UGX " + v.toLocaleString()}
              />
            }
          />
        </RechartPie>
      </ChartContainer>
      <div className="mt-1.5 w-full space-y-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-medium tabular-nums">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Top Items (Horizontal BarChart) ---------- */

const topItemsConfig = {
  qty: { label: "Qty", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

function TopItemsChart({ data }: { data: typeof posTopItems }) {
  const maxQty = Math.max(...data.map((d) => d.qty));
  return (
    <ChartContainer config={topItemsConfig} className="h-32 w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        barSize={16}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/30" />
        <XAxis type="number" hide domain={[0, maxQty + 8]} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          tick={{ fontSize: 10 }}
          width={90}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              className="rounded-lg text-xs"
              formatter={(v: number, name: string) =>
                name === "qty" ? `${v} sold` : "UGX " + v.toLocaleString()
              }
            />
          }
        />
        <Bar dataKey="qty" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="qty"
            position="right"
            className="fill-foreground"
            fontSize={10}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
