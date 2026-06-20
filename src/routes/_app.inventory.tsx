import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Package,
  Warehouse,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({ meta: [{ title: "Stock Dashboard — Jambo ERP" }] }),
  component: InventoryLayout,
});

function InventoryLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/inventory") return <Outlet />;
  return <StockDashboard />;
}

type StockItem = {
  name: string;
  category: string;
  quantity: number;
  reorderQty: number;
  unitCost: number;
  uom: string;
};

const stockItems: StockItem[] = [
  {
    name: "Coca Cola (Can)",
    category: "Soft Drinks",
    quantity: 240,
    reorderQty: 50,
    unitCost: 2_500,
    uom: "pcs",
  },
  {
    name: "Mineral Water 500ml",
    category: "Soft Drinks",
    quantity: 480,
    reorderQty: 100,
    unitCost: 1_200,
    uom: "pcs",
  },
  {
    name: "Fresh Orange Juice",
    category: "Soft Drinks",
    quantity: 18,
    reorderQty: 30,
    unitCost: 4_000,
    uom: "liters",
  },
  {
    name: "Johnnie Walker Red",
    category: "Spirits",
    quantity: 24,
    reorderQty: 12,
    unitCost: 22_000,
    uom: "btls",
  },
  {
    name: "Smirnoff Vodka",
    category: "Spirits",
    quantity: 8,
    reorderQty: 15,
    unitCost: 16_000,
    uom: "btls",
  },
  {
    name: "Beefeater Gin",
    category: "Spirits",
    quantity: 15,
    reorderQty: 10,
    unitCost: 18_000,
    uom: "btls",
  },
  {
    name: "Grilled Chicken (prep)",
    category: "Food",
    quantity: 5,
    reorderQty: 20,
    unitCost: 12_000,
    uom: "kg",
  },
  {
    name: "Beef (prep)",
    category: "Food",
    quantity: 22,
    reorderQty: 15,
    unitCost: 15_000,
    uom: "kg",
  },
  {
    name: "Fish (prep)",
    category: "Food",
    quantity: 3,
    reorderQty: 10,
    unitCost: 14_000,
    uom: "kg",
  },
  { name: "Potatoes", category: "Food", quantity: 60, reorderQty: 40, unitCost: 3_000, uom: "kg" },
  {
    name: "Cooking Oil",
    category: "Food",
    quantity: 25,
    reorderQty: 20,
    unitCost: 8_000,
    uom: "liters",
  },
  {
    name: "Toilet Paper (roll)",
    category: "Supplies",
    quantity: 200,
    reorderQty: 100,
    unitCost: 1_500,
    uom: "pcs",
  },
  {
    name: "Soap (liquid)",
    category: "Supplies",
    quantity: 15,
    reorderQty: 20,
    unitCost: 6_000,
    uom: "liters",
  },
  {
    name: "Light Bulbs",
    category: "Supplies",
    quantity: 8,
    reorderQty: 25,
    unitCost: 4_500,
    uom: "pcs",
  },
  {
    name: "Towel (white)",
    category: "Linen",
    quantity: 120,
    reorderQty: 50,
    unitCost: 18_000,
    uom: "pcs",
  },
  {
    name: "Bedsheet (king)",
    category: "Linen",
    quantity: 45,
    reorderQty: 30,
    unitCost: 35_000,
    uom: "pcs",
  },
];

const recentMovements = [
  {
    date: "Jun 10",
    item: "Coca Cola (Can)",
    type: "Received",
    qty: 120,
    ref: "PO-0421",
    user: "Amani Kato",
  },
  {
    date: "Jun 10",
    item: "Beef (prep)",
    type: "Issued",
    qty: 8,
    ref: "REQ-0310",
    user: "Chef David",
  },
  {
    date: "Jun 09",
    item: "Toilet Paper",
    type: "Received",
    qty: 200,
    ref: "PO-0420",
    user: "Amani Kato",
  },
  {
    date: "Jun 09",
    item: "Cooking Oil",
    type: "Issued",
    qty: 5,
    ref: "REQ-0309",
    user: "Chef David",
  },
  {
    date: "Jun 08",
    item: "Towel (white)",
    type: "Received",
    qty: 50,
    ref: "PO-0419",
    user: "Grace Achieng",
  },
  {
    date: "Jun 08",
    item: "Light Bulbs",
    type: "Issued",
    qty: 4,
    ref: "REQ-0308",
    user: "Maintenance",
  },
  {
    date: "Jun 07",
    item: "Potatoes",
    type: "Received",
    qty: 40,
    ref: "PO-0418",
    user: "Amani Kato",
  },
  {
    date: "Jun 07",
    item: "Soap (liquid)",
    type: "Issued",
    qty: 3,
    ref: "REQ-0307",
    user: "Housekeeping",
  },
];

const categoryColors: Record<string, string> = {
  "Soft Drinks": "oklch(0.74 0.21 71)",
  Spirits: "oklch(0.72 0.16 162)",
  Food: "oklch(0.78 0.16 75)",
  Supplies: "oklch(0.65 0.2 295)",
  Linen: "oklch(0.7 0.15 240)",
};

