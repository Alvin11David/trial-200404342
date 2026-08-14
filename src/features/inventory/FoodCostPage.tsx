import { useState } from "react";
import { useStore, foodCostReport } from "@/lib/pms-store";
import { DollarSign, Coins, Percent, TrendingUp } from "lucide-react";

const fmt = (n: number) => "UGX " + Math.round(n).toLocaleString();

export default function FoodCostPage() {
  const posOutlets = useStore((s) => s.posOutlets);
  useStore((s) => s.menuItemSales);
  useStore((s) => s.menuItemRecipes);
  const [outletFilter, setOutletFilter] = useState("all");

  const report = foodCostReport({ posOutletId: outletFilter === "all" ? undefined : outletFilter });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Food Cost</h1>
          <p className="text-sm text-muted-foreground">
            Theoretical cost of goods sold vs POS revenue — driven by recipe / BOM ingredient consumption from the Kitchen Store
          </p>
        </div>
        <select
          value={outletFilter}
          onChange={(e) => setOutletFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
        >
          <option value="all">All outlets</option>
          {posOutlets.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sales Revenue</p>
              <p className="text-xl font-bold">{fmt(report.revenue)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Coins size={20} className="text-destructive" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ingredient COGS</p>
              <p className="text-xl font-bold">{fmt(report.cogs)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Percent size={20} className="text-warning" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Food Cost %</p>
              <p className="text-xl font-bold">{report.foodCostPct.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-success" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gross Profit</p>
              <p className="text-xl font-bold">{fmt(report.grossProfit)}</p>
              <p className="text-xs text-muted-foreground">{report.grossMarginPct.toFixed(1)}% margin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 overflow-hidden rounded-lg border border-border bg-card shadow">
          <div className="border-b border-border/40 px-4 py-3">
            <h2 className="text-sm font-bold">By Dish</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2.5">Dish</th>
                <th className="px-4 py-2.5 text-right">Sold</th>
                <th className="px-4 py-2.5 text-right">Revenue</th>
                <th className="px-4 py-2.5 text-right">COGS</th>
                <th className="px-4 py-2.5 text-right">Cost %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {report.byItem.map((d) => (
                <tr key={d.menuItemId}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">Recipe cost {fmt(d.recipeCost)} / dish</p>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{d.quantity}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(d.revenue)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(d.cogs)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{d.foodCostPct.toFixed(1)}%</td>
                </tr>
              ))}
              {report.byItem.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground/70">
                    No recipe-based sales yet. Define recipes under POS Settings → Products, then settle a tab at the POS.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <div className="border-b border-border/40 px-4 py-3">
            <h2 className="text-sm font-bold">By Outlet</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2.5">Outlet</th>
                <th className="px-4 py-2.5 text-right">Revenue</th>
                <th className="px-4 py-2.5 text-right">Food Cost %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {report.byOutlet.map((o) => (
                <tr key={o.posOutletId}>
                  <td className="px-4 py-2.5 font-medium">{o.outletName}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(o.revenue)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{o.foodCostPct.toFixed(1)}%</td>
                </tr>
              ))}
              {report.byOutlet.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground/70">
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
