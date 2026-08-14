import { useMemo, useState } from "react";
import {
  useStore,
  activeReservationForRoom,
  minibarRoomStock,
  minibarRoomHistory,
  restockMinibar,
  reviewMinibarLog,
  logMinibarConsumption,
  nextMinibarItemId,
  upsertMinibarItem,
  deleteMinibarItem,
  quantityAtLocation,
  storageLocationById,
  stockItemById,
  roomTypeById,
  folioById,
  type Room,
  type MinibarItem,
  type MinibarLog,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import {
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
  Users,
  Edit2,
  Trash2,
  Eye,
  ArrowDownToLine,
  MinusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

const fmt = (n: number) => "UGX " + Math.round(n).toLocaleString();

const roomStatusBadge = (s: string) => {
  const map: Record<string, string> = {
    available: "bg-success/15 text-success",
    clean: "bg-success/15 text-success",
    inspected: "bg-success/15 text-success",
    occupied: "bg-primary/15 text-primary",
    dirty: "bg-warning/15 text-warning",
    in_progress: "bg-warning/15 text-warning",
    maintenance: "bg-destructive/15 text-destructive",
    blocked: "bg-destructive/15 text-destructive",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-muted text-muted-foreground"}`;
};

const BAR_STORE = "SL003";

type RestockLine = { id: string; qty: string };

export default function MinibarPage() {
  const rooms = useStore((s) => s.rooms);
  const minibarItems = useStore((s) => s.minibarItems);
  const minibarLogs = useStore((s) => s.minibarLogs);
  const { role } = useRole();
  const actor = ROLE_META[role].person;

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Room | null>(null);
  const [restockModal, setRestockModal] = useState<{ room: Room; lines: RestockLine[] } | null>(null);
  const [consumeModal, setConsumeModal] = useState<{ room: Room; itemId: string } | null>(null);
  const [consumeQty, setConsumeQty] = useState("1");
  const [catalogOpen, setCatalogOpen] = useState(false);

  const barStore = storageLocationById(BAR_STORE);

  const roomStock = useMemo(() => {
    const map = new Map<string, ReturnType<typeof minibarRoomStock>>();
    for (const room of rooms) {
      if (!room.isActive) continue;
      map.set(room.id, minibarRoomStock(room.id));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, minibarItems, minibarLogs]);

  const pendingReviews = useMemo(
    () => minibarLogs.filter((l) => l.supervisorReviewRequired && !l.supervisorReviewedBy),
    [minibarLogs],
  );

  const filteredRooms = rooms.filter((r) => {
    if (!r.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      const res = activeReservationForRoom(r.id);
      if (
        !r.roomNumber.toLowerCase().includes(q) &&
        !r.roomTypeId.includes(q) &&
        !(res?.guestName ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  function openRestock(room: Room, ids?: string[]) {
    const applicable = roomStock.get(room.id) ?? [];
    const lines = applicable
      .filter((s) => !ids || ids.includes(s.item.id))
      .map((s) => ({ id: s.item.id, qty: String(s.shortfall) }));
    setRestockModal({ room, lines });
  }

  function doRestock() {
    if (!restockModal) return;
    const items = restockModal.lines
      .map((l) => ({ minibarItemId: l.id, quantity: parseInt(l.qty, 10) }))
      .filter((l) => l.quantity > 0);
    if (items.length === 0) {
      toast.error("Enter a quantity to restock");
      return;
    }
    const res = restockMinibar(restockModal.room.id, items, actor);
    if (!res.ok) {
      toast.error(res.errors?.[0] ?? "Restock failed");
      return;
    }
    const total = items.reduce((s, i) => s + i.quantity, 0);
    toast.success(`Restocked ${total} item(s) to Room ${restockModal.room.roomNumber} from ${barStore?.name ?? "Bar Store"}`);
    setRestockModal(null);
  }

  function doConsume() {
    if (!consumeModal) return;
    const qty = parseInt(consumeQty, 10);
    if (qty <= 0) {
      toast.error("Enter a quantity");
      return;
    }
    const res = logMinibarConsumption({
      roomId: consumeModal.room.id,
      minibarItemId: consumeModal.itemId,
      consumedQuantity: qty,
      loggedBy: actor,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (res.warn) toast.warning(res.warn);
    else toast.success("Consumption charged to folio");
    setConsumeModal(null);
    setConsumeQty("1");
  }

  function doReview(id: string) {
    reviewMinibarLog(id, actor);
    toast.success("Consumption reviewed");
  }

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Minibar Management</h1>
            <p className="text-sm text-muted-foreground">Per-room stock vs par, restock from store, and auto-charge consumption to the guest folio</p>
          </div>
          <button onClick={() => setCatalogOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> Manage Catalog
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rooms</p>
            <p className="mt-1 text-2xl font-bold">{rooms.filter((r) => r.isActive).length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In-house w/ Minibar</p>
            <p className="mt-1 text-2xl font-bold">{rooms.filter((r) => r.isActive && activeReservationForRoom(r.id)).length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items Below Par</p>
            <p className="mt-1 text-2xl font-bold text-warning">
              {[...roomStock.values()].reduce((s, list) => s + list.filter((x) => x.shortfall > 0).length, 0)}
            </p>
          </div>
          <button onClick={() => setSelected(null)} className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-left transition hover:bg-warning/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-warning">Pending Supervisor Review</p>
            <p className="mt-1 text-2xl font-bold text-warning">{pendingReviews.length}</p>
          </button>
        </div>

        {pendingReviews.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-warning" />
              <h2 className="text-sm font-bold text-warning">Supervisor review required (consumption &gt; 150% of par)</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-1.5">Room</th>
                  <th className="py-1.5">Item</th>
                  <th className="py-1.5 text-right">Consumed</th>
                  <th className="py-1.5">Logged By</th>
                  <th className="py-1.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {pendingReviews.map((l) => (
                  <ReviewRow key={l.id} log={l} onReview={() => doReview(l.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search room, type or guest…" className={cn(inputCls, "w-72")} />
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">On-hand / Par</th>
                <th className="px-4 py-3 text-right">Below Par</th>
                <th className="px-4 py-3 text-right">Stock Value</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((r) => {
                const stock = roomStock.get(r.id) ?? [];
                const onHand = stock.reduce((s, x) => s + x.onHand, 0);
                const parTotal = stock.reduce((s, x) => s + x.par, 0);
                const below = stock.filter((x) => x.shortfall > 0);
                const value = stock.reduce((s, x) => s + x.onHand * x.item.unitSellingPrice, 0);
                const res = activeReservationForRoom(r.id);
                return (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.roomNumber}</p>
                      <span className="text-xs text-muted-foreground">{roomTypeById(r.roomTypeId)?.name ?? r.roomTypeId}</span>
                    </td>
                    <td className="px-4 py-3">
                      {res ? (
                        <p className="font-medium">{res.guestName}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">Vacant</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><span className={roomStatusBadge(r.status)}>{r.status}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums">{onHand} / {parTotal}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", below.length > 0 ? "text-warning" : "text-muted-foreground")}>
                      {below.length > 0 ? below.length : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(value)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(r)} className="flex items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-1.5 text-xs text-primary transition hover:bg-primary/10">
                        <Eye size={13} /> Open
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRooms.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground/70">No rooms match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <RoomDrawer
          room={selected}
          stock={roomStock.get(selected.id) ?? []}
          onClose={() => setSelected(null)}
          onRestock={(ids) => openRestock(selected, ids)}
          onConsume={(itemId) => {
            setConsumeQty("1");
            setConsumeModal({ room: selected, itemId });
          }}
        />
      )}

      {restockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRestockModal(null)}>
          <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Restock Minibar — Room {restockModal.room.roomNumber}</h2>
              <button onClick={() => setRestockModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Deducted from {barStore?.name ?? "Bar Store"} ({stockItemById("SI001") ? "per-item store balance validated" : ""})
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                  <th className="py-2 text-left">Item</th>
                  <th className="py-2 text-right">Par</th>
                  <th className="py-2 text-right">Shortfall</th>
                  <th className="py-2 text-right">Bar Store</th>
                  <th className="py-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {restockModal.lines.map((line) => {
                  const item = minibarItems.find((m) => m.id === line.id);
                  if (!item) return null;
                  const stock = roomStock.get(restockModal.room.id) ?? [];
                  const row = stock.find((x) => x.item.id === line.id);
                  const available = item.stockItemId ? quantityAtLocation(item.stockItemId, BAR_STORE) : null;
                  return (
                    <tr key={line.id}>
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2 text-right tabular-nums">{row?.par ?? item.parQuantity}</td>
                      <td className="py-2 text-right tabular-nums text-warning">{row?.shortfall ?? 0}</td>
                      <td className={cn("py-2 text-right tabular-nums", available !== null && available <= 0 && "text-destructive")}>
                        {available === null ? "—" : available}
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={line.qty}
                          onChange={(e) =>
                            setRestockModal((m) =>
                              m ? { ...m, lines: m.lines.map((l) => (l.id === line.id ? { ...l, qty: e.target.value } : l)) } : m,
                            )
                          }
                          className={cn(inputCls, "w-20 text-right")}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setRestockModal(null)} className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted">Cancel</button>
              <button onClick={doRestock} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                <ArrowDownToLine size={16} /> Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {consumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConsumeModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Log Consumption — Room {consumeModal.room.roomNumber}</h2>
              <button onClick={() => setConsumeModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            {(() => {
              const item = minibarItems.find((m) => m.id === consumeModal.itemId);
              if (!item) return null;
              const res = activeReservationForRoom(consumeModal.room.id);
              const folio = res?.folioId ? folioById(res.folioId) : undefined;
              return (
                <div className="space-y-4">
                  <p className="text-sm">
                    <span className="font-medium">{item.name}</span> — <span className="text-muted-foreground">{fmt(item.unitSellingPrice)} each</span>
                  </p>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Quantity consumed</label>
                    <input
                      type="number"
                      min={1}
                      value={consumeQty}
                      onChange={(e) => setConsumeQty(e.target.value)}
                      className={cn(inputCls, "mt-1 w-full")}
                    />
                  </div>
                  {res ? (
                    <p className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs">
                      <CheckCircle2 size={14} className={cn("mt-0.5 shrink-0", folio?.status === "open" ? "text-success" : "text-warning")} />
                      <span>
                        Charging <strong>{fmt(item.unitSellingPrice * parseInt(consumeQty, 10) || 0)}</strong> to <strong>{res.guestName}</strong>&apos;s folio
                        {folio ? ` (${folio.id}, ${folio.status})` : ""}. {folio?.status !== "open" && "Folio is not open — it will be logged without a charge."}
                      </span>
                    </p>
                  ) : (
                    <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <span>No in-house guest on this room. Consumption will be logged for housekeeping records only.</span>
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setConsumeModal(null)} className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted">Cancel</button>
                    <button onClick={doConsume} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                      <MinusCircle size={16} /> Log & Charge
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {catalogOpen && <CatalogModal onClose={() => setCatalogOpen(false)} />}
    </>
  );
}

function ReviewRow({ log, onReview }: { log: MinibarLog; onReview: () => void }) {
  const room = useStore((s) => s.rooms.find((r) => r.id === log.roomId));
  const item = useStore((s) => s.minibarItems.find((m) => m.id === log.minibarItemId));
  return (
    <tr>
      <td className="py-2">{room?.roomNumber ?? log.roomId}</td>
      <td className="py-2">{item?.name ?? log.minibarItemId}</td>
      <td className="py-2 text-right font-semibold tabular-nums text-destructive">{log.consumedQuantity}</td>
      <td className="py-2">{log.loggedBy}</td>
      <td className="py-2 text-right">
        <button onClick={onReview} className="flex items-center gap-1.5 rounded-lg border border-success/40 px-3 py-1 text-xs text-success transition hover:bg-success/10">
          <CheckCircle2 size={13} /> Review
        </button>
      </td>
    </tr>
  );
}

function RoomDrawer({
  room,
  stock,
  onClose,
  onRestock,
  onConsume,
}: {
  room: Room;
  stock: ReturnType<typeof minibarRoomStock>;
  onClose: () => void;
  onRestock: (ids: string[]) => void;
  onConsume: (itemId: string) => void;
}) {
  const history = minibarRoomHistory(room.id);
  const res = activeReservationForRoom(room.id);
  const items = useStore((s) => s.minibarItems);
  const belowPar = stock.filter((x) => x.shortfall > 0);
  return (
    <div className="fixed inset-0 z-40 flex bg-black/40" onClick={onClose}>
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <h2 className="text-xl font-bold">Room {room.roomNumber}</h2>
            <p className="text-sm text-muted-foreground">{roomTypeById(room.roomTypeId)?.name ?? room.roomTypeId} · <span className={roomStatusBadge(room.status)}>{room.status}</span></p>
            {res && (
              <p className="mt-2 flex items-center gap-1.5 text-sm">
                <Users size={14} className="text-muted-foreground" /> {res.guestName} · Folio {res.folioId ?? "—"}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => onRestock(belowPar.map((x) => x.item.id))}
              disabled={belowPar.length === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
            >
              <RefreshCw size={14} /> Restock Below Par ({belowPar.length})
            </button>
          </div>

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock vs Par</h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left text-muted-foreground">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2 text-right">On-hand</th>
                  <th className="px-3 py-2 text-right">Par</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {stock.map((x) => (
                  <tr key={x.item.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium">{x.item.name}</p>
                      <span className="text-xs text-muted-foreground">{fmt(x.item.unitSellingPrice)} each</span>
                    </td>
                    <td className={cn("px-3 py-2 text-right font-semibold tabular-nums", x.onHand === 0 ? "text-destructive" : x.shortfall > 0 ? "text-warning" : "text-success")}>
                      {x.onHand}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{x.par}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => onRestock([x.item.id])} title="Restock" className="rounded border border-border p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <RefreshCw size={13} />
                        </button>
                        <button onClick={() => onConsume(x.item.id)} title="Log consumption" className="rounded border border-border p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <MinusCircle size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mb-2 mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History size={13} /> Activity
          </h3>
          <div className="space-y-2">
            {history.length === 0 && <p className="text-sm text-muted-foreground/70">No activity logged for this room yet.</p>}
            {history.map((l) => {
              const item = items.find((m) => m.id === l.minibarItemId);
              return (
                <div key={l.id} className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {l.restockedQuantity > 0 && <span className="text-success">Restocked {l.restockedQuantity}× {item?.name}</span>}
                      {l.consumedQuantity > 0 && <span className="text-warning">Consumed {l.consumedQuantity}× {item?.name}</span>}
                    </p>
                    <span className="text-xs text-muted-foreground">{new Date(l.loggedAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    by {l.loggedBy}
                    {l.folioChargeId && <span className="ml-2 text-success">Charged · {l.folioChargeId}</span>}
                    {l.supervisorReviewRequired && (
                      <span className={cn("ml-2", l.supervisorReviewedBy ? "text-success" : "text-destructive")}>
                        {l.supervisorReviewedBy ? `Reviewed by ${l.supervisorReviewedBy}` : "Review required"}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogModal({ onClose }: { onClose: () => void }) {
  const items = useStore((s) => s.minibarItems);
  const roomTypes = useStore((s) => s.roomTypes);
  const stockItems = useStore((s) => s.stockItems);
  const [edit, setEdit] = useState<MinibarItem | null>(null);
  const [form, setForm] = useState({ name: "", parQuantity: "4", unitSellingPrice: "10000", roomTypeId: "", stockItemId: "", isActive: true });

  function startNew() {
    setForm({ name: "", parQuantity: "4", unitSellingPrice: "10000", roomTypeId: "", stockItemId: "", isActive: true });
    setEdit(null);
  }

  function startEdit(i: MinibarItem) {
    setForm({
      name: i.name,
      parQuantity: String(i.parQuantity),
      unitSellingPrice: String(i.unitSellingPrice),
      roomTypeId: i.roomTypeId ?? "",
      stockItemId: i.stockItemId ?? "",
      isActive: i.isActive,
    });
    setEdit(i);
  }

  function save() {
    const name = form.name.trim();
    const par = parseInt(form.parQuantity, 10);
    const price = parseInt(form.unitSellingPrice, 10);
    if (!name) { toast.error("Enter an item name"); return; }
    if (par <= 0) { toast.error("Par quantity must be positive"); return; }
    if (price <= 0) { toast.error("Enter a valid selling price"); return; }
    if (!form.stockItemId) { toast.error("Select a linked stock item so restock can deduct from inventory"); return; }
    const now = new Date().toISOString();
    upsertMinibarItem({
      id: edit?.id ?? nextMinibarItemId(),
      propertyId: "T001",
      stockItemId: form.stockItemId,
      roomTypeId: form.roomTypeId || undefined,
      name,
      parQuantity: par,
      unitSellingPrice: price,
      vatTreatment: "inclusive",
      isActive: form.isActive,
      createdAt: edit?.createdAt ?? now,
      updatedAt: now,
    });
    toast.success(edit ? "Minibar item updated" : "Minibar item created");
    setEdit(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Minibar Catalog</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Item name (e.g. Orange Juice 330ml)" className={cn(inputCls, "flex-1")} />
          <input type="number" value={form.parQuantity} onChange={(e) => setForm({ ...form, parQuantity: e.target.value })} placeholder="Par" className={cn(inputCls, "w-20")} title="Par quantity" />
          <input type="number" value={form.unitSellingPrice} onChange={(e) => setForm({ ...form, unitSellingPrice: e.target.value })} placeholder="Price" className={cn(inputCls, "w-24")} title="Selling price" />
          <select value={form.stockItemId} onChange={(e) => setForm({ ...form, stockItemId: e.target.value })} className={cn(inputCls, "w-44")} title="Linked stock item">
            <option value="">— Stock item —</option>
            {stockItems.filter((s) => s.isActive).map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.sku})</option>
            ))}
          </select>
          <select value={form.roomTypeId} onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })} className={cn(inputCls, "w-36")}>
            <option value="">All room types</option>
            {roomTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            {edit ? "Update" : "Add"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2 text-right">Par</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2">Applicable To</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items.map((i) => (
                <tr key={i.id} className={cn(!i.isActive && "opacity-50")}>
                  <td className="px-4 py-2">
                    <p className="font-medium">{i.name}</p>
                    <span className="font-mono text-[10px] text-muted-foreground/60">{i.id}{i.stockItemId ? ` · ${stockItemById(i.stockItemId)?.sku ?? i.stockItemId}` : " · no stock link"}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{i.parQuantity}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmt(i.unitSellingPrice)}</td>
                  <td className="px-4 py-2">{i.roomTypeId ? roomTypes.find((t) => t.id === i.roomTypeId)?.name ?? i.roomTypeId : "All room types"}</td>
                  <td className="px-4 py-2"><span className={i.isActive ? "bg-success/15 px-2 py-0.5 rounded text-xs text-success" : "bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground"}>{i.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(i)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${i.name} from the minibar catalog?`)) {
                            deleteMinibarItem(i.id);
                            toast.success("Minibar item deleted");
                          }
                        }}
                        className="rounded p-1 text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground/70">No minibar items yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={startNew} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus size={13} /> New item
          </button>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary" /> Active
            </label>
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
