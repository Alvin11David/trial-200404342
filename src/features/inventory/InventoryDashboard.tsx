import { useStore, lowStockAlerts, stockTotalValue, stockItemById, storageLocationById } from "@/lib/pms-store";
import { Package, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const items = useStore((s) => s.stockItems);
  const pendingPOs = useStore((s) => s.purchaseOrders.filter((po) => po.status === "pending" || po.status === "approved" || po.status === "sent" || po.status === "partially_received"));
  const pendingReqs = useStore((s) => s.requisitions.filter((r) => r.status === "pending"));
  const pendingAdjustments = useStore((s) => s.stockAdjustments.filter((a) => a.status === "pending"));
  const pendingStocktakes = useStore((s) => s.stocktakes.filter((t) => t.status === "finalized"));
  const recentMovements = useStore((s) => s.stockMovements.slice(0, 10));
  const lowStock = lowStockAlerts();
  const totalValue = stockTotalValue();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Inventory Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Package className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold">{items.filter((i) => i.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{lowStock.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <TrendingDown className="text-amber-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold">{pendingPOs.length + pendingReqs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Stock Value</p>
              <p className="text-lg font-bold text-green-700">{totalValue.toLocaleString()} UGX</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Low Stock Items</h2>
            <button onClick={() => navigate("/inventory/par-levels")} className="text-sm text-blue-600 hover:underline">View All</button>
          </div>
          <div className="p-4">
            {lowStock.length === 0 ? (
              <p className="text-gray-500 text-sm">No low stock items</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Store</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Shortfall</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 8).map((a) => (
                    <tr key={`${a.stockItemId}:${a.storageLocationId}`} className="border-t">
                      <td className="py-2 font-medium">{stockItemById(a.stockItemId)?.name ?? a.stockItemId}</td>
                      <td className="py-2">{storageLocationById(a.storageLocationId)?.name ?? "—"}</td>
                      <td className="py-2 text-red-600 font-bold">{a.current}</td>
                      <td className="py-2 font-semibold">{a.shortfall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Recent Movements</h2>
          </div>
          <div className="p-4 space-y-2">
            {recentMovements.length === 0 ? (
              <p className="text-gray-500 text-sm">No movements yet</p>
            ) : (
              recentMovements.map((m) => {
                const item = items.find((i) => i.id === m.stockItemId);
                return (
                  <div key={m.id} className="flex justify-between items-center text-sm border-b pb-1">
                    <span className="truncate max-w-[140px]">{item?.name ?? m.stockItemId}</span>
                    <span className={m.quantity > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Pending Purchase Orders</h2>
            <button onClick={() => navigate("/inventory/purchase-orders")} className="text-sm text-blue-600 hover:underline">Manage</button>
          </div>
          <div className="p-4">
            {pendingPOs.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending purchase orders</p>
            ) : (
              pendingPOs.map((po) => (
                <div key={po.id} className="flex justify-between items-center text-sm border-b py-2">
                  <span className="font-medium">{po.orderNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    po.status === "pending" ? "bg-yellow-100 text-yellow-700" : po.status === "approved" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }`}>{po.status === "partially_received" ? "partial" : po.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Pending Requisitions</h2>
            <button onClick={() => navigate("/inventory/requisitions")} className="text-sm text-blue-600 hover:underline">Manage</button>
          </div>
          <div className="p-4">
            {pendingReqs.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending requisitions</p>
            ) : (
              pendingReqs.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm border-b py-2">
                  <span className="font-medium">{r.id}</span>
                  <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded text-xs font-medium">{r.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Pending Adjustments</h2>
            <button onClick={() => navigate("/inventory/adjustments")} className="text-sm text-blue-600 hover:underline">Manage</button>
          </div>
          <div className="p-4">
            {pendingAdjustments.length === 0 ? (
              <p className="text-gray-500 text-sm">No adjustments awaiting approval</p>
            ) : (
              pendingAdjustments.map((a) => (
                <div key={a.id} className="flex justify-between items-center text-sm border-b py-2">
                  <span className="font-medium">{a.id} — {a.type}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">{a.type === "theft" || a.type === "breakage" ? a.type : "approval"}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Pending Stocktaking</h2>
            <button onClick={() => navigate("/inventory/stocktaking")} className="text-sm text-blue-600 hover:underline">Manage</button>
          </div>
          <div className="p-4">
            {pendingStocktakes.length === 0 ? (
              <p className="text-gray-500 text-sm">No counts awaiting reconciliation</p>
            ) : (
              pendingStocktakes.map((st) => (
                <div key={st.id} className="flex justify-between items-center text-sm border-b py-2">
                  <span className="font-medium">{st.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">to reconcile</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
