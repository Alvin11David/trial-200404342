import { Fragment, useState } from "react";
import { departmentConsumption } from "@/lib/pms-store";
import { Package, PackageCheck, ChevronDown, ChevronRight } from "lucide-react";

export default function DepartmentConsumptionPage() {
  const consumption = departmentConsumption();
  const [openId, setOpenId] = useState<string | null>(null);

  const totalQty = consumption.reduce((s, d) => s + d.totalQuantity, 0);
  const totalValue = consumption.reduce((s, d) => s + d.totalValue, 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Department Consumption</h1>
        <p className="text-sm text-muted-foreground">
          Stock issued from the store to departments via internal issue / requisitions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
          <div className="flex items-center gap-3">
            <Package className="text-teal-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Departments</p>
              <p className="text-2xl font-bold">{consumption.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <PackageCheck className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Total Qty Issued</p>
              <p className="text-2xl font-bold">{totalQty.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <Package className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-lg font-bold text-green-700">{totalValue.toLocaleString()} UGX</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Qty Issued</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3">Last Issue</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {consumption.map((d) => {
              const open = openId === d.posOutletId;
              return (
                <Fragment key={d.posOutletId}>
                  <tr
                    className="cursor-pointer border-t border-border/40 hover:bg-muted/20"
                    onClick={() => setOpenId(open ? null : d.posOutletId)}
                  >
                    <td className="px-4 py-3 font-medium">{d.outletName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.items.length}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{d.totalQuantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.totalValue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{d.lastIssuedAt ? new Date(d.lastIssuedAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-t border-border/40 bg-muted/10">
                      <td colSpan={6} className="px-4 py-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted-foreground/70 text-[9px] font-semibold uppercase tracking-[0.1em]">
                              <th className="py-1.5">Item</th>
                              <th className="py-1.5 text-right">Qty</th>
                              <th className="py-1.5 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {d.items.map((it) => (
                              <tr key={it.stockItemId}>
                                <td className="py-1.5">
                                  {it.name}
                                  {it.unit && <span className="ml-2 text-xs text-muted-foreground/60">{it.unit}</span>}
                                </td>
                                <td className="py-1.5 text-right tabular-nums">{it.quantity.toLocaleString()}</td>
                                <td className="py-1.5 text-right tabular-nums">{it.value.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {consumption.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground/70">
                  No internal issues recorded yet — issue stock to a department from Requisitions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
