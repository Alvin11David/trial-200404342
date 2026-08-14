import { useState } from "react";
import { useStore } from "@/lib/pms-store";
import { Tag, Search } from "lucide-react";

const DEPT_META: Record<string, { label: string; icon: string }> = {
  POOL: { label: "Pool", icon: "🏊" },
  KPOOL: { label: "Kids Pool", icon: "👶" },
  REC: { label: "Recreation", icon: "🎾" },
  BIZ: { label: "Business Center", icon: "💼" },
  CONF: { label: "Conference", icon: "🏢" },
  HC: { label: "Health Club", icon: "💪" },
  SPA: { label: "Spa", icon: "🧖" },
  REST: { label: "Restaurant", icon: "🍽️" },
  BAR: { label: "Bar", icon: "🍸" },
  MISC: { label: "General / Misc", icon: "📋" },
};

const DEPT_ORDER = ["POOL", "KPOOL", "REC", "BIZ", "CONF", "HC", "SPA", "REST", "BAR", "MISC"];

export default function RateCardPage() {
  const items = useStore((s) => s.miscChargeItems.filter((m) => m.isActive));
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  const filtered = items.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !(i.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDept !== "all" && i.departmentCode !== filterDept) return false;
    return true;
  });

  const grouped: Record<string, typeof items> = {};
  for (const item of filtered) {
    const key = item.departmentCode ?? "";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  function fmt(n: number) {
    return n.toLocaleString();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Tag className="h-6 w-6 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Service Price List</h1>
          <p className="text-sm text-muted-foreground">Standard rates for all hotel services — use when quoting guests.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
        >
          <option value="all">All Departments</option>
          {DEPT_ORDER.map((d) => (
            <option key={d} value={d}>{DEPT_META[d]?.label ?? d}</option>
          ))}
        </select>
      </div>

      <div className="space-y-8">
        {DEPT_ORDER.filter((d) => grouped[d]?.length).map((dept) => (
          <div key={dept}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{DEPT_META[dept]?.icon}</span>
              <h2 className="text-lg font-semibold">{DEPT_META[dept]?.label ?? dept}</h2>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Description</th>
                    <th className="px-4 py-3 text-right">Standard Price</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[dept].map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{item.description ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{fmt(item.defaultPrice)} UGX</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="mx-auto h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No services match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