function StockDashboard() {
  const totalValue = useMemo(() => stockItems.reduce((s, i) => s + i.quantity * i.unitCost, 0), []);

  const lowStock = useMemo(() => stockItems.filter((i) => i.quantity <= i.reorderQty), []);

  const critical = lowStock.filter((i) => i.quantity <= i.reorderQty * 0.5);
  const amber = lowStock.filter((i) => i.quantity > i.reorderQty * 0.5);

  const categoryValue = useMemo(() => {
    const map: Record<string, number> = {};
    stockItems.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + i.quantity * i.unitCost;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  const totalCatValue = categoryValue.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Stock Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inventory overview, alerts and recent movements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/inventory/list"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Warehouse className="h-4 w-4" />
            Inventory List
          </Link>
          <Link
            to="/inventory/purchase-orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <FileText className="h-4 w-4" />
            Purchase Orders
          </Link>
          <Link
            to="/inventory/requisitions"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <ClipboardCheck className="h-4 w-4" />
            Requisitions
          </Link>
        </div>
      </div>

      {/* Top cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass card-hover relative overflow-hidden rounded-2xl p-5">
          <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: "var(--color-primary)", boxShadow: "0 0 10px var(--color-primary)" }} />
          <div className="pl-1">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Stock Value
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-success/30">
                <Package className="h-4 w-4 text-primary" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tabular-nums">
              UGX {totalValue.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="h-3 w-3" />
              <span>+3.2% from last month</span>
            </div>
          </div>
        </div>

        <div className="glass card-hover relative overflow-hidden rounded-2xl p-5">
          <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: "var(--color-info)", boxShadow: "0 0 10px var(--color-info)" }} />
          <div className="pl-1">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Items
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-info/30 to-info/20">
                <Warehouse className="h-4 w-4 text-info" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold">{stockItems.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Across {Object.keys(categoryColors).length} categories
            </div>
          </div>
        </div>

        <div className="glass card-hover relative overflow-hidden rounded-2xl p-5">
          <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: "var(--color-warning)", boxShadow: "0 0 10px var(--color-warning)" }} />
          <div className="pl-1">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Low Stock Alerts
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-warning/30 to-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-warning">{lowStock.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {critical.length} critical · {amber.length} low
            </div>
          </div>
        </div>

        <div className="glass card-hover relative overflow-hidden rounded-2xl p-5">
          <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: "var(--color-success)", boxShadow: "0 0 10px var(--color-success)" }} />
          <div className="pl-1">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Categories
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-success/30 to-success/20">
                <TrendingUp className="h-4 w-4 text-success" />
              </span>
            </div>
            <div className="mt-3 space-y-1">
              {categoryValue.slice(0, 3).map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{cat}</span>
                  <span className="font-medium tabular-nums">
                    UGX {(val / 1_000_000).toFixed(1)}M
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Low stock alerts + Category donut */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="glass card-hover rounded-2xl p-6 lg:col-span-3">
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Low Stock Alerts
          </h3>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">All items are well stocked.</p>
          ) : (
            <ul className="space-y-2">
              <li className="flex items-center gap-3 rounded-xl bg-card/30 px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                <span className="flex-1">Item</span>
                <span className="w-16 text-right">Qty</span>
                <span className="w-16 text-right">Reorder</span>
                <span className="w-20 text-right">Value</span>
              </li>
              {lowStock.map((item) => {
                const isCritical = item.quantity <= item.reorderQty * 0.5;
                return (
                  <li
                    key={item.name}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 transition hover:bg-card/40",
                      isCritical
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-warning/30 bg-warning/5",
                    )}
                  >
                    <span className="flex-1 text-sm font-medium">{item.name}</span>
                    <span
                      className={cn(
                        "w-16 text-right text-sm font-bold tabular-nums",
                        isCritical ? "text-destructive" : "text-warning",
                      )}
                    >
                      {item.quantity}
                    </span>
                    <span className="w-16 text-right text-sm text-muted-foreground tabular-nums">
                      {item.reorderQty}
                    </span>
                    <span className="w-20 text-right text-sm tabular-nums">
                      UGX {(item.quantity * item.unitCost).toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Category breakdown */}
        <div className="glass card-hover rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="flex items-center justify-center">
            <DonutChart data={categoryValue} total={totalCatValue} colors={categoryColors} />
          </div>
          <div className="mt-5 space-y-2">
            {categoryValue.map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: categoryColors[cat] || "oklch(0.7 0.15 240)" }}
                  />
                  {cat}
                </span>
                <span className="tabular-nums font-medium">
                  {((val / totalCatValue) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent movements */}
      <div className="glass card-hover rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Recent Stock Movements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Item</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Qty</th>
                <th className="px-3 py-3 font-medium">Reference</th>
                <th className="px-3 py-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.map((m, i) => (
                <tr key={i} className="border-b border-border/30 transition hover:bg-card/40">
                  <td className="px-3 py-3 text-muted-foreground">{m.date}</td>
                  <td className="px-3 py-3 font-medium">{m.item}</td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        m.type === "Received"
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-info/30 bg-info/10 text-info",
                      )}
                    >
                      {m.type === "Received" ? (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      )}
                      {m.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{m.qty}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{m.ref}</td>
                  <td className="px-3 py-3 text-muted-foreground">{m.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DonutChart({
  data,
  total,
  colors,
}: {
  data: [string, number][];
  total: number;
  colors: Record<string, string>;
}) {
  const chartConfig = {
    inventory: { label: "Inventory" },
  } satisfies ChartConfig;

  const chartData = data.map(([cat, val]) => ({
    name: cat,
    value: val,
    fill: colors[cat] || "oklch(0.7 0.15 240)",
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          strokeWidth={0}
          cornerRadius={4}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  );
}
